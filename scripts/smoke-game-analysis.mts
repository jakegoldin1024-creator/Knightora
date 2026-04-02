/**
 * Smoke tests for game analysis (no test runner).
 *
 * Always runs: PGN validation + analysis pipeline.
 *
 * Optional env:
 * - SMOKE_BASE_URL — e.g. http://127.0.0.1:3000 — POST /api/game-analysis expects 403 with no session cookie.
 * - SMOKE_NETWORK=1 plus SMOKE_LICHESS_URL and/or SMOKE_CHESSCOM_URL — live import (needs network).
 */

import { analyzeGamePgn } from "../lib/game-analysis.ts";
import { importGameFromInput } from "../lib/game-import.ts";

const MINIMAL_PGN = `[Event "Smoke"]
[Site "?"]
[Date "2024.01.01"]
[Round "?"]
[White "A"]
[Black "B"]
[Result "*"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d3 d6 *`;

function assert(cond: boolean, message: string) {
  if (!cond) throw new Error(`ASSERT: ${message}`);
}

async function runLibSmoke() {
  const imported = await importGameFromInput({ pgn: MINIMAL_PGN });
  assert(imported.source === "pgn", "PGN import should mark source pgn");
  assert(imported.pgn.includes("1. e4"), "Imported PGN should retain moves");

  const report = analyzeGamePgn({
    pgn: imported.pgn,
    source: imported.source,
    level: "developing",
  });
  assert(report.moves.length >= 8, "Analysis should cover at least 8 plies");
  assert(report.summary.opening.length > 0, "Opening summary string should exist");
  assert(report.recommendations.length > 0, "Recommendations should be non-empty");
}

async function runApiGateSmoke() {
  const base = process.env.SMOKE_BASE_URL?.replace(/\/$/, "");
  if (!base) {
    console.log("[smoke] Skip API gate: set SMOKE_BASE_URL to test /api/game-analysis 403 without auth.");
    return;
  }

  const res = await fetch(`${base}/api/game-analysis`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ level: "developing", pgn: MINIMAL_PGN }),
  });

  assert(res.status === 403, `Expected 403 for unauthenticated/free plan, got ${res.status}`);
  const body = (await res.json()) as { error?: string };
  assert(Boolean(body.error), "403 response should include error message");
}

async function runNetworkImportSmoke() {
  if (process.env.SMOKE_NETWORK !== "1") {
    console.log("[smoke] Skip network import: set SMOKE_NETWORK=1 and URL env vars to test Chess.com/Lichess fetch.");
    return;
  }

  const lichessUrl = process.env.SMOKE_LICHESS_URL?.trim();
  const chessUrl = process.env.SMOKE_CHESSCOM_URL?.trim();

  if (!lichessUrl && !chessUrl) {
    throw new Error("SMOKE_NETWORK=1 requires SMOKE_LICHESS_URL and/or SMOKE_CHESSCOM_URL");
  }

  if (lichessUrl) {
    const g = await importGameFromInput({ url: lichessUrl });
    assert(g.source === "lichess", "Lichess URL should set source lichess");
    assert(g.pgn.includes("["), "Lichess PGN should have headers");
  }

  if (chessUrl) {
    const g = await importGameFromInput({ url: chessUrl });
    assert(g.source === "chesscom", "Chess.com URL should set source chesscom");
    assert(g.pgn.includes("["), "Chess.com PGN should have headers");
  }
}

async function main() {
  console.log("[smoke] lib: PGN + analyzeGamePgn");
  await runLibSmoke();
  console.log("[smoke] lib: OK");

  console.log("[smoke] api: gate (optional)");
  await runApiGateSmoke();
  console.log("[smoke] api: OK or skipped");

  console.log("[smoke] network: import (optional)");
  await runNetworkImportSmoke();
  console.log("[smoke] network: OK or skipped");

  console.log("[smoke] all checks passed.");
}

main().catch((err) => {
  console.error("[smoke] FAILED:", err instanceof Error ? err.message : err);
  process.exit(1);
});
