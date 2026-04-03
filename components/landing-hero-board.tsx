import Image from "next/image";
import { Chess } from "chess.js";
import styles from "./landing-hero-board.module.css";

const NEO_PIECE_BASE = "https://lichess1.org/assets/piece/neo";

const PIECE_FILES: Record<string, string> = { p: "P", n: "N", b: "B", r: "R", q: "Q", k: "K" };

function neoPieceSrc(color: "w" | "b", type: string): string {
  const prefix = color === "w" ? "w" : "b";
  const letter = PIECE_FILES[type] ?? "P";
  return `${NEO_PIECE_BASE}/${prefix}${letter}.svg`;
}

/** Decorative 8×8 starting position — Lichess Neo pieces, not interactive. */
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
            return (
              <div key={`${ri}-${ci}`} className={styles.pieceCell} style={{ gridColumn: ci + 1, gridRow: ri + 1 }}>
                <Image
                  src={neoPieceSrc(square.color, square.type)}
                  alt=""
                  className={styles.pieceImg}
                  width={64}
                  height={64}
                  unoptimized
                  loading="lazy"
                />
              </div>
            );
          }),
        )}
      </div>
      <span className={styles.coordCorner}>e4</span>
    </div>
  );
}
