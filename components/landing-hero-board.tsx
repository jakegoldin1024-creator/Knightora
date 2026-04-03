import { Chess } from "chess.js";
import styles from "./landing-hero-board.module.css";

/** Unicode chess symbols; font stack falls back to glyphs that render filled pieces. */
const GLYPH: Record<"w" | "b", Record<string, string>> = {
  w: { p: "\u2659", n: "\u2658", b: "\u2657", r: "\u2656", q: "\u2655", k: "\u2654" },
  b: { p: "\u265f", n: "\u265e", b: "\u265d", r: "\u265c", q: "\u265b", k: "\u265a" },
};

/** Decorative 8×8 starting position — not interactive. Grid row 1 = rank 8 (top). */
export function LandingHeroBoard() {
  const chess = new Chess();
  const board = chess.board();
  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
  const ranks = [8, 7, 6, 5, 4, 3, 2, 1];

  return (
    <div className={styles.wrap} aria-hidden>
      <div className={styles.board}>
        {ranks.map((rank) =>
          files.map((file, fi) => {
            const dark = (fi + rank) % 2 === 1;
            return <div key={`${file}${rank}`} className={dark ? styles.dark : styles.light} />;
          }),
        )}
      </div>
      <div className={styles.pieceLayer}>
        {board.map((row, ri) =>
          row.map((square, ci) => {
            if (!square) return null;
            const glyph = GLYPH[square.color][square.type];
            return (
              <span
                key={`${ri}-${ci}`}
                className={`${styles.piece} ${square.color === "w" ? styles.pieceWhite : styles.pieceBlack}`}
                style={{ gridColumn: ci + 1, gridRow: ri + 1 }}
              >
                {glyph}
              </span>
            );
          }),
        )}
      </div>
      <span className={styles.coordCorner}>e4</span>
    </div>
  );
}
