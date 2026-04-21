import type { DailyPuzzle } from "@/data/daily-puzzles";

const USER_AGENT = "Knightneo/0.1 (lichess puzzle batch; https://lichess.org/api)";

function uciToFromTo(uci: string): { from: string; to: string } | null {
  if (uci.length < 4) return null;
  return { from: uci.slice(0, 2), to: uci.slice(2, 4) };
}

async function fetchJson(url: string): Promise<Record<string, unknown>> {
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": USER_AGENT },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Lichess HTTP ${res.status}`);
  return (await res.json()) as Record<string, unknown>;
}

/**
 * Fetches up to `count` puzzles from Lichess (one `next` + one `by id` per puzzle).
 * Respects Lichess guidance to avoid parallel hammering.
 */
export async function fetchLichessPuzzleBatch(count: number): Promise<DailyPuzzle[]> {
  const out: DailyPuzzle[] = [];
  const safeCount = Math.min(12, Math.max(1, Math.floor(count)));

  for (let i = 0; i < safeCount; i++) {
    const next = await fetchJson("https://lichess.org/api/puzzle/next");
    const puzzleBrief = next.puzzle as Record<string, unknown> | undefined;
    const id = typeof puzzleBrief?.id === "string" ? puzzleBrief.id : null;
    if (!id) continue;

    await new Promise((r) => setTimeout(r, 200));

    const full = await fetchJson(`https://lichess.org/api/puzzle/${encodeURIComponent(id)}`);
    const pz = full.puzzle as Record<string, unknown> | undefined;
    if (!pz) continue;
    const fen = typeof pz.fen === "string" ? pz.fen : null;
    const solution = pz.solution;
    const sol0 = Array.isArray(solution) && typeof solution[0] === "string" ? solution[0] : null;
    if (!fen || !sol0) continue;

    const ft = uciToFromTo(sol0);
    if (!ft) continue;

    const rating = typeof pz.rating === "number" ? pz.rating : null;
    const themes = Array.isArray(pz.themes) ? (pz.themes as string[]).slice(0, 4).join(", ") : "puzzle";

    out.push({
      id: `lichess-${id}`,
      fen,
      from: ft.from,
      to: ft.to,
      hint: rating != null ? `${themes} · Lichess ~${rating}` : `${themes} · Lichess puzzle`,
      tier: 2,
    });

    await new Promise((r) => setTimeout(r, 120));
  }

  return out;
}
