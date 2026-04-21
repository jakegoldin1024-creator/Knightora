import { Chess } from "chess.js";

/** Knightneo board piece codes: White KQRBNP, Black kqrnbp */
export function fenToKnightneoPlacements(fen: string): Array<{ square: string; piece: string }> {
  const chess = new Chess(fen);
  const board = chess.board();
  const out: Array<{ square: string; piece: string }> = [];
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const cell = board[r][f];
      if (!cell) continue;
      const square = `${String.fromCharCode(97 + f)}${8 - r}`;
      const t = cell.type;
      const piece = cell.color === "w" ? t.toUpperCase() : t.toLowerCase();
      out.push({ square, piece });
    }
  }
  return out;
}
