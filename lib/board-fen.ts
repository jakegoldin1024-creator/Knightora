import { Chess, type Square } from "chess.js";

/**
 * Build a FEN string from Knightora piece placements (uppercase = White).
 * Used so board drills can validate legal destinations with chess.js.
 */
export function buildFenFromKnightoraPlacements(
  placements: Array<{ square: string; piece: string }>,
  sideToMove: "w" | "b",
): string {
  const chess = new Chess();
  chess.clear();
  for (const { square, piece } of placements) {
    const isWhite = piece === piece.toUpperCase();
    const type = piece.toLowerCase() as "p" | "n" | "b" | "r" | "q" | "k";
    const ok = chess.put({ type, color: isWhite ? "w" : "b" }, square as Square);
    if (!ok) {
      throw new Error(`Invalid placement: ${piece} on ${square}`);
    }
  }
  chess.setTurn(sideToMove);
  return chess.fen();
}

/** Infer who is to move from the piece that should move this turn. */
export function inferSideToMoveFromSource(
  placements: Array<{ square: string; piece: string }>,
  sourceSquare?: string,
): "w" | "b" {
  if (sourceSquare) {
    const p = placements.find((x) => x.square === sourceSquare)?.piece;
    if (p) return p === p.toUpperCase() ? "w" : "b";
  }
  return "w";
}
