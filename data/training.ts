export type TrainingLesson = {
  id: string;
  title: string;
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
};

export type TrainingTrack = {
  headline: string;
  modules: string[];
  studies?: string[];
  lessons: TrainingLesson[];
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
        explanation: "Knightora wants this opening learned through plans first: active pieces, center control, then attack timing.",
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

// ─── Duolingo-style learning path types ───────────────────────────────────────

export type TrainingUnit = {
  id: string;
  title: string;
  description: string;
  lessons: TrainingLesson[];
  checkpointQuiz: TrainingLesson[];
};

export type LearningPath = {
  headline: string;
  units: TrainingUnit[];
};

// ─── Learning paths ────────────────────────────────────────────────────────────

export const learningPaths: Record<string, LearningPath> = {
  italian: {
    headline: "Build calm attacking habits without drowning in theory.",
    units: [
      {
        id: "italian-u1",
        title: "The Opening Setup",
        description: "Learn the key moves and why the bishop belongs on c4.",
        lessons: [
          {
            id: "italian-u1-l1",
            title: "Develop the Italian bishop",
            focus: "Core setup",
            prompt: "After 1.e4 e5 2.Nf3 Nc6, develop White's king bishop to its ideal square.",
            choices: [],
            answer: "c4",
            explanation:
              "Bc4 is the move that defines the Italian Game. The bishop targets f7 — the weakest point near Black's king — and sets up future pressure along the a2–g8 diagonal.",
            board: {
              instruction: "Tap the destination square for the bishop on f1.",
              sourceSquare: "f1",
              targetSquare: "c4",
              pieces: [
                { square: "e1", piece: "K" }, { square: "d1", piece: "Q" },
                { square: "a1", piece: "R" }, { square: "h1", piece: "R" },
                { square: "c1", piece: "B" }, { square: "f1", piece: "B" },
                { square: "b1", piece: "N" }, { square: "f3", piece: "N" },
                { square: "a2", piece: "P" }, { square: "b2", piece: "P" },
                { square: "c2", piece: "P" }, { square: "d2", piece: "P" },
                { square: "e4", piece: "P" }, { square: "f2", piece: "P" },
                { square: "g2", piece: "P" }, { square: "h2", piece: "P" },
                { square: "e8", piece: "k" }, { square: "d8", piece: "q" },
                { square: "a8", piece: "r" }, { square: "h8", piece: "r" },
                { square: "c8", piece: "b" }, { square: "f8", piece: "b" },
                { square: "c6", piece: "n" }, { square: "g8", piece: "n" },
                { square: "a7", piece: "p" }, { square: "b7", piece: "p" },
                { square: "c7", piece: "p" }, { square: "d7", piece: "p" },
                { square: "e5", piece: "p" }, { square: "f7", piece: "p" },
                { square: "g7", piece: "p" }, { square: "h7", piece: "p" },
              ],
            },
          },
          {
            id: "italian-u1-l2",
            title: "Why c4 — not d3?",
            focus: "Core setup",
            prompt: "The bishop goes to c4 rather than d3 or e2 because it…",
            choices: [
              "Attacks f7 immediately and controls key central squares",
              "Blocks the d-pawn so White can focus on the kingside",
              "Avoids future trades and simplifies the position",
            ],
            answer: "Attacks f7 immediately and controls key central squares",
            explanation:
              "f7 is guarded only by the king. Bc4 aims directly at that soft spot, enabling threats like Ng5 or tactical shots after Nxe5. A passive square like d3 wastes the bishop's diagonal power.",
          },
          {
            id: "italian-u1-l3",
            title: "Play d3 — the quiet choice",
            focus: "Core setup",
            prompt: "After 1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5 4.c3 Nf6, White's steadying pawn move is…",
            choices: [],
            answer: "d3",
            explanation:
              "d3 signals the Giuoco Pianissimo — the 'very quiet game.' White stabilises the center and prepares a slow kingside buildup with Nbd2, Re1, and Nf1–g3 rather than the sharp d4 central fight.",
            board: {
              instruction: "Tap the destination square for the pawn on d2.",
              sourceSquare: "d2",
              targetSquare: "d3",
              pieces: [
                { square: "e1", piece: "K" }, { square: "d1", piece: "Q" },
                { square: "a1", piece: "R" }, { square: "h1", piece: "R" },
                { square: "c1", piece: "B" }, { square: "c4", piece: "B" },
                { square: "b1", piece: "N" }, { square: "f3", piece: "N" },
                { square: "a2", piece: "P" }, { square: "b2", piece: "P" },
                { square: "c3", piece: "P" }, { square: "d2", piece: "P" },
                { square: "e4", piece: "P" }, { square: "f2", piece: "P" },
                { square: "g2", piece: "P" }, { square: "h2", piece: "P" },
                { square: "e8", piece: "k" }, { square: "d8", piece: "q" },
                { square: "a8", piece: "r" }, { square: "h8", piece: "r" },
                { square: "c5", piece: "b" }, { square: "c8", piece: "b" },
                { square: "c6", piece: "n" }, { square: "f6", piece: "n" },
                { square: "a7", piece: "p" }, { square: "b7", piece: "p" },
                { square: "c7", piece: "p" }, { square: "d7", piece: "p" },
                { square: "e5", piece: "p" }, { square: "f7", piece: "p" },
                { square: "g7", piece: "p" }, { square: "h7", piece: "p" },
              ],
            },
          },
        ],
        checkpointQuiz: [
          {
            id: "italian-u1-q1",
            title: "Quiz: Italian target",
            focus: "Core setup",
            prompt: "Which square does the Italian bishop on c4 threaten most directly?",
            choices: ["f7 — guarded only by Black's king", "e5 — the center pawn", "d5 — the central outpost"],
            answer: "f7 — guarded only by Black's king",
            explanation: "f7 is the weakest point in Black's camp. The Italian's whole identity flows from that pressure.",
          },
          {
            id: "italian-u1-q2",
            title: "Quiz: Purpose of c3",
            focus: "Core setup",
            prompt: "Why does White play c3 in the Giuoco Piano?",
            choices: [
              "To prepare a safe d4 central expansion",
              "To stop Black's Bc5 from staying on the diagonal",
              "To prepare b4, attacking the bishop directly",
            ],
            answer: "To prepare a safe d4 central expansion",
            explanation:
              "c3 shores up the d4 square so White can push d4 without losing a pawn. It's preparation, not immediate action.",
          },
          {
            id: "italian-u1-q3",
            title: "Quiz: d3 vs d4",
            focus: "Core setup",
            prompt: "Playing 5.d3 instead of 5.d4 means White is choosing…",
            choices: [
              "A slow, piece-based buildup over an immediate central fight",
              "A direct pawn sacrifice for rapid development",
              "A defensive stance with no attacking ideas",
            ],
            answer: "A slow, piece-based buildup over an immediate central fight",
            explanation:
              "The Pianissimo is not passive — it leads to rich attacks via the Nf1–g3 maneuver. It just avoids the sharp d4 lines where Black gets immediate counterplay.",
          },
        ],
      },
      {
        id: "italian-u2",
        title: "The Kingside Attack",
        description: "Master the signature Nf1–g3 maneuver and when to strike.",
        lessons: [
          {
            id: "italian-u2-l1",
            title: "The knight's long journey",
            focus: "Kingside pressure",
            prompt: "After Nbd2, White's f3 knight follows which route to reach the kingside?",
            choices: [
              "Nf3–f1–g3, arriving on g3 where it eyes h5 and supports f5",
              "Nf3–e5 immediately, occupying the central outpost",
              "Nf3–h4, threatening Nf5 right away",
            ],
            answer: "Nf3–f1–g3, arriving on g3 where it eyes h5 and supports f5",
            explanation:
              "The Nf1–g3 maneuver is the heart of the Italian slow attack. From g3, the knight pressures h5 and can support a future g4–g5 or f5 break. It takes patience, but the structure is very hard to crack.",
          },
          {
            id: "italian-u2-l2",
            title: "Knight reaches g3",
            focus: "Kingside pressure",
            prompt: "White has castled and played Nbd2. The f1 knight now completes the maneuver — where does it go?",
            choices: [],
            answer: "g3",
            explanation:
              "Ng3 is the destination. The knight now controls h5, supports f5, and keeps Black's pieces off the kingside. White will follow with Re1, Bb3, and a well-timed h4.",
            board: {
              instruction: "Tap the destination square for the knight on f1.",
              sourceSquare: "f1",
              targetSquare: "g3",
              pieces: [
                { square: "g1", piece: "K" }, { square: "d1", piece: "Q" },
                { square: "a1", piece: "R" }, { square: "e1", piece: "R" },
                { square: "c1", piece: "B" }, { square: "c4", piece: "B" },
                { square: "d2", piece: "N" }, { square: "f1", piece: "N" },
                { square: "a2", piece: "P" }, { square: "b2", piece: "P" },
                { square: "c3", piece: "P" }, { square: "d3", piece: "P" },
                { square: "e4", piece: "P" }, { square: "f2", piece: "P" },
                { square: "g2", piece: "P" }, { square: "h2", piece: "P" },
                { square: "g8", piece: "k" }, { square: "d8", piece: "q" },
                { square: "a8", piece: "r" }, { square: "f8", piece: "r" },
                { square: "c8", piece: "b" }, { square: "c5", piece: "b" },
                { square: "c6", piece: "n" }, { square: "f6", piece: "n" },
                { square: "a7", piece: "p" }, { square: "b7", piece: "p" },
                { square: "c7", piece: "p" }, { square: "d6", piece: "p" },
                { square: "e5", piece: "p" }, { square: "f7", piece: "p" },
                { square: "g7", piece: "p" }, { square: "h7", piece: "p" },
              ],
            },
          },
          {
            id: "italian-u2-l3",
            title: "When to push h4",
            focus: "Kingside pressure",
            prompt: "After Ng3, White's h4 push is most effective when…",
            choices: [
              "Black has played …h6 or …g6, giving h5 immediate value",
              "Immediately after castling, regardless of Black's setup",
              "Only after trading all minor pieces first",
            ],
            answer: "Black has played …h6 or …g6, giving h5 immediate value",
            explanation:
              "h4 is a lever, not a blunder. When Black has weakened the kingside with …h6 or …g6, h4–h5 becomes a real pawn storm threat. Rushing it before the position is ready just gives Black a target.",
          },
        ],
        checkpointQuiz: [
          {
            id: "italian-u2-q1",
            title: "Quiz: Ng3 purpose",
            focus: "Kingside pressure",
            prompt: "What makes Ng3 better than Ne5 in the Italian slow system?",
            choices: [
              "Ng3 is permanent and supports the whole kingside pawn storm",
              "Ne5 hangs a pawn immediately",
              "Ng3 attacks the queen",
            ],
            answer: "Ng3 is permanent and supports the whole kingside pawn storm",
            explanation:
              "Ne5 can be challenged with …Nxe5 or …d6. Ng3 can't easily be kicked — it quietly watches h5 and f5 while White finishes preparation.",
          },
          {
            id: "italian-u2-q2",
            title: "Quiz: Best bishop square",
            focus: "Kingside pressure",
            prompt: "After Black plays …d6, White usually moves the Italian bishop to…",
            choices: [
              "b3 — safe and still eyeing the a2–g8 diagonal",
              "d5 — trading it off immediately",
              "e2 — tucking it away defensively",
            ],
            answer: "b3 — safe and still eyeing the a2–g8 diagonal",
            explanation:
              "Bb3 keeps the bishop out of trouble and maintains long diagonal pressure. Trading it away voluntarily hands Black the bishop pair for free.",
          },
          {
            id: "italian-u2-q3",
            title: "Quiz: Role of Re1",
            focus: "Kingside pressure",
            prompt: "Why does White play Re1 before launching the kingside attack?",
            choices: [
              "It protects the e4 pawn and clears f1 for the knight maneuver",
              "It threatens to double rooks immediately",
              "It is a waiting move with no specific purpose",
            ],
            answer: "It protects the e4 pawn and clears f1 for the knight maneuver",
            explanation:
              "Re1 is multi-purpose: it shores up e4 so White doesn't have to worry about …Nxe4, and it frees the f1 square for the Nf1 relay toward g3.",
          },
        ],
      },
      {
        id: "italian-u3",
        title: "Meeting Black's Counters",
        description: "Know what Black is threatening and how to stay in control.",
        lessons: [
          {
            id: "italian-u3-l1",
            title: "Black's main counter: …d5",
            focus: "Center tension",
            prompt: "In the Giuoco Piano, Black's most direct counterplay comes from…",
            choices: [
              "…d5, striking at the e4 pawn and opening the center",
              "…a5, attacking the c4 bishop directly",
              "…Ng4, trying to win the e3 or f2 pawn",
            ],
            answer: "…d5, striking at the e4 pawn and opening the center",
            explanation:
              "…d5 is Black's best equalizing try. After exd5 Nxd5, Black has active pieces. White should continue developing calmly — the extra center space and bishop pair give enough compensation.",
          },
          {
            id: "italian-u3-l2",
            title: "Recapture after …d5 exd5",
            focus: "Center tension",
            prompt: "After 5.d3 d5 6.exd5, Black recaptures most actively with…",
            choices: [],
            answer: "d5",
            explanation:
              "After exd5, Black plays …Nxd5 (not …exd5 which just hands White a strong d4 square). The knight on d5 is well-placed but White keeps pressure with Nbd2 and Bb3. Recapturing here with the e-pawn simply opens lines in White's favour.",
            board: {
              instruction: "White captures on d5. Tap the destination square.",
              sourceSquare: "e4",
              targetSquare: "d5",
              pieces: [
                { square: "e1", piece: "K" }, { square: "d1", piece: "Q" },
                { square: "a1", piece: "R" }, { square: "h1", piece: "R" },
                { square: "c1", piece: "B" }, { square: "c4", piece: "B" },
                { square: "b1", piece: "N" }, { square: "f3", piece: "N" },
                { square: "a2", piece: "P" }, { square: "b2", piece: "P" },
                { square: "c3", piece: "P" }, { square: "d3", piece: "P" },
                { square: "e4", piece: "P" }, { square: "f2", piece: "P" },
                { square: "g2", piece: "P" }, { square: "h2", piece: "P" },
                { square: "e8", piece: "k" }, { square: "d8", piece: "q" },
                { square: "a8", piece: "r" }, { square: "h8", piece: "r" },
                { square: "c5", piece: "b" }, { square: "c8", piece: "b" },
                { square: "c6", piece: "n" }, { square: "f6", piece: "n" },
                { square: "a7", piece: "p" }, { square: "b7", piece: "p" },
                { square: "c7", piece: "p" }, { square: "d5", piece: "p" },
                { square: "e5", piece: "p" }, { square: "f7", piece: "p" },
                { square: "g7", piece: "p" }, { square: "h7", piece: "p" },
              ],
            },
          },
          {
            id: "italian-u3-l3",
            title: "Holding the initiative",
            focus: "Center tension",
            prompt: "After Black equalises in the center, Italian players stay ahead by…",
            choices: [
              "Keeping the bishop pair active and maintaining long-term piece pressure",
              "Trading everything off to a level endgame immediately",
              "Pushing the a and b pawns to create queenside threats",
            ],
            answer: "Keeping the bishop pair active and maintaining long-term piece pressure",
            explanation:
              "The Italian is a strategic opening. Even in equal-looking positions, the bishop pair and superior piece coordination compound over time. Forcing trades prematurely throws away your long-term edge.",
          },
        ],
        checkpointQuiz: [
          {
            id: "italian-u3-q1",
            title: "Quiz: Responding to …d5",
            focus: "Center tension",
            prompt: "After Black plays …d5 in the Giuoco Piano, White's best response is…",
            choices: [
              "exd5 — open the position and play actively",
              "e5 — kick the f6 knight and close the center",
              "d4 — try to hold the center with both pawns",
            ],
            answer: "exd5 — open the position and play actively",
            explanation:
              "exd5 keeps White's pieces active. e5 and d4 both overextend and give Black the …c5 or …f6 break later.",
          },
          {
            id: "italian-u3-q2",
            title: "Quiz: The Marshall-style sacrifice",
            focus: "Center tension",
            prompt: "Black's most aggressive counter in the Italian is sometimes called the Italian Marshall. What does it involve?",
            choices: [
              "Sacrificing the d5 pawn after …Nxd5 Nxd5 exd5 to get active piece play",
              "An immediate queen sortie to h4 to threaten checkmate",
              "A queenside castle followed by a pawn storm",
            ],
            answer: "Sacrificing the d5 pawn after …Nxd5 Nxd5 exd5 to get active piece play",
            explanation:
              "The Italian Marshall gives Black rapid development and attacking chances in exchange for a pawn. Italian players must know the key defensive moves to avoid getting swept off the board.",
          },
          {
            id: "italian-u3-q3",
            title: "Quiz: Long-term Italian edge",
            focus: "Center tension",
            prompt: "What is the Italian player's most reliable long-term asset when Black equalises the pawn structure?",
            choices: [
              "The bishop pair — more powerful as pieces come off and the board opens",
              "A passed d-pawn that wins the endgame automatically",
              "The open h-file after the kingside attack",
            ],
            answer: "The bishop pair — more powerful as pieces come off and the board opens",
            explanation:
              "Two bishops in an open or semi-open position are a concrete advantage. Trade pieces, not bishops, and the endgame will favour you.",
          },
        ],
      },
    ],
  },
  london: {
    headline: "Create a repeatable, low-maintenance White system.",
    units: [
      {
        id: "london-u1",
        title: "The London Shell",
        description: "Build the reliable d4–Bf4–e3–Nf3 setup that works against almost anything.",
        lessons: [
          {
            id: "london-u1-l1",
            title: "Get the bishop out early",
            focus: "Default setup",
            prompt: "After 1.d4 d5 2.Nf3 Nf6, White's most important early move is…",
            choices: [],
            answer: "f4",
            explanation:
              "Bf4 is the London's defining move. The bishop must come out before e3 locks it in permanently. This is the one move order rule London players must know cold.",
            board: {
              instruction: "Tap the destination square for the bishop on c1.",
              sourceSquare: "c1",
              targetSquare: "f4",
              pieces: [
                { square: "e1", piece: "K" }, { square: "d1", piece: "Q" },
                { square: "a1", piece: "R" }, { square: "h1", piece: "R" },
                { square: "c1", piece: "B" }, { square: "f1", piece: "B" },
                { square: "b1", piece: "N" }, { square: "f3", piece: "N" },
                { square: "a2", piece: "P" }, { square: "b2", piece: "P" },
                { square: "c2", piece: "P" }, { square: "d4", piece: "P" },
                { square: "e2", piece: "P" }, { square: "f2", piece: "P" },
                { square: "g2", piece: "P" }, { square: "h2", piece: "P" },
                { square: "e8", piece: "k" }, { square: "d8", piece: "q" },
                { square: "a8", piece: "r" }, { square: "h8", piece: "r" },
                { square: "c8", piece: "b" }, { square: "f8", piece: "b" },
                { square: "b8", piece: "n" }, { square: "f6", piece: "n" },
                { square: "a7", piece: "p" }, { square: "b7", piece: "p" },
                { square: "c7", piece: "p" }, { square: "d5", piece: "p" },
                { square: "e7", piece: "p" }, { square: "f7", piece: "p" },
                { square: "g7", piece: "p" }, { square: "h7", piece: "p" },
              ],
            },
          },
          {
            id: "london-u1-l2",
            title: "Why Bf4 before e3?",
            focus: "Default setup",
            prompt: "London players must play Bf4 before e3 because…",
            choices: [
              "e3 permanently blocks the c1 bishop — it can never reach f4 after that",
              "Bf4 attacks the d6 pawn immediately",
              "e3 is a mistake and should not be played in the London",
            ],
            answer: "e3 permanently blocks the c1 bishop — it can never reach f4 after that",
            explanation:
              "This is the London's most important move-order lesson. Once you play e3, the c1 bishop is locked behind your own pawn. Bf4 first, then e3 — every time.",
          },
          {
            id: "london-u1-l3",
            title: "Complete the shell — Nbd2",
            focus: "Default setup",
            prompt: "After 1.d4 d5 2.Bf4 Nf6 3.e3 e6 4.Nf3 Bd6, where does White's queen knight go?",
            choices: [],
            answer: "d2",
            explanation:
              "Nbd2 is the London's signature knight square. It keeps the c-file open for the rook, avoids blocking the Bf4, and supports a future e4 push. The full shell is d4 + Bf4 + e3 + Nf3 + Nbd2 + Bd3.",
            board: {
              instruction: "Tap the destination square for the knight on b1.",
              sourceSquare: "b1",
              targetSquare: "d2",
              pieces: [
                { square: "e1", piece: "K" }, { square: "d1", piece: "Q" },
                { square: "a1", piece: "R" }, { square: "h1", piece: "R" },
                { square: "f4", piece: "B" }, { square: "f1", piece: "B" },
                { square: "b1", piece: "N" }, { square: "f3", piece: "N" },
                { square: "a2", piece: "P" }, { square: "b2", piece: "P" },
                { square: "c2", piece: "P" }, { square: "d4", piece: "P" },
                { square: "e3", piece: "P" }, { square: "f2", piece: "P" },
                { square: "g2", piece: "P" }, { square: "h2", piece: "P" },
                { square: "e8", piece: "k" }, { square: "d8", piece: "q" },
                { square: "a8", piece: "r" }, { square: "h8", piece: "r" },
                { square: "c8", piece: "b" }, { square: "d6", piece: "b" },
                { square: "b8", piece: "n" }, { square: "f6", piece: "n" },
                { square: "a7", piece: "p" }, { square: "b7", piece: "p" },
                { square: "c7", piece: "p" }, { square: "d5", piece: "p" },
                { square: "e6", piece: "p" }, { square: "f7", piece: "p" },
                { square: "g7", piece: "p" }, { square: "h7", piece: "p" },
              ],
            },
          },
        ],
        checkpointQuiz: [
          {
            id: "london-u1-q1",
            title: "Quiz: First rule",
            focus: "Default setup",
            prompt: "What is the single most important move-order rule in the London System?",
            choices: [
              "Play Bf4 before e3 — otherwise the bishop is permanently locked in",
              "Always castle queenside for the attack",
              "Push c4 on move two to transpose to the Queen's Gambit",
            ],
            answer: "Play Bf4 before e3 — otherwise the bishop is permanently locked in",
            explanation: "Bf4 before e3 is the London's golden rule. Everything else is flexible.",
          },
          {
            id: "london-u1-q2",
            title: "Quiz: Nbd2 vs Nc3",
            focus: "Default setup",
            prompt: "Why does White prefer Nbd2 over Nc3 in the London?",
            choices: [
              "Nbd2 keeps the c-file open and avoids blocking the bishop on f4",
              "Nc3 immediately loses a pawn to …d4",
              "Nbd2 attacks the d5 pawn directly",
            ],
            answer: "Nbd2 keeps the c-file open and avoids blocking the bishop on f4",
            explanation:
              "Nc3 can actually work in some London lines, but Nbd2 is the classic choice — it keeps c2–c3 available and doesn't crowd the f4 bishop's diagonal.",
          },
          {
            id: "london-u1-q3",
            title: "Quiz: Completing the setup",
            focus: "Default setup",
            prompt: "The London's standard piece setup is d4 + Bf4 + e3 + Nf3 + Nbd2 + …",
            choices: [
              "Bd3 — the bishop supports the center and the eventual e4 push",
              "Bb5 — pinning Black's knight immediately",
              "Bg5 — putting pressure on the f6 knight",
            ],
            answer: "Bd3 — the bishop supports the center and the eventual e4 push",
            explanation:
              "Bd3 completes the London shell. The bishop eyes h7 after …Bxf4 exf4 and supports the e4 break. It's the natural resting square before castling.",
          },
        ],
      },
      {
        id: "london-u2",
        title: "The Attack Plan",
        description: "Learn the Ne5 outpost and how to build kingside pressure.",
        lessons: [
          {
            id: "london-u2-l1",
            title: "The Ne5 outpost",
            focus: "Kingside attack cues",
            prompt: "After completing the London shell, White's most powerful piece maneuver is…",
            choices: [
              "Ne5 — a powerful centralized outpost that cramps Black and supports f4",
              "Ng5 — immediately threatening f7",
              "Nh4 — preparing a bishop trade on f5",
            ],
            answer: "Ne5 — a powerful centralized outpost that cramps Black and supports f4",
            explanation:
              "Ne5 is the London's most threatening idea. The knight on e5 is hard to kick without conceding something, it supports f4–f5 plans, and it keeps Black's pieces passive.",
          },
          {
            id: "london-u2-l2",
            title: "Reach the outpost",
            focus: "Kingside attack cues",
            prompt: "From the completed London setup, White advances the knight to its ideal outpost.",
            choices: [],
            answer: "e5",
            explanation:
              "Ne5 plants the knight on the best square on the board. Black cannot play …Nxe5 without giving White a strong recapture. The knight on e5 supports Qh5 threats and a future f4–f5 pawn storm.",
            board: {
              instruction: "Tap the destination square for the knight on f3.",
              sourceSquare: "f3",
              targetSquare: "e5",
              pieces: [
                { square: "g1", piece: "K" }, { square: "d1", piece: "Q" },
                { square: "a1", piece: "R" }, { square: "f1", piece: "R" },
                { square: "f4", piece: "B" }, { square: "d3", piece: "B" },
                { square: "d2", piece: "N" }, { square: "f3", piece: "N" },
                { square: "a2", piece: "P" }, { square: "b2", piece: "P" },
                { square: "c2", piece: "P" }, { square: "d4", piece: "P" },
                { square: "e3", piece: "P" }, { square: "f2", piece: "P" },
                { square: "g2", piece: "P" }, { square: "h2", piece: "P" },
                { square: "g8", piece: "k" }, { square: "d8", piece: "q" },
                { square: "a8", piece: "r" }, { square: "f8", piece: "r" },
                { square: "c8", piece: "b" }, { square: "e7", piece: "b" },
                { square: "c6", piece: "n" }, { square: "f6", piece: "n" },
                { square: "a7", piece: "p" }, { square: "b7", piece: "p" },
                { square: "c7", piece: "p" }, { square: "d5", piece: "p" },
                { square: "e6", piece: "p" }, { square: "f7", piece: "p" },
                { square: "g7", piece: "p" }, { square: "h7", piece: "p" },
              ],
            },
          },
          {
            id: "london-u2-l3",
            title: "When to play f4",
            focus: "Kingside attack cues",
            prompt: "White plays f4 in the London when…",
            choices: [
              "Ne5 is already on the board, making f4–f5 a genuine pawn storm threat",
              "Immediately on move three, before developing pieces",
              "Only after Black has castled queenside",
            ],
            answer: "Ne5 is already on the board, making f4–f5 a genuine pawn storm threat",
            explanation:
              "f4 alone is just a pawn move. f4 with Ne5 already in place threatens f5, opening lines against the king. Always set up the knight first.",
          },
        ],
        checkpointQuiz: [
          {
            id: "london-u2-q1",
            title: "Quiz: Ne5 value",
            focus: "Kingside attack cues",
            prompt: "Why is Ne5 hard for Black to challenge in the London?",
            choices: [
              "…Nxe5 gives White dxe5, gaining space and locking Black's pieces in",
              "The knight on e5 is protected by three pieces simultaneously",
              "Black cannot play …f6 at all in this structure",
            ],
            answer: "…Nxe5 gives White dxe5, gaining space and locking Black's pieces in",
            explanation:
              "After dxe5, the e5 pawn cramps Black severely. The c6 and f6 knights lose their best squares. White has gained something real without even attacking yet.",
          },
          {
            id: "london-u2-q2",
            title: "Quiz: Attacking with the queen",
            focus: "Kingside attack cues",
            prompt: "With Ne5 in place, White's queen often jumps to…",
            choices: [
              "h5, threatening Qxh7 and combining with the f4–f5 pawn storm",
              "d3, doubling with the bishop",
              "b3, pressuring the queenside",
            ],
            answer: "h5, threatening Qxh7 and combining with the f4–f5 pawn storm",
            explanation:
              "Qh5 with Ne5 already on the board creates immediate mating threats. Black must respond carefully, often spending tempo on …g6, which weakens the kingside further.",
          },
          {
            id: "london-u2-q3",
            title: "Quiz: Bxd6 decision",
            focus: "Kingside attack cues",
            prompt: "When Black plays …Bd6 in the London, White should think about…",
            choices: [
              "Bxd6 — recapturing with the c-pawn gives Black a doubled pawn and opens the c-file for White",
              "Always retreating the bishop to g3 to keep it",
              "Immediately pushing h4 to attack",
            ],
            answer: "Bxd6 — recapturing with the c-pawn gives Black a doubled pawn and opens the c-file for White",
            explanation:
              "Trading on d6 and provoking …cxd6 gives Black a structural weakness on the c-file and a weak d6 pawn. It's often the right choice when the position calls for a structural advantage.",
          },
        ],
      },
      {
        id: "london-u3",
        title: "Handling Black's Counters",
        description: "Know what to do when Black fights back with …c5 or …Qb6.",
        lessons: [
          {
            id: "london-u3-l1",
            title: "Black's main plan: …c5",
            focus: "Common Black counters",
            prompt: "Black's most principled counter to the London is …c5. White should respond with…",
            choices: [
              "c3 — holding the d4 pawn and keeping the structure solid",
              "dxc5 — immediately giving up the center",
              "d5 — pushing forward and closing the position",
            ],
            answer: "c3 — holding the d4 pawn and keeping the structure solid",
            explanation:
              "c3 defends d4 and keeps the London's pawn chain intact. White doesn't need to fight for the center dynamically — the solid structure is the point of the opening.",
          },
          {
            id: "london-u3-l2",
            title: "Dealing with …Qb6",
            focus: "Common Black counters",
            prompt: "After …c5 …Qb6, Black attacks b2 and d4 at the same time. White's best response is…",
            choices: [
              "Qc1 or Qb3 — defending b2 while preparing to trade queens if Black wants",
              "b3 — blocking the queen's attack but weakening the c3 square",
              "Nd2–b3 — immediately counterattacking the queen",
            ],
            answer: "Qc1 or Qb3 — defending b2 while preparing to trade queens if Black wants",
            explanation:
              "Qb3 offers a queen trade that actually favours White — the resulting endgame is easier for White to play. Qc1 is the more circumspect option, keeping the queen in play.",
          },
          {
            id: "london-u3-l3",
            title: "When Black trades the bishop",
            focus: "Common Black counters",
            prompt: "If Black plays …Bxf4 to remove the London bishop, White recaptures with…",
            choices: [
              "exf4 — the f-pawn supports future f5 ideas and the e3–f4 chain",
              "gxf4 — opening the g-file for an attack",
              "Nxf4 — keeping a piece on f4",
            ],
            answer: "exf4 — the f-pawn supports future f5 ideas and the e3–f4 chain",
            explanation:
              "exf4 is correct. The f4 pawn fits naturally into the f4–f5 attack and keeps the pawn chain healthy. gxf4 weakens the kingside and is not the London's style.",
          },
        ],
        checkpointQuiz: [
          {
            id: "london-u3-q1",
            title: "Quiz: Answering …c5",
            focus: "Common Black counters",
            prompt: "Against …c5 in the London, White's most reliable response is…",
            choices: [
              "c3, keeping d4 stable without conceding the center",
              "dxc5, winning a pawn temporarily",
              "e4, turning it into a King's Indian Attack",
            ],
            answer: "c3, keeping d4 stable without conceding the center",
            explanation: "c3 is the London's backbone answer to …c5. Solid, reliable, and keeps all of White's pieces well placed.",
          },
          {
            id: "london-u3-q2",
            title: "Quiz: The …Qb6 weapon",
            focus: "Common Black counters",
            prompt: "Black plays …Qb6 to pressure b2 and d4. This is called…",
            choices: [
              "The London's most common practical problem — but easily handled with Qc1 or Qb3",
              "A decisive refutation of the London System",
              "An unusual sideline rarely seen in practice",
            ],
            answer: "The London's most common practical problem — but easily handled with Qc1 or Qb3",
            explanation:
              "…Qb6 looks scary but has a simple antidote. Knowing the queen moves here is what separates London players who prepared from those who panicked.",
          },
          {
            id: "london-u3-q3",
            title: "Quiz: London strength",
            focus: "Common Black counters",
            prompt: "What makes the London System genuinely strong at the club level and above?",
            choices: [
              "It's the same setup every game — you study plans, not positions, and outplay opponents in the middlegame",
              "It traps Black's queen in the first ten moves",
              "It leads to forced draws, making it safe for tournaments",
            ],
            answer: "It's the same setup every game — you study plans, not positions, and outplay opponents in the middlegame",
            explanation:
              "The London's real strength is efficiency. You spend your study time learning middlegame plans once, then deploy them game after game regardless of what Black does.",
          },
        ],
      },
    ],
  },
};

export function getLearningPath(openingKey: string): LearningPath | null {
  return learningPaths[openingKey] ?? null;
}

// ─── Legacy track system (preserved for backward compatibility) ───────────────

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
          explanation: "Knightora keeps openings manageable by starting with the recurring structure and ideas.",
        },
      ],
    };

  return {
    ...baseTrack,
    studies: baseTrack.studies ?? [
      `Review ${baseTrack.modules[0].toLowerCase()} before expanding your repertoire tree.`,
      `Study ${baseTrack.modules[1].toLowerCase()} through 2-3 model games.`,
      `Use ${baseTrack.modules[2].toLowerCase()} as the final review pass after the basics feel natural.`,
    ],
    lessons: [
      ...baseTrack.lessons,
      {
        id: `${openingKey}-review-1`,
        title: "Study priority",
        focus: baseTrack.modules[0],
        prompt: `When you review ${openingKey}, what should come before rare sidelines?`,
        choices: [baseTrack.modules[0], "Random traps", "Engine-only memorization"],
        answer: baseTrack.modules[0],
        explanation: `Knightora keeps ${openingKey} practical by prioritizing ${baseTrack.modules[0].toLowerCase()} first.`,
      },
      {
        id: `${openingKey}-review-2`,
        title: "Repertoire discipline",
        focus: baseTrack.modules[1],
        prompt: `What makes an opening actually usable in tournament or online play?`,
        choices: ["Clear recurring plans", "Maximum theory at once", "Learning every transposition first"],
        answer: "Clear recurring plans",
        explanation: "A playable repertoire is built on repeatable structures and plans, not on trying to memorize everything at once.",
      },
      ...buildExtendedReviewLessons(openingKey, baseTrack.modules),
    ],
  };
}

function buildExtendedReviewLessons(openingKey: string, modules: string[]): TrainingLesson[] {
  const focusA = modules[0] ?? "Core setup";
  const focusB = modules[1] ?? "Typical plan";
  const focusC = modules[2] ?? "Practical warning";

  return [
    {
      id: `${openingKey}-review-3`,
      title: "Move-order discipline",
      focus: focusA,
      prompt: `What is the best first priority when learning ${openingKey} move orders?`,
      choices: ["Understand the core branch first", "Memorize every sideline", "Rely only on engine top lines"],
      answer: "Understand the core branch first",
      explanation: "Strong opening prep starts with a reliable backbone before branching into edge cases.",
    },
    {
      id: `${openingKey}-review-4`,
      title: "Practical prep split",
      focus: focusA,
      prompt: "How should most improving players split opening study time?",
      choices: ["Mostly structures and plans, then tactics", "Only memorization", "Only blitz games"],
      answer: "Mostly structures and plans, then tactics",
      explanation: "You retain openings better by learning ideas first and tactical motifs second.",
    },
    {
      id: `${openingKey}-review-5`,
      title: "Opponent deviations",
      focus: focusB,
      prompt: "What is the most practical response to an uncommon opponent move?",
      choices: ["Return to your setup principles", "Panic and improvise", "Force a memorized trap"],
      answer: "Return to your setup principles",
      explanation: "Principle-based play keeps your position healthy even when theory leaves your file.",
    },
    {
      id: `${openingKey}-review-6`,
      title: "Middle-game bridge",
      focus: focusB,
      prompt: "What makes an opening truly useful in rated games?",
      choices: ["A clear middlegame plan", "A flashy line only", "Perfect recall of obscure traps"],
      answer: "A clear middlegame plan",
      explanation: "Openings are valuable when they consistently lead to positions you know how to handle.",
    },
    {
      id: `${openingKey}-review-7`,
      title: "Review timing",
      focus: focusC,
      prompt: "When should you revisit a line that caused mistakes?",
      choices: ["As soon as it is due or fresh", "At random months later", "Never, move on immediately"],
      answer: "As soon as it is due or fresh",
      explanation: "Short review cycles after mistakes lock in stronger decision patterns faster.",
    },
    {
      id: `${openingKey}-review-8`,
      title: "Game analysis loop",
      focus: focusC,
      prompt: "After each game, what opening note is most helpful?",
      choices: ["First critical decision point", "Only final result", "Only engine eval number"],
      answer: "First critical decision point",
      explanation: "Capturing the first key decision improves practical opening play fastest.",
    },
    {
      id: `${openingKey}-review-9`,
      title: "Repertoire depth",
      focus: focusA,
      prompt: "What is a better early goal for repertoire depth?",
      choices: ["One dependable line deeply", "Five lines shallowly", "Constantly switching systems"],
      answer: "One dependable line deeply",
      explanation: "Depth in a stable line creates confidence and transferable pattern recognition.",
    },
    {
      id: `${openingKey}-review-10`,
      title: "Counterplay awareness",
      focus: focusB,
      prompt: "What should you always identify before move 10?",
      choices: ["Both sides' main pawn breaks", "Only your king safety", "Only your next move"],
      answer: "Both sides' main pawn breaks",
      explanation: "Knowing the breaks tells you where tactics and plans are likely to appear.",
    },
    {
      id: `${openingKey}-review-11`,
      title: "Time-control adaptation",
      focus: focusC,
      prompt: "How should opening prep differ in faster time controls?",
      choices: ["Prefer simpler, repeatable plans", "Use only sharp novelties", "Skip preparation entirely"],
      answer: "Prefer simpler, repeatable plans",
      explanation: "In blitz/rapid, consistency and pattern speed usually outperform complexity.",
    },
    {
      id: `${openingKey}-review-12`,
      title: "Training quality check",
      focus: focusC,
      prompt: "What signals that your opening training is working?",
      choices: ["Fewer early-game blunders", "Longer study notes only", "More tab browsing"],
      answer: "Fewer early-game blunders",
      explanation: "Performance gains in your first 10-15 moves are the strongest practical signal.",
    },
  ];
}
