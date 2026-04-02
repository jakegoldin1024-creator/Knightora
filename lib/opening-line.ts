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
 * Optional `stepHints` (same length as `moves`) adds a short "why" for each ply.
 */
export function buildOpeningLineFromSanMoves(moves: string[], stepHints?: string[]): OpeningLine {
  const chess = new Chess();
  const steps: OpeningLineStep[] = [];

  for (let i = 0; i < moves.length; i++) {
    const san = moves[i];
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

    const hint = stepHints?.[i]?.trim() || buildAutoHint(result.san, i);

    steps.push({
      instruction,
      san: result.san,
      sourceSquare: result.from,
      targetSquare: result.to,
      pieces,
      fen: fenBefore,
      hint: hint || undefined,
    });
  }

  return {
    summary: moves.join(" "),
    steps,
  };
}

function buildAutoHint(san: string, idx: number): string {
  const side = idx % 2 === 0 ? "White" : "Black";
  if (san.startsWith("O-O-O")) return `${side} castles long to connect rooks and launch opposite-wing play.`;
  if (san.startsWith("O-O")) return `${side} castles to king safety and activates the rook.`;
  if (san.includes("=")) return `${side} promotes and converts a pawn into immediate material and tactical force.`;
  if (san.includes("#")) return `${side} delivers checkmate; the king has no legal escape.`;
  if (san.includes("+")) return `${side} gives check to force a concrete defensive response.`;
  if (san.startsWith("N")) return `${side} develops a knight toward active central control and tactical pressure.`;
  if (san.startsWith("B")) return `${side} develops a bishop to improve diagonals and piece coordination.`;
  if (san.startsWith("R")) return `${side} activates a rook to contest open files and improve coordination.`;
  if (san.startsWith("Q")) return `${side} repositions the queen to support threats and key central squares.`;
  if (san.startsWith("K")) return `${side} improves king placement for safety and endgame readiness.`;
  if (san.includes("x")) return `${side} captures to simplify or win space while improving piece activity.`;
  return `${side} improves structure and coordination to support the next plan.`;
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

