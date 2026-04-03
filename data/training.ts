import type { SubscriptionPlan } from "@/lib/subscription";
import type { OpeningLine } from "@/lib/opening-line";
import { buildOpeningLineFromSanMoves } from "@/lib/opening-line";
import {
  CLUB_EXTRA_LINE_MOVES,
  DEVIATION_LINE_MOVES,
  MAIN_LINE_MOVES,
  MAIN_LINE_STEP_HINTS,
  PRO_EXTRA_LINE_MOVES,
  STARTER_EXTRA_LINE_MOVES,
} from "@/data/opening-line-sequences";
import { OPENING_TRAINING_VOICE } from "@/lib/opening-training-voice";

export type TrainingLesson = {
  id: string;
  title: string;
  chapter?: string;
  focus: string;
  prompt: string;
  choices: string[];
  answer: string;
  explanation: string;
  board?: {
    instruction: string;
    sourceSquare?: string;
    targetSquare: string;
    pieces: Array<{
      square: string;
      piece: string;
    }>;
  };
  /** Multi-move opening line: tap each move in order (generated from SAN). */
  line?: OpeningLine;
  /** Shown after opponent-deviation line drills: what to aim for in the middlegame. */
  deviationPlan?: string;
  /** If set, lesson requires this plan tier or higher. */
  minPlan?: SubscriptionPlan;
  /** Variation branch this lesson belongs to (for branch-specific routing). */
  variationId?: string;
};

export type TrainingTrackIntro = {
  whyThisOpening: string;
  history: string;
  viability: string;
};

export type TrainingVariation = {
  id: string;
  label: string;
  summary: string;
  style: "positional" | "balanced" | "tactical";
  risk: "low" | "medium" | "high";
  theoryLoad: "light" | "medium" | "heavy";
  tempo: string;
  middlegamePlans: string[];
  fitSignals: string[];
  sampleLine: string;
  timeControlFit: string;
  commonMistakes: string[];
};

export type TrainingTrack = {
  headline: string;
  modules: string[];
  studies?: string[];
  lessons: TrainingLesson[];
  intro?: TrainingTrackIntro;
  variations?: TrainingVariation[];
};

export const trainingCatalog: Record<string, TrainingTrack> = {
  italian: {
    headline: "Build calm attacking habits without drowning in theory.",
    modules: ["Core setup", "Center tension", "Kingside pressure"],
    lessons: [
      {
        id: "italian-1",
        title: "Italian setup",
        focus: "Core setup",
        prompt: "In the quiet Italian structure, click White's next move after `1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5 4.c3 Nf6`.",
        choices: [],
        answer: "d3",
        explanation: "After c3, White often follows with d3 to stabilize the center before launching piece play and kingside pressure.",
        board: {
          instruction: "Tap the destination square for the pawn on d2.",
          sourceSquare: "d2",
          targetSquare: "d3",
          pieces: [
            { square: "e1", piece: "K" },
            { square: "d1", piece: "Q" },
            { square: "a1", piece: "R" },
            { square: "h1", piece: "R" },
            { square: "c1", piece: "B" },
            { square: "c4", piece: "B" },
            { square: "b1", piece: "N" },
            { square: "f3", piece: "N" },
            { square: "a2", piece: "P" },
            { square: "b2", piece: "P" },
            { square: "c3", piece: "P" },
            { square: "d2", piece: "P" },
            { square: "e4", piece: "P" },
            { square: "f2", piece: "P" },
            { square: "g2", piece: "P" },
            { square: "h2", piece: "P" },
            { square: "e8", piece: "k" },
            { square: "d8", piece: "q" },
            { square: "a8", piece: "r" },
            { square: "h8", piece: "r" },
            { square: "c8", piece: "b" },
            { square: "c5", piece: "b" },
            { square: "c6", piece: "n" },
            { square: "f6", piece: "n" },
            { square: "a7", piece: "p" },
            { square: "b7", piece: "p" },
            { square: "c7", piece: "p" },
            { square: "d7", piece: "p" },
            { square: "e5", piece: "p" },
            { square: "f7", piece: "p" },
            { square: "g7", piece: "p" },
            { square: "h7", piece: "p" },
          ],
        },
      },
      {
        id: "italian-2",
        title: "Italian plan",
        focus: "Kingside pressure",
        prompt: "What is usually more important in the Italian than memorizing rare sidelines?",
        choices: ["Piece activity", "Early queen raids", "Pawn storms on both wings"],
        answer: "Piece activity",
        explanation: "Knightneo wants this opening learned through plans first: active pieces, center control, then attack timing.",
      },
    ],
  },
  london: {
    headline: "Create a repeatable, low-maintenance White system.",
    modules: ["Default setup", "Kingside attack cues", "Common Black counters"],
    lessons: [
      {
        id: "london-1",
        title: "London identity",
        focus: "Default setup",
        prompt: "After `1.d4 d5 2.Bf4 Nf6 3.e3 e6 4.Nf3`, click where White's queen knight usually develops.",
        choices: [],
        answer: "d2",
        explanation: "Nbd2 is part of the classic London shell, supporting e4 ideas and keeping the setup compact.",
        board: {
          instruction: "Tap the destination square for the knight on b1.",
          sourceSquare: "b1",
          targetSquare: "d2",
          pieces: [
            { square: "e1", piece: "K" },
            { square: "d1", piece: "Q" },
            { square: "a1", piece: "R" },
            { square: "h1", piece: "R" },
            { square: "f4", piece: "B" },
            { square: "f1", piece: "B" },
            { square: "b1", piece: "N" },
            { square: "f3", piece: "N" },
            { square: "a2", piece: "P" },
            { square: "b2", piece: "P" },
            { square: "c2", piece: "P" },
            { square: "d4", piece: "P" },
            { square: "e2", piece: "P" },
            { square: "f2", piece: "P" },
            { square: "g2", piece: "P" },
            { square: "h2", piece: "P" },
          ],
        },
      },
      {
        id: "london-2",
        title: "London warning",
        focus: "Common Black counters",
        prompt: "Which Black idea should London players be ready for early?",
        choices: ["...c5 and ...Qb6 pressure", "...h5 pawn race", "...Na6 only"],
        answer: "...c5 and ...Qb6 pressure",
        explanation: "Those are common practical counters, so early awareness matters more than exotic theory.",
      },
    ],
  },
  qg: {
    headline: "Learn strategic pressure and long-term structure.",
    modules: ["Pawn structure", "Minority attack", "IQP plans"],
    lessons: [
      {
        id: "qg-1",
        title: "Queen's Gambit goal",
        focus: "Pawn structure",
        prompt: "After `1.d4 d5 2.c4 e6 3.Nc3 Nf6`, click White's most thematic bishop move.",
        choices: [],
        answer: "g5",
        explanation: "Bg5 is one of the classic Queen's Gambit developing moves, increasing pressure before White chooses a long-term structure.",
        board: {
          instruction: "Tap the destination square for the bishop on c1.",
          sourceSquare: "c1",
          targetSquare: "g5",
          pieces: [
            { square: "e1", piece: "K" },
            { square: "d1", piece: "Q" },
            { square: "a1", piece: "R" },
            { square: "h1", piece: "R" },
            { square: "c1", piece: "B" },
            { square: "f1", piece: "B" },
            { square: "c3", piece: "N" },
            { square: "g1", piece: "N" },
            { square: "a2", piece: "P" },
            { square: "b2", piece: "P" },
            { square: "c4", piece: "P" },
            { square: "d4", piece: "P" },
            { square: "e2", piece: "P" },
            { square: "f2", piece: "P" },
            { square: "g2", piece: "P" },
            { square: "h2", piece: "P" },
            { square: "d5", piece: "p" },
            { square: "e6", piece: "p" },
            { square: "f6", piece: "n" },
          ],
        },
      },
      {
        id: "qg-2",
        title: "Queen's Gambit study",
        focus: "Minority attack",
        prompt: "Which classic theme should a Queen's Gambit player study early?",
        choices: ["Minority attack ideas", "Double rook sacrifices", "Early knight retreats only"],
        answer: "Minority attack ideas",
        explanation: "That theme appears often and teaches how this repertoire creates structural targets over time.",
      },
    ],
  },
  scotch: {
    headline: "Play direct central chess with fast development.",
    modules: ["Early d4 break", "Open-file tactics", "Punishing passive defense"],
    lessons: [
      {
        id: "scotch-1",
        title: "Scotch identity",
        focus: "Early d4 break",
        prompt: "After `1.e4 e5 2.Nf3 Nc6 3.d4 exd4 4.Nxd4`, click Black's most natural developing move.",
        choices: [],
        answer: "c5",
        explanation: "Developing the bishop to c5 is a classic Scotch response, developing with tempo and pressure on the center.",
        board: {
          instruction: "Tap the destination square for the bishop on f8.",
          sourceSquare: "f8",
          targetSquare: "c5",
          pieces: [
            { square: "e1", piece: "K" },
            { square: "d1", piece: "Q" },
            { square: "a1", piece: "R" },
            { square: "h1", piece: "R" },
            { square: "c1", piece: "B" },
            { square: "f1", piece: "B" },
            { square: "b1", piece: "N" },
            { square: "f3", piece: "N" },
            { square: "a2", piece: "P" },
            { square: "b2", piece: "P" },
            { square: "c2", piece: "P" },
            { square: "e4", piece: "P" },
            { square: "f2", piece: "P" },
            { square: "g2", piece: "P" },
            { square: "h2", piece: "P" },
            { square: "e5", piece: "p" },
            { square: "c6", piece: "n" },
            { square: "e8", piece: "k" },
            { square: "d8", piece: "q" },
            { square: "f8", piece: "b" },
            { square: "g8", piece: "n" },
          ],
        },
      },
      {
        id: "scotch-2",
        title: "Scotch motif",
        focus: "Open-file tactics",
        prompt: "Which tactical zone matters often in the Scotch?",
        choices: ["The e-file", "Only the h-file", "Only dark-square bishop endings"],
        answer: "The e-file",
        explanation: "Open lines and active development often create tactical pressure along the e-file.",
      },
    ],
  },
  caro: {
    headline: "Build a solid defense that stays practical under pressure.",
    modules: ["Reliable setup", "Pawn breaks", "Bishop timing"],
    lessons: [
      {
        id: "caro-1",
        title: "Caro identity",
        focus: "Reliable setup",
        prompt: "After `1.e4 c6 2.d4 d5 3.Nc3`, click Black's most thematic bishop development.",
        choices: [],
        answer: "f5",
        explanation: "One of the Caro-Kann's signature ideas is getting the light-squared bishop outside the pawn chain with ...Bf5.",
        board: {
          instruction: "Tap the destination square for the bishop on c8.",
          sourceSquare: "c8",
          targetSquare: "f5",
          pieces: [
            { square: "e8", piece: "k" },
            { square: "d8", piece: "q" },
            { square: "a8", piece: "r" },
            { square: "h8", piece: "r" },
            { square: "c8", piece: "b" },
            { square: "f8", piece: "b" },
            { square: "c6", piece: "p" },
            { square: "c7", piece: "p" },
            { square: "g8", piece: "n" },
            { square: "d5", piece: "p" },
            { square: "e7", piece: "p" },
            { square: "f7", piece: "p" },
            { square: "g7", piece: "p" },
            { square: "h7", piece: "p" },
            { square: "e4", piece: "P" },
            { square: "d4", piece: "P" },
            { square: "c3", piece: "N" },
          ],
        },
      },
      {
        id: "caro-2",
        title: "Caro break",
        focus: "Pawn breaks",
        prompt: "Which pawn breaks often matter in Caro-Kann middlegames?",
        choices: ["...c5 and ...e5", "...a5 and ...h5", "...b5 only"],
        answer: "...c5 and ...e5",
        explanation: "Those breaks help Black challenge the center and activate pieces at the right moment.",
      },
    ],
  },
  sicilian: {
    headline: "Choose imbalance and counterplay on purpose.",
    modules: ["Counterattack mindset", "Anti-Sicilian prep", "Pattern memory"],
    lessons: [
      {
        id: "sicilian-1",
        title: "Sicilian identity",
        focus: "Counterattack mindset",
        prompt: "After `1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4`, click Black's standard knight development.",
        choices: [],
        answer: "f6",
        explanation: "In many Sicilian lines, ...Nf6 is the natural development move, attacking e4 and speeding up counterplay.",
        board: {
          instruction: "Tap the destination square for the knight on g8.",
          sourceSquare: "g8",
          targetSquare: "f6",
          pieces: [
            { square: "e8", piece: "k" },
            { square: "d8", piece: "q" },
            { square: "a8", piece: "r" },
            { square: "h8", piece: "r" },
            { square: "c8", piece: "b" },
            { square: "f8", piece: "b" },
            { square: "b8", piece: "n" },
            { square: "g8", piece: "n" },
            { square: "a7", piece: "p" },
            { square: "b7", piece: "p" },
            { square: "c5", piece: "p" },
            { square: "d6", piece: "p" },
            { square: "e7", piece: "p" },
            { square: "f7", piece: "p" },
            { square: "g7", piece: "p" },
            { square: "h7", piece: "p" },
            { square: "e4", piece: "P" },
            { square: "d4", piece: "N" },
            { square: "f3", piece: "N" },
          ],
        },
      },
      {
        id: "sicilian-2",
        title: "Sicilian reality",
        focus: "Anti-Sicilian prep",
        prompt: "What must Sicilian players prepare for besides their favorite mainline?",
        choices: ["Anti-Sicilian systems", "Only endgames", "Only queen trades"],
        answer: "Anti-Sicilian systems",
        explanation: "A practical Sicilian repertoire is not complete until anti-Sicilian responses are ready.",
      },
    ],
  },
  french: {
    headline: "Counterpunch from a resilient structure.",
    modules: ["Pawn chain logic", "Counterbreaks", "Bad bishop management"],
    lessons: [
      {
        id: "french-1",
        title: "French structure",
        focus: "Pawn chain logic",
        prompt: "After `1.e4 e6 2.d4 d5 3.Nc3`, click Black's Winawer bishop move.",
        choices: [],
        answer: "b4",
        explanation: "The Winawer variation is defined by ...Bb4, pinning the knight and increasing pressure on the center.",
        board: {
          instruction: "Tap the destination square for the bishop on f8.",
          sourceSquare: "f8",
          targetSquare: "b4",
          pieces: [
            { square: "e8", piece: "k" },
            { square: "d8", piece: "q" },
            { square: "a8", piece: "r" },
            { square: "h8", piece: "r" },
            { square: "c8", piece: "b" },
            { square: "f8", piece: "b" },
            { square: "b8", piece: "n" },
            { square: "g8", piece: "n" },
            { square: "d7", piece: "p" },
            { square: "e6", piece: "p" },
            { square: "f7", piece: "p" },
            { square: "g7", piece: "p" },
            { square: "h7", piece: "p" },
            { square: "e4", piece: "P" },
            { square: "d4", piece: "P" },
            { square: "c3", piece: "N" },
          ],
        },
      },
      {
        id: "french-2",
        title: "French break",
        focus: "Counterbreaks",
        prompt: "Which break is famously important in many French structures?",
        choices: ["...f6", "...h6", "...a6"],
        answer: "...f6",
        explanation: "The ...f6 break is one of the classic ways Black challenges White's center.",
      },
    ],
  },
  scandinavian: {
    headline: "Keep it practical and get a playable game fast.",
    modules: ["Queen retreat plan", "Development speed", "Trap awareness"],
    lessons: [
      {
        id: "scandinavian-1",
        title: "Scandinavian goal",
        focus: "Development speed",
        prompt: "After `1.e4 d5 2.exd5`, click Black's most common practical queen retreat.",
        choices: [],
        answer: "a5",
        explanation: "Many Scandinavian players choose ...Qa5 to recover the pawn while staying active and awkward to hit.",
        board: {
          instruction: "Tap the destination square for the queen on d8.",
          sourceSquare: "d8",
          targetSquare: "a5",
          pieces: [
            { square: "e8", piece: "k" },
            { square: "d8", piece: "q" },
            { square: "a8", piece: "r" },
            { square: "h8", piece: "r" },
            { square: "c8", piece: "b" },
            { square: "f8", piece: "b" },
            { square: "b8", piece: "n" },
            { square: "g8", piece: "n" },
            { square: "a7", piece: "p" },
            { square: "b7", piece: "p" },
            { square: "c7", piece: "p" },
            { square: "e7", piece: "p" },
            { square: "f7", piece: "p" },
            { square: "g7", piece: "p" },
            { square: "h7", piece: "p" },
            { square: "d5", piece: "P" },
            { square: "e4", piece: "P" },
          ],
        },
      },
      {
        id: "scandinavian-2",
        title: "Scandinavian caution",
        focus: "Queen retreat plan",
        prompt: "After White captures on d5, what must Scandinavian players handle carefully?",
        choices: ["The queen retreat setup", "An automatic kingside pawn storm", "Bishop sacrifice timing only"],
        answer: "The queen retreat setup",
        explanation: "A clean retreat plan keeps the opening practical instead of awkward.",
      },
    ],
  },
  qgd: {
    headline: "Anchor your Black repertoire with consistency.",
    modules: ["Orthodox shell", "Central breaks", "Hanging pawns"],
    lessons: [
      {
        id: "qgd-1",
        title: "QGD identity",
        focus: "Orthodox shell",
        prompt: "After `1.d4 d5 2.c4 e6 3.Nc3 Nf6`, click Black's most solid bishop development.",
        choices: [],
        answer: "e7",
        explanation: "In the orthodox QGD, ...Be7 is a calm, reliable developing move that keeps the center intact.",
        board: {
          instruction: "Tap the destination square for the bishop on f8.",
          sourceSquare: "f8",
          targetSquare: "e7",
          pieces: [
            { square: "d4", piece: "P" },
            { square: "c4", piece: "P" },
            { square: "c3", piece: "N" },
            { square: "d5", piece: "p" },
            { square: "e6", piece: "p" },
            { square: "f6", piece: "n" },
            { square: "e8", piece: "k" },
            { square: "d8", piece: "q" },
            { square: "c8", piece: "b" },
            { square: "f8", piece: "b" },
          ],
        },
      },
      {
        id: "qgd-2",
        title: "QGD theme",
        focus: "Central breaks",
        prompt: "Which central break does Black often aim for in the QGD?",
        choices: ["...c5", "...h5", "...Na5"],
        answer: "...c5",
        explanation: "The ...c5 break is central to many QGD plans and equalizing schemes.",
      },
    ],
  },
  slav: {
    headline: "Stay solid without becoming passive.",
    modules: ["Development pattern", "Active bishop plans", "Counterplay timing"],
    lessons: [
      {
        id: "slav-1",
        title: "Slav identity",
        focus: "Development pattern",
        prompt: "After `1.d4 d5 2.c4 c6 3.Nc3 Nf6`, click Black's active bishop development.",
        choices: [],
        answer: "f5",
        explanation: "One of the Slav's big advantages is that Black can often develop the bishop actively to f5.",
        board: {
          instruction: "Tap the destination square for the bishop on c8.",
          sourceSquare: "c8",
          targetSquare: "f5",
          pieces: [
            { square: "d4", piece: "P" },
            { square: "c4", piece: "P" },
            { square: "c3", piece: "N" },
            { square: "d5", piece: "p" },
            { square: "c6", piece: "p" },
            { square: "e8", piece: "k" },
            { square: "d8", piece: "q" },
            { square: "c8", piece: "b" },
            { square: "f8", piece: "b" },
            { square: "f6", piece: "n" },
          ],
        },
      },
      {
        id: "slav-2",
        title: "Slav plan",
        focus: "Counterplay timing",
        prompt: "Which break often helps Black challenge White's center in the Slav?",
        choices: ["...c5", "...g5", "...b6 only"],
        answer: "...c5",
        explanation: "Like many d4 defenses, timely ...c5 is a key source of counterplay.",
      },
    ],
  },
  kid: {
    headline: "Attack hard, but with structure behind it.",
    modules: ["Dark-square setup", "Kingside storm", "Pattern depth"],
    lessons: [
      {
        id: "kid-1",
        title: "King's Indian mindset",
        focus: "Kingside storm",
        prompt: "After the basic King's Indian setup is in place, click Black's classic central strike.",
        choices: [],
        answer: "e5",
        explanation: "Once the King's Indian setup is ready, ...e5 is one of Black's most thematic central breaks.",
        board: {
          instruction: "Tap the destination square for the pawn on e7.",
          sourceSquare: "e7",
          targetSquare: "e5",
          pieces: [
            { square: "d4", piece: "P" },
            { square: "c4", piece: "P" },
            { square: "e4", piece: "P" },
            { square: "d6", piece: "p" },
            { square: "g6", piece: "p" },
            { square: "e8", piece: "k" },
            { square: "d8", piece: "q" },
            { square: "c8", piece: "b" },
            { square: "g7", piece: "b" },
            { square: "f6", piece: "n" },
            { square: "g8", piece: "n" },
            { square: "c7", piece: "p" },
            { square: "e7", piece: "p" },
          ],
        },
      },
      {
        id: "kid-2",
        title: "King's Indian break",
        focus: "Pattern depth",
        prompt: "Which advance is one of the classic King's Indian attacking ideas?",
        choices: ["...f5", "...a5", "...b3"],
        answer: "...f5",
        explanation: "The ...f5 advance is one of the defining attacking themes in many King's Indian structures.",
      },
    ],
  },
  nimzo: {
    headline: "Pressure the center with flexible piece play.",
    modules: ["Pin ideas", "Doubled pawns", "Strategic tension"],
    lessons: [
      {
        id: "nimzo-1",
        title: "Nimzo tradeoff",
        focus: "Doubled pawns",
        prompt: "After `1.d4 Nf6 2.c4 e6 3.Nc3`, click Black's move that defines the Nimzo-Indian.",
        choices: [],
        answer: "b4",
        explanation: "The Nimzo-Indian begins with ...Bb4, pinning the knight and creating immediate strategic pressure.",
        board: {
          instruction: "Tap the destination square for the bishop on f8.",
          sourceSquare: "f8",
          targetSquare: "b4",
          pieces: [
            { square: "d4", piece: "P" },
            { square: "c4", piece: "P" },
            { square: "c3", piece: "N" },
            { square: "e8", piece: "k" },
            { square: "d8", piece: "q" },
            { square: "c8", piece: "b" },
            { square: "f8", piece: "b" },
            { square: "f6", piece: "n" },
            { square: "e6", piece: "p" },
            { square: "d5", piece: "p" },
          ],
        },
      },
      {
        id: "nimzo-2",
        title: "Nimzo identity",
        focus: "Strategic tension",
        prompt: "What kind of player usually enjoys the Nimzo-Indian?",
        choices: ["A flexible strategic player", "Someone avoiding all theory", "Only ultra-aggressive gambit players"],
        answer: "A flexible strategic player",
        explanation: "The Nimzo rewards players who like rich positional tension and smart piece pressure.",
      },
    ],
  },
};

const PLAN_ORDER: SubscriptionPlan[] = ["free", "paid", "admin"];

function planRank(plan: SubscriptionPlan): number {
  const order = PLAN_ORDER.indexOf(plan);
  return order >= 0 ? order : 0;
}

export function isLessonUnlockedForPlan(lesson: TrainingLesson, plan: SubscriptionPlan): boolean {
  const min = lesson.minPlan ?? "paid";
  return planRank(plan) >= planRank(min);
}

export function filterLessonsForPlan(lessons: TrainingLesson[], plan: SubscriptionPlan): TrainingLesson[] {
  return lessons.filter((lesson) => isLessonUnlockedForPlan(lesson, plan));
}

function lineLessonFromMoves(
  id: string,
  title: string,
  chapter: string,
  focus: string,
  moves: string[],
  explanation: string,
  minPlan?: SubscriptionPlan,
  stepHints?: string[],
  variationId?: string,
): TrainingLesson {
  const line = buildOpeningLineFromSanMoves(moves, stepHints);
  return {
    id,
    title,
    chapter,
    focus,
    prompt: `Full line (${moves.length} moves): tap each half-move in order. ${moves.slice(0, 10).join(" ")}${moves.length > 10 ? " …" : ""}`,
    choices: [],
    answer: line.steps[line.steps.length - 1].targetSquare,
    explanation,
    line,
    minPlan,
    variationId,
  };
}

function buildTieredLineLessons(openingKey: string): TrainingLesson[] {
  const out: TrainingLesson[] = [];
  const main = MAIN_LINE_MOVES[openingKey];
  if (main) {
    const mainHints = MAIN_LINE_STEP_HINTS[openingKey];
    out.push(
      lineLessonFromMoves(
        `${openingKey}-main-line`,
        "Main line — full drill",
        "Mainline",
        "Full line",
        main,
        `You walked through ${main.length} plies of a principled main line. This is how Knightneo builds real repertoire memory: move order, not just slogan-level ideas.`,
        "free",
        mainHints,
        "main",
      ),
    );
  }
  const starter = STARTER_EXTRA_LINE_MOVES[openingKey];
  if (starter) {
    out.push(
      lineLessonFromMoves(
        `${openingKey}-line-starter`,
        "Foundation branch",
        "Mainline",
        "Theory depth",
        starter,
        `A second main branch (${starter.length} plies) to widen your tree while keeping the same structure-first mindset.`,
        "paid",
        buildTierStepHints(openingKey, "starter", starter),
        "foundation",
      ),
    );
  }
  const club = CLUB_EXTRA_LINE_MOVES[openingKey];
  if (club) {
    out.push(
      lineLessonFromMoves(
        `${openingKey}-line-club`,
        "Tournament branch",
        "Mainline",
        "Line depth",
        club,
        `A longer fight (${club.length} plies) in the middlegame transition from your opening.`,
        "paid",
        buildTierStepHints(openingKey, "club", club),
        "tournament",
      ),
    );
  }
  const pro = PRO_EXTRA_LINE_MOVES[openingKey];
  if (pro) {
    out.push(
      lineLessonFromMoves(
        `${openingKey}-line-pro`,
        "Master branch",
        "Mainline",
        "Maximum depth",
        pro,
        `A maximal single-line drill (${pro.length} plies) for when you want tournament-grade depth.`,
        "paid",
        buildTierStepHints(openingKey, "pro", pro),
        "master",
      ),
    );
  }
  return out;
}

function buildProgressiveLineCheckpoints(openingKey: string): TrainingLesson[] {
  const sequences: Array<{ key: string; title: string; moves: string[] | undefined }> = [
    { key: "main", title: "Main line", moves: MAIN_LINE_MOVES[openingKey] },
    { key: "starter", title: "Foundation branch", moves: STARTER_EXTRA_LINE_MOVES[openingKey] },
    { key: "club", title: "Tournament branch", moves: CLUB_EXTRA_LINE_MOVES[openingKey] },
    { key: "pro", title: "Master branch", moves: PRO_EXTRA_LINE_MOVES[openingKey] },
  ];

  const lessons: TrainingLesson[] = [];
  for (const sequence of sequences) {
    const moves = sequence.moves;
    if (!moves || moves.length < 10) continue;

    const checkpoints = [8, 12, 16, 20, 24]
      .filter((n) => n < moves.length)
      .concat(moves.length)
      .filter((n, idx, arr) => arr.indexOf(n) === idx);

    for (const plies of checkpoints) {
      const sliced = moves.slice(0, plies);
      const tierHint = sequence.key === "main" ? "Mainline recall" : `${sequence.title} recall`;
      const freeMainEntry = sequence.key === "main" && plies === checkpoints[0];
      lessons.push(
        lineLessonFromMoves(
          `${openingKey}-checkpoint-${sequence.key}-${plies}`,
          `${sequence.title} checkpoint — ${plies} plies`,
          "Review and retention",
          "Move-order retention",
          sliced,
          `Checkpoint drill: replay the first ${plies} plies from the ${sequence.title.toLowerCase()} without hesitation so the move order survives practical time pressure.`,
          freeMainEntry ? "free" : "paid",
          sliced.map((san, idx) => `${tierHint}: ${buildHintFromSan(san, idx)}`),
          sequence.key === "main"
            ? "main"
            : sequence.key === "starter"
              ? "foundation"
              : sequence.key === "club"
                ? "tournament"
                : "master",
        ),
      );
    }
  }

  return lessons;
}

function buildDeviationLessons(openingKey: string): TrainingLesson[] {
  const branches = DEVIATION_LINE_MOVES[openingKey] ?? [];
  return branches.map((branch, index) => {
    const base = lineLessonFromMoves(
      `${openingKey}-deviation-${index + 1}`,
      `Deviation — ${branch.title}`,
      "Opponent deviations",
      "Practical responses",
      branch.moves,
      "You ran the right move order for this sideline. Over the board, pair it with the plan below so you are not guessing after the fork in the road.",
      "paid",
      branch.hints ?? buildDeviationStepHints(branch.title, branch.plan, branch.moves),
      "deviation",
    );
    return {
      ...base,
      deviationPlan: branch.plan,
      prompt: `${branch.title}: tap each half-move in order (${branch.moves.length} plies). ${branch.moves.slice(0, 10).join(" ")}${branch.moves.length > 10 ? " …" : ""}`,
    };
  });
}

export function getTrainingTrack(openingKey: string): TrainingTrack {
  const baseTrack =
    trainingCatalog[openingKey] ?? {
      headline: "Study the core setup, main plans, and one practical warning.",
      modules: ["Core setup", "Typical plan", "One warning"],
      studies: [
        "Study the opening through recurring structures instead of memorizing everything.",
        "Keep one main line and one backup response at first.",
        "Review a few model games before deep engine work.",
      ],
      lessons: [
        {
          id: `${openingKey}-fallback-1`,
          title: "Opening identity",
          focus: "Core setup",
          prompt: "What should you learn first in a new opening?",
          choices: ["Core setup and plans", "Every rare sideline", "Only traps"],
          answer: "Core setup and plans",
          explanation: "Start with the recurring structure and ideas—you’ll recognize the middlegames much faster than if you chase every trap.",
        },
      ],
    };

  return {
    ...baseTrack,
    intro: buildTrackIntro(openingKey, baseTrack.modules),
    variations: buildTrackVariations(openingKey),
    studies: baseTrack.studies ?? [
      `Review ${baseTrack.modules[0].toLowerCase()} before expanding your repertoire tree.`,
      `Study ${baseTrack.modules[1].toLowerCase()} through 2-3 model games.`,
      `Use ${baseTrack.modules[2].toLowerCase()} as the final review pass after the basics feel natural.`,
    ],
    lessons: [
      ...buildTieredLineLessons(openingKey),
      ...buildProgressiveLineCheckpoints(openingKey),
      ...buildDeviationLessons(openingKey),
      ...baseTrack.lessons.map((lesson) => ({
        ...lesson,
        minPlan: "free" as const,
        chapter: lesson.chapter ?? (lesson.title.toLowerCase().includes("deviation") ? "Opponent deviations" : "Core concepts"),
      })),
      {
        id: `${openingKey}-review-1`,
        title: "Study priority",
        chapter: "Core concepts",
        focus: baseTrack.modules[0],
        prompt: `When you review ${openingKey}, what should come before rare sidelines?`,
        choices: [baseTrack.modules[0], "Random traps", "Engine-only memorization"],
        answer: baseTrack.modules[0],
        explanation: `Prioritize ${baseTrack.modules[0].toLowerCase()} first—you’ll feel less lost when the board gets sharp.`,
        minPlan: "free" as const,
      },
      {
        id: `${openingKey}-review-2`,
        title: "Repertoire discipline",
        chapter: "Core concepts",
        focus: baseTrack.modules[1],
        prompt: `What makes an opening actually usable in tournament or online play?`,
        choices: ["Clear recurring plans", "Maximum theory at once", "Learning every transposition first"],
        answer: "Clear recurring plans",
        explanation: "A playable repertoire is built on repeatable structures and plans, not on trying to memorize everything at once.",
        minPlan: "free" as const,
      },
      ...buildExtendedReviewLessons(openingKey, baseTrack.modules),
      ...buildEndgameMicroLessons(openingKey),
    ],
  };
}

function buildTrackIntro(openingKey: string, modules: string[]): TrainingTrackIntro {
  const voiced = OPENING_TRAINING_VOICE[openingKey]?.intro;
  if (voiced) return voiced;
  const openingLabel = openingKey.toUpperCase();
  const moduleA = modules[0] ?? "Core setup";
  const moduleB = modules[1] ?? "Typical plans";
  return {
    whyThisOpening: `Here you’ll build a clear ${moduleA.toLowerCase()} → ${moduleB.toLowerCase()} story you can actually replay in your own games.`,
    history: `${openingLabel} has stayed sound from classical play through online and engine prep—ideas refresh, but the pawn structures stay practical.`,
    viability: "Your quiz pointed here because you said you want repeatable plans and clean development more than one-off tricks.",
  };
}

function buildTrackVariations(openingKey: string): TrainingVariation[] {
  const openingLabel = openingKey.toUpperCase();
  const base: TrainingVariation[] = [
    {
      id: "foundation",
      label: "Foundation branch",
      summary: "Lower-theory, pattern-first version of the opening.",
      style: "positional",
      risk: "low",
      theoryLoad: "light",
      tempo: "Steady development, fewer forcing races.",
      middlegamePlans: ["Complete development first", "Choose one central break on timing", "Trade into favorable structures"],
      fitSignals: ["Best for lower-theory preference", "Strong for rapid/blitz consistency"],
      sampleLine: `${openingLabel} setup line with practical piece development and one stable break.`,
      timeControlFit: "Excellent in rapid and blitz when you want stable plans quickly.",
      commonMistakes: ["Rushing pawn breaks before development", "Trading key defenders too early"],
    },
    {
      id: "main",
      label: "Main line",
      summary: "Most representative practical line used in core training.",
      style: "balanced",
      risk: "medium",
      theoryLoad: "medium",
      tempo: "Balanced initiative and structure control.",
      middlegamePlans: ["Contest center early", "Activate pieces with tempo", "Play the key pawn break before move 15"],
      fitSignals: ["Good default for most players", "Strong blend of ideas + concrete lines"],
      sampleLine: `${openingLabel} principled backbone line used in tournament prep.`,
      timeControlFit: "Works well across rapid and classical with balanced prep time.",
      commonMistakes: ["Ignoring opponent counter-break timing", "Playing only memorized moves without plan"],
    },
    {
      id: "tournament",
      label: "Tournament branch",
      summary: "Sharper continuation with deeper move-order precision.",
      style: "tactical",
      risk: "medium",
      theoryLoad: "heavy",
      tempo: "Quicker forcing sequences and tactical windows.",
      middlegamePlans: ["Keep initiative through concrete threats", "Punish inaccurate move orders", "Convert activity into structure gains"],
      fitSignals: ["Fits tactical players", "Best when you enjoy deeper memorization"],
      sampleLine: `${openingLabel} tournament-tested continuation with heavier theory load.`,
      timeControlFit: "Best in rapid/classical when you can calculate forcing continuations.",
      commonMistakes: ["Overpushing without king safety", "Missing tactical resources after move-order changes"],
    },
    {
      id: "master",
      label: "Master branch",
      summary: "Maximum-depth branch for long preparation cycles.",
      style: "tactical",
      risk: "high",
      theoryLoad: "heavy",
      tempo: "High-precision lines where one tempo matters.",
      middlegamePlans: ["Hold exact move order", "Prepare forcing transpositions", "Use novelties sparingly but accurately"],
      fitSignals: ["Fits high-theory preference", "Best for deep prep and long games"],
      sampleLine: `${openingLabel} deep prep branch with maximal line depth.`,
      timeControlFit: "Strongest in classical and prepared league/tournament games.",
      commonMistakes: ["Forgetting transposition move-orders", "Playing too fast in critical forcing positions"],
    },
  ];

  const patches = OPENING_TRAINING_VOICE[openingKey]?.branches;
  if (!patches) return base;

  return base.map((v) => {
    const p = patches[v.id as keyof typeof patches];
    if (!p) return v;
    return {
      ...v,
      ...p,
      middlegamePlans: p.middlegamePlans ?? v.middlegamePlans,
      commonMistakes: p.commonMistakes ?? v.commonMistakes,
    };
  });
}

function buildTierStepHints(openingKey: string, tier: "starter" | "club" | "pro", moves: string[]): string[] {
  const tierLabel = tier === "starter" ? "Starter focus" : tier === "club" ? "Club focus" : "Pro focus";
  return moves.map((san, idx) => `${tierLabel}: ${buildHintFromSan(san, idx)}`);
}

function buildDeviationStepHints(title: string, plan: string, moves: string[]): string[] {
  const planAnchor = plan.split(/[.!?]/)[0]?.trim() ?? plan.trim();
  return moves.map((san, idx) => {
    if (idx === 0) return `${title}: ${buildHintFromSan(san, idx)}`;
    if (idx === moves.length - 1) return `${buildHintFromSan(san, idx)} Plan anchor: ${planAnchor}.`;
    return buildHintFromSan(san, idx);
  });
}

function buildHintFromSan(san: string, idx: number): string {
  const you = idx % 2 === 0 ? "you’re playing this as White" : "you’re playing this as Black";
  if (san.startsWith("O-O-O")) return `Castle long—${you}, expect opposite-wing tension if both sides rush.`;
  if (san.startsWith("O-O")) return `Castle short: king safety up, rooks ready to join the fight.`;
  if (san.includes("=")) return `Promotion—cash the passer into a piece that decides the fight.`;
  if (san.includes("#")) return `Mate on the board—pattern recognition paid off.`;
  if (san.includes("+")) return `Check: force a reply you’ve thought one move past.`;
  if (san.includes("x")) return `Capture: change the pawn landscape or grab a key defender.`;
  if (/^[N]/.test(san)) return `Knight jump—fight for central squares and tactical forks.`;
  if (/^[B]/.test(san)) return `Bishop lift—open a diagonal that matters for your next break.`;
  if (/^[R]/.test(san)) return `Rook move—claim a file before your opponent seals it.`;
  if (/^[Q]/.test(san)) return `Queen step—improve without letting it get harassed for free.`;
  if (/^[K]/.test(san)) return `King step—often about safety now, activity later.`;
  return `Small improvement—set up the pawn break you actually want next.`;
}

function buildEndgameMicroLessons(openingKey: string): TrainingLesson[] {
  const openingLabel = openingKey.toUpperCase();
  return [
    {
      id: `${openingKey}-endgame-micro-1`,
      title: "Endgame micro — activate king early",
      chapter: "Endgame micro-drills",
      focus: "King activity",
      prompt: `In simplified ${openingLabel} structures, what usually improves your winning chances first?`,
      choices: ["Activate the king toward the center", "Keep the king on the back rank", "Push random flank pawns"],
      answer: "Activate the king toward the center",
      explanation: "In many practical endgames, king activity decides races and conversions faster than passive piece shuffling.",
    },
    {
      id: `${openingKey}-endgame-micro-2`,
      title: "Endgame micro — practical pawn breaks",
      chapter: "Endgame micro-drills",
      focus: "Pawn play",
      prompt: `When both sides have one rook and several pawns, what is a strong practical default?`,
      choices: [
        "Create a passed pawn with a supported break",
        "Trade every pawn immediately",
        "Ignore king safety and chase checks",
      ],
      answer: "Create a passed pawn with a supported break",
      explanation: "A supported break that creates a passer gives your rook and king a clear target and practical winning plan.",
    },
  ].map((lesson) => ({ ...lesson, minPlan: "paid" as const }));
}

function buildExtendedReviewLessons(openingKey: string, modules: string[]): TrainingLesson[] {
  const focusA = modules[0] ?? "Core setup";
  const focusB = modules[1] ?? "Typical plan";
  const focusC = modules[2] ?? "Practical warning";

  return [
    {
      id: `${openingKey}-review-3`,
      title: "Move-order discipline",
      chapter: "Core concepts",
      focus: focusA,
      prompt: `What is the best first priority when learning ${openingKey} move orders?`,
      choices: ["Understand the core branch first", "Memorize every sideline", "Rely only on engine top lines"],
      answer: "Understand the core branch first",
      explanation: "Strong opening prep starts with a reliable backbone before branching into edge cases.",
    },
    {
      id: `${openingKey}-review-4`,
      title: "Practical prep split",
      chapter: "Core concepts",
      focus: focusA,
      prompt: "How should most improving players split opening study time?",
      choices: ["Mostly structures and plans, then tactics", "Only memorization", "Only blitz games"],
      answer: "Mostly structures and plans, then tactics",
      explanation: "You retain openings better by learning ideas first and tactical motifs second.",
    },
    {
      id: `${openingKey}-review-5`,
      title: "Opponent deviations",
      chapter: "Opponent deviations",
      focus: focusB,
      prompt: "What is the most practical response to an uncommon opponent move?",
      choices: ["Return to your setup principles", "Panic and improvise", "Force a memorized trap"],
      answer: "Return to your setup principles",
      explanation: "Principle-based play keeps your position healthy even when theory leaves your file.",
    },
    {
      id: `${openingKey}-review-6`,
      title: "Middle-game bridge",
      chapter: "Core concepts",
      focus: focusB,
      prompt: "What makes an opening truly useful in rated games?",
      choices: ["A clear middlegame plan", "A flashy line only", "Perfect recall of obscure traps"],
      answer: "A clear middlegame plan",
      explanation: "Openings are valuable when they consistently lead to positions you know how to handle.",
    },
    {
      id: `${openingKey}-review-7`,
      title: "Review timing",
      chapter: "Review and retention",
      focus: focusC,
      prompt: "When should you revisit a line that caused mistakes?",
      choices: ["As soon as it is due or fresh", "At random months later", "Never, move on immediately"],
      answer: "As soon as it is due or fresh",
      explanation: "Short review cycles after mistakes lock in stronger decision patterns faster.",
    },
    {
      id: `${openingKey}-review-8`,
      title: "Game analysis loop",
      chapter: "Review and retention",
      focus: focusC,
      prompt: "After each game, what opening note is most helpful?",
      choices: ["First critical decision point", "Only final result", "Only engine eval number"],
      answer: "First critical decision point",
      explanation: "Capturing the first key decision improves practical opening play fastest.",
    },
    {
      id: `${openingKey}-review-9`,
      title: "Repertoire depth",
      chapter: "Core concepts",
      focus: focusA,
      prompt: "What is a better early goal for repertoire depth?",
      choices: ["One dependable line deeply", "Five lines shallowly", "Constantly switching systems"],
      answer: "One dependable line deeply",
      explanation: "Depth in a stable line creates confidence and transferable pattern recognition.",
    },
    {
      id: `${openingKey}-review-10`,
      title: "Counterplay awareness",
      chapter: "Opponent deviations",
      focus: focusB,
      prompt: "What should you always identify before move 10?",
      choices: ["Both sides' main pawn breaks", "Only your king safety", "Only your next move"],
      answer: "Both sides' main pawn breaks",
      explanation: "Knowing the breaks tells you where tactics and plans are likely to appear.",
    },
    {
      id: `${openingKey}-review-11`,
      title: "Time-control adaptation",
      chapter: "Review and retention",
      focus: focusC,
      prompt: "How should opening prep differ in faster time controls?",
      choices: ["Prefer simpler, repeatable plans", "Use only sharp novelties", "Skip preparation entirely"],
      answer: "Prefer simpler, repeatable plans",
      explanation: "In blitz/rapid, consistency and pattern speed usually outperform complexity.",
    },
    {
      id: `${openingKey}-review-12`,
      title: "Training quality check",
      chapter: "Review and retention",
      focus: focusC,
      prompt: "What signals that your opening training is working?",
      choices: ["Fewer early-game blunders", "Longer study notes only", "More tab browsing"],
      answer: "Fewer early-game blunders",
      explanation: "Performance gains in your first 10-15 moves are the strongest practical signal.",
    },
  ].map((lesson) => ({ ...lesson, minPlan: "paid" as const }));
}

export function validateTrainingTrack(openingKey: string, track: TrainingTrack): string[] {
  const issues: string[] = [];
  if (!track.intro?.whyThisOpening?.trim()) issues.push(`[${openingKey}] intro missing whyThisOpening`);
  if (!track.intro?.history?.trim()) issues.push(`[${openingKey}] intro missing history`);
  if (!track.intro?.viability?.trim()) issues.push(`[${openingKey}] intro missing viability`);
  if (!track.variations?.length) issues.push(`[${openingKey}] missing variation definitions`);
  for (const variation of track.variations ?? []) {
    if (!variation.label.trim()) issues.push(`[${openingKey}] variation missing label`);
    if (!variation.summary.trim()) issues.push(`[${openingKey}] variation "${variation.id}" missing summary`);
    if (!variation.sampleLine.trim()) issues.push(`[${openingKey}] variation "${variation.id}" missing sample line`);
    if (!variation.timeControlFit.trim()) issues.push(`[${openingKey}] variation "${variation.id}" missing timeControlFit`);
    if (!variation.commonMistakes.length) issues.push(`[${openingKey}] variation "${variation.id}" missing commonMistakes`);
  }
  for (const lesson of track.lessons) {
    if (!lesson.id.trim()) issues.push(`[${openingKey}] lesson missing id`);
    if (!lesson.prompt.trim()) issues.push(`[${openingKey}] ${lesson.id}: missing prompt`);

    if (lesson.board) {
      const board = lesson.board;
      if (lesson.answer !== board.targetSquare) {
        issues.push(`[${openingKey}] ${lesson.id}: board answer "${lesson.answer}" does not match target "${board.targetSquare}"`);
      }
      if (board.sourceSquare) {
        const hasSource = board.pieces.some((p) => p.square === board.sourceSquare);
        if (!hasSource) {
          issues.push(`[${openingKey}] ${lesson.id}: source "${board.sourceSquare}" not present in board pieces`);
        }
      }
    }

    if (!lesson.board && !lesson.line?.steps?.length) {
      if (!lesson.choices.length) issues.push(`[${openingKey}] ${lesson.id}: quiz lesson has no choices`);
      if (lesson.choices.length && !lesson.choices.includes(lesson.answer)) {
        issues.push(`[${openingKey}] ${lesson.id}: answer is not included in choices`);
      }
    }
  }
  return issues;
}

if (process.env.NODE_ENV !== "production") {
  const keys = Object.keys(trainingCatalog);
  const allIssues = keys.flatMap((key) => validateTrainingTrack(key, getTrainingTrack(key)));
  if (allIssues.length) {
    console.warn("[training-audit] Found lesson data issues:\n" + allIssues.join("\n"));
  }
}
