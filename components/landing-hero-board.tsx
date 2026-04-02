import styles from "./landing-hero-board.module.css";

/** Decorative 8×8 board + starting position feel — not interactive. */
export function LandingHeroBoard() {
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
        <span className={`${styles.piece} ${styles.rook}`} style={{ gridColumn: 1, gridRow: 1 }} />
        <span className={`${styles.piece} ${styles.knight}`} style={{ gridColumn: 2, gridRow: 1 }} />
        <span className={`${styles.piece} ${styles.bishop}`} style={{ gridColumn: 3, gridRow: 1 }} />
        <span className={`${styles.piece} ${styles.queen}`} style={{ gridColumn: 4, gridRow: 1 }} />
        <span className={`${styles.piece} ${styles.king}`} style={{ gridColumn: 5, gridRow: 1 }} />
        <span className={`${styles.piece} ${styles.bishop}`} style={{ gridColumn: 6, gridRow: 1 }} />
        <span className={`${styles.piece} ${styles.knight}`} style={{ gridColumn: 7, gridRow: 1 }} />
        <span className={`${styles.piece} ${styles.rook}`} style={{ gridColumn: 8, gridRow: 1 }} />
        {files.map((_, i) => (
          <span key={`wp-${i}`} className={`${styles.piece} ${styles.pawn}`} style={{ gridColumn: i + 1, gridRow: 2 }} />
        ))}
        <span className={`${styles.piece} ${styles.pawnDark}`} style={{ gridColumn: 5, gridRow: 7 }} />
        <span className={`${styles.piece} ${styles.kingDark}`} style={{ gridColumn: 5, gridRow: 8 }} />
      </div>
      <span className={styles.coordCorner}>e4</span>
    </div>
  );
}
