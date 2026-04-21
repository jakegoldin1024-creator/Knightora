import type { PuzzleDiagnostic, RatingBand } from "@/lib/recommendations";

/** One-move daily tactics entry (from → to must match). */
export type DailyPuzzle = {
  id: string;
  fen: string;
  from: string;
  to: string;
  hint: string;
  /** Rough difficulty — higher tiers unlock with rating / diagnostic. */
  tier: 1 | 2 | 3;
};

const RATING_ORDER: RatingBand[] = ["beginner", "developing", "improving", "advanced"];

function ratingTier(rating: RatingBand): number {
  return RATING_ORDER.indexOf(rating);
}

function diagnosticTier(d: PuzzleDiagnostic | null | undefined): number {
  if (!d || d.attempted === 0) return 1;
  const acc = d.correct / d.attempted;
  if (acc >= 0.8) return 3;
  if (acc >= 0.5) return 2;
  return 1;
}

/**
 * Curated static set — verified with chess.js when added.
 * Mix of mates and winning captures / tactics.
 */
export const DAILY_PUZZLES: DailyPuzzle[] = [
  {
    id: "dq-qg7",
    fen: "7k/5Q2/6K1/8/8/8/8/8 w - - 0 1",
    from: "f7",
    to: "g7",
    hint: "Mate in one.",
    tier: 1,
  },
  {
    id: "dq-re8",
    fen: "6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1",
    from: "e1",
    to: "e8",
    hint: "Back rank mate.",
    tier: 1,
  },
  {
    id: "dq-rxe8",
    fen: "4r1k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1",
    from: "e1",
    to: "e8",
    hint: "Take the rook.",
    tier: 2,
  },
  {
    id: "dq-bxd8",
    fen: "3k4/8/3n4/6B1/8/8/8/3K4 w - - 0 1",
    from: "g5",
    to: "d8",
    hint: "Win the queen.",
    tier: 2,
  },
  {
    id: "dq-rg7",
    fen: "2k3R1/8/3K3P/8/8/8/8/8 w - - 0 1",
    from: "g8",
    to: "g7",
    hint: "Back rank — find the mate.",
    tier: 3,
  },
  {
    id: "dq-qxf7",
    fen: "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4",
    from: "h5",
    to: "f7",
    hint: "Classic f7 strike — make it count.",
    tier: 3,
  },
];

export function maxPuzzleTierForPlayer(rating: RatingBand, diagnostic: PuzzleDiagnostic | null | undefined): 1 | 2 | 3 {
  const r = ratingTier(rating);
  const d = diagnosticTier(diagnostic);
  const combined = Math.min(3, Math.max(1, Math.round((r + 1 + d) / 2)));
  return combined as 1 | 2 | 3;
}

export function getDailyPuzzlePool(rating: RatingBand, diagnostic: PuzzleDiagnostic | null | undefined): DailyPuzzle[] {
  const cap = maxPuzzleTierForPlayer(rating, diagnostic);
  return DAILY_PUZZLES.filter((p) => p.tier <= cap);
}

/** Build a session list of length `count` (repeats from the pool if needed). */
export function pickDailyTacticsPuzzles(
  rating: RatingBand,
  diagnostic: PuzzleDiagnostic | null | undefined,
  count: number,
): DailyPuzzle[] {
  const pool = getDailyPuzzlePool(rating, diagnostic);
  if (!pool.length || count <= 0) return [];
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return Array.from({ length: count }, (_, i) => shuffled[i % shuffled.length]!);
}
