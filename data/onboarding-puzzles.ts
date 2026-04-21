import type { RatingBand } from "@/lib/recommendations";

/** One-move onboarding diagnostic (from → to must match). */
export type OnboardingPuzzle = {
  id: string;
  fen: string;
  from: string;
  to: string;
  hint: string;
  minRating?: RatingBand;
};

const ORDER: RatingBand[] = ["beginner", "developing", "improving", "advanced"];

function bandAtLeast(profile: RatingBand, min: RatingBand): boolean {
  return ORDER.indexOf(profile) >= ORDER.indexOf(min);
}

/** Verified with chess.js — mate-in-one or a clear winning capture. */
export const ONBOARDING_PUZZLES: OnboardingPuzzle[] = [
  {
    id: "ob-qg7",
    fen: "7k/5Q2/6K1/8/8/8/8/8 w - - 0 1",
    from: "f7",
    to: "g7",
    hint: "Deliver mate in one.",
    minRating: "beginner",
  },
  {
    id: "ob-re8",
    fen: "6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1",
    from: "e1",
    to: "e8",
    hint: "Back rank — finish the game.",
    minRating: "beginner",
  },
  {
    id: "ob-rxe8",
    fen: "4r1k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1",
    from: "e1",
    to: "e8",
    hint: "Take the rook and end it.",
    minRating: "developing",
  },
  {
    id: "ob-bxd8",
    fen: "3k4/8/3n4/6B1/8/8/8/3K4 w - - 0 1",
    from: "g5",
    to: "d8",
    hint: "Win the queen on d8.",
    minRating: "developing",
  },
  {
    id: "ob-qg7b",
    fen: "7k/5Q2/6K1/8/8/8/8/8 w - - 0 1",
    from: "f7",
    to: "g7",
    hint: "Same pattern — lock in the mate.",
    minRating: "improving",
  },
];

export function getOnboardingPuzzleSet(rating: RatingBand): OnboardingPuzzle[] {
  return ONBOARDING_PUZZLES.filter((p) => !p.minRating || bandAtLeast(rating, p.minRating)).slice(0, 5);
}
