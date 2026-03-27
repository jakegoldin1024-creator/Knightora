import { Chess, type Square } from "chess.js";

/** True if `to` is a legal destination for the piece on `from` in this position. */
export function isLegalDestinationForSource(fen: string, from: string | undefined, to: string): boolean {
  if (!from) return isAnyLegalDestination(fen, to);
  try {
    const chess = new Chess(fen);
    const moves = chess.moves({ square: from as Square, verbose: true });
    return moves.some((m) => m.to === to);
  } catch {
    return false;
  }
}

/** True if any legal move can land on `to` (used when source is unknown). */
export function isAnyLegalDestination(fen: string, to: string): boolean {
  try {
    const chess = new Chess(fen);
    return chess.moves({ verbose: true }).some((m) => m.to === to);
  } catch {
    return false;
  }
}

/** Destination squares available to the piece on `from` (for UI hints). */
export function getLegalDestinationsForSource(fen: string, from: string | undefined): Set<string> {
  const out = new Set<string>();
  if (!from) return out;
  try {
    const chess = new Chess(fen);
    const moves = chess.moves({ square: from as Square, verbose: true });
    for (const m of moves) {
      out.add(m.to);
    }
  } catch {
    /* ignore */
  }
  return out;
}
