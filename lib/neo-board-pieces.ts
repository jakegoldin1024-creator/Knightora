/** Shared piece assets for neo-themed boards (quiz drills + variation previews). */

export function getNeoPieceSrc(piece: string) {
  const normalized = piece === piece.toUpperCase() ? `w${piece.toLowerCase()}` : `b${piece}`;
  return `/pieces/neo/${normalized}.png`;
}

export function getUnicodePieceGlyph(piece: string): string {
  const table: Record<string, string> = {
    K: "♔",
    Q: "♕",
    R: "♖",
    B: "♗",
    N: "♘",
    P: "♙",
    k: "♚",
    q: "♛",
    r: "♜",
    b: "♝",
    n: "♞",
    p: "♟",
  };
  return table[piece] ?? "";
}
