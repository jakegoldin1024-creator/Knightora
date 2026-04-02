type StockfishEngine = {
  postMessage: (command: string) => void;
  onmessage: ((event: MessageEvent<string> | { data: string }) => void) | null;
  terminate?: () => void;
};

export async function createStockfishEngine(): Promise<StockfishEngine> {
  // Create a Worker that loads Stockfish from a CDN at runtime.
  // This avoids bundler issues with WASM worker assets in Next/Turbopack.
  const base = "https://cdn.jsdelivr.net/npm/stockfish@18.0.5/";
  const workerCode = `
    self.onmessage = self.onmessage || null;
    self.Module = {
      locateFile: function(path) {
        return "${base}" + path;
      }
    };
    importScripts("${base}stockfish.js");
  `;
  const blob = new Blob([workerCode], { type: "application/javascript" });
  const url = URL.createObjectURL(blob);
  const worker = new Worker(url);
  // Keep URL alive until worker has loaded its script.
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return worker as unknown as StockfishEngine;
}

export type StockfishEval = {
  depth: number;
  /** Centipawns from side to move perspective (positive = better). */
  cp: number | null;
  mate: number | null;
  pv: string[];
};

export async function analyzeFenWithStockfish(input: {
  fen: string;
  depth: number;
  multiPv?: number;
  onInfo?: (evalLine: StockfishEval) => void;
  signal?: AbortSignal;
}): Promise<StockfishEval | null> {
  const engine = await createStockfishEngine();

  let best: StockfishEval | null = null;
  let bestDepth = 0;
  const multiPv = Math.max(1, Math.min(3, input.multiPv ?? 1));
  let workerError: Error | null = null;

  const cleanup = () => {
    try {
      engine.postMessage("quit");
    } catch {
      /* ignore */
    }
    try {
      engine.terminate?.();
    } catch {
      /* ignore */
    }
  };

  if (input.signal) {
    if (input.signal.aborted) {
      cleanup();
      return null;
    }
    input.signal.addEventListener("abort", cleanup, { once: true });
  }
  const onWorkerError = (event: ErrorEvent) => {
    workerError = new Error(event.message || "Stockfish worker failed to start.");
  };
  (engine as unknown as Worker).addEventListener?.("error", onWorkerError);

  let seenUciOk = false;
  let seenReadyOk = false;

  engine.onmessage = (event) => {
    const line = typeof (event as any).data === "string" ? (event as any).data : "";
    if (!line) return;
    if (line.includes("uciok")) seenUciOk = true;
    if (line.includes("readyok")) seenReadyOk = true;

    // Example:
    // info depth 14 seldepth 18 multipv 1 score cp 23 pv e2e4 e7e5 ...
    if (line.startsWith("info ") && line.includes(" pv ")) {
      const depthMatch = /depth (\d+)/.exec(line);
      const cpMatch = /score cp (-?\d+)/.exec(line);
      const mateMatch = /score mate (-?\d+)/.exec(line);
      const pvMatch = / pv (.+)$/.exec(line);
      const depth = depthMatch ? Number(depthMatch[1]) : 0;
      const pv = pvMatch ? pvMatch[1].trim().split(/\s+/) : [];

      const evalLine: StockfishEval = {
        depth,
        cp: cpMatch ? Number(cpMatch[1]) : null,
        mate: mateMatch ? Number(mateMatch[1]) : null,
        pv,
      };

      if (!best || evalLine.depth >= best.depth) {
        best = evalLine;
        bestDepth = evalLine.depth;
      }
      input.onInfo?.(evalLine);
    }
  };

  try {
    engine.postMessage("uci");
    const startedHandshake = Date.now();
    while (!input.signal?.aborted && !seenUciOk && Date.now() - startedHandshake < 4000) {
      if (workerError) throw workerError;
      await new Promise((r) => setTimeout(r, 40));
    }
    if (!seenUciOk) {
      throw new Error("Stockfish engine did not initialize (uciok timeout).");
    }
    engine.postMessage("isready");
    const startedReady = Date.now();
    while (!input.signal?.aborted && !seenReadyOk && Date.now() - startedReady < 4000) {
      if (workerError) throw workerError;
      await new Promise((r) => setTimeout(r, 40));
    }
    if (!seenReadyOk) {
      throw new Error("Stockfish engine did not become ready (readyok timeout).");
    }
    engine.postMessage(`setoption name MultiPV value ${multiPv}`);
    engine.postMessage("ucinewgame");
    engine.postMessage(`position fen ${input.fen}`);
    engine.postMessage(`go depth ${Math.max(6, Math.min(22, input.depth))}`);

    // Wait for best/finish. We treat reaching the requested depth as "done enough".
    const targetDepth = Math.max(6, Math.min(22, input.depth));
    const started = Date.now();

    while (!input.signal?.aborted) {
      if (workerError) throw workerError;
      if (bestDepth >= targetDepth) break;
      if (Date.now() - started > 12_000) break;
      await new Promise((r) => setTimeout(r, 120));
    }

    return best;
  } finally {
    (engine as unknown as Worker).removeEventListener?.("error", onWorkerError);
    cleanup();
  }
}

