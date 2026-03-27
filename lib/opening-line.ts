import { Chess } from "chess.js";

/** One ply: position before the move, user taps the target square. */
export type OpeningLineStep = {
  instruction: string;
  san: string;
  sourceSquare?: string;
  targetSquare: string;
  pieces: Array<{ square: string; piece: string }>;
  /** Position before this ply — used for legal-move validation in the UI. */
  fen: string;
  hint?: string;
};

export type OpeningLine = {
  /** Human-readable move list for prompts */
  summary: string;
  steps: OpeningLineStep[];
};

/**
 * Build a full multi-move line from standard algebraic notation (SAN) moves.
 * Each step shows the board before that move is played.
 */
export function buildOpeningLineFromSanMoves(moves: string[]): OpeningLine {
  const chess = new Chess();
  const steps: OpeningLineStep[] = [];

  for (const san of moves) {
    const fenBefore = chess.fen();
    const pieces = chessBoardToPlacements(chess.board());
    const result = chess.move(san);
    if (!result) {
      throw new Error(`Illegal or ambiguous move in opening line: "${san}"`);
    }

    const instruction =
      result.san.startsWith("O-O") || result.san.startsWith("O-O-O")
        ? `Castle (${result.san}). Tap the king's destination square.`
        : `Play ${result.san}. Tap the correct destination square.`;

    steps.push({
      instruction,
      san: result.san,
      sourceSquare: result.from,
      targetSquare: result.to,
      pieces,
      fen: fenBefore,
    });
  }

  return {
    summary: moves.join(" "),
    steps,
  };
}

function chessBoardToPlacements(
  board: ReturnType<Chess["board"]>,
): Array<{ square: string; piece: string }> {
  const files = "abcdefgh";
  const pieces: Array<{ square: string; piece: string }> = [];

  for (let rankIndex = 0; rankIndex < 8; rankIndex++) {
    for (let fileIndex = 0; fileIndex < 8; fileIndex++) {
      const cell = board[rankIndex][fileIndex];
      if (!cell) continue;
      const square = `${files[fileIndex]}${8 - rankIndex}`;
      const ch = toKnightoraPiece(cell);
      pieces.push({ square, piece: ch });
    }
  }

  return pieces;
}

function toKnightoraPiece(cell: { color: "w" | "b"; type: "p" | "n" | "b" | "r" | "q" | "k" }) {
  const map: Record<typeof cell.type, string> = {
    p: "p",
    n: "n",
    b: "b",
    r: "r",
    q: "q",
    k: "k",
  };
  const lower = map[cell.type];
  return cell.color === "w" ? lower.toUpperCase() : lower;
}

