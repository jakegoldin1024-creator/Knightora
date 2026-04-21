/**
 * Validates onboarding + daily puzzle FENs and from/to moves with chess.js.
 *
 * Run: npx tsx scripts/validate-puzzle-catalog.ts
 */
import { Chess } from "chess.js";
import { DAILY_PUZZLES } from "../data/daily-puzzles";
import { ONBOARDING_PUZZLES } from "../data/onboarding-puzzles";

function assertMove(fen: string, from: string, to: string, label: string) {
  const chess = new Chess(fen);
  const before = chess.fen();
  const move = chess.move({ from, to, promotion: "q" });
  if (!move) {
    throw new Error(`[${label}] illegal move ${from}-${to} on ${fen}`);
  }
  if (chess.fen() === before) {
    throw new Error(`[${label}] move did not change position`);
  }
}

function main() {
  const issues: string[] = [];
  for (const p of ONBOARDING_PUZZLES) {
    try {
      assertMove(p.fen, p.from, p.to, `onboarding:${p.id}`);
    } catch (e) {
      issues.push(e instanceof Error ? e.message : String(e));
    }
  }
  for (const p of DAILY_PUZZLES) {
    try {
      assertMove(p.fen, p.from, p.to, `daily:${p.id}`);
    } catch (e) {
      issues.push(e instanceof Error ? e.message : String(e));
    }
  }
  if (issues.length) {
    console.error("[validate-puzzle-catalog] FAILED:\n" + issues.join("\n"));
    process.exit(1);
  }
  console.log(`[validate-puzzle-catalog] OK (${ONBOARDING_PUZZLES.length} onboarding + ${DAILY_PUZZLES.length} daily).`);
}

main();
