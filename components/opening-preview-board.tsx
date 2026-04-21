"use client";

import { Chess } from "chess.js";
import { useMemo, useState } from "react";
import { getNeoPieceSrc, getUnicodePieceGlyph } from "@/lib/neo-board-pieces";
import styles from "./opening-preview-board.module.css";

type OpeningPreviewBoardProps = {
  fen: string;
  orientation: "white" | "black";
  /** Shown under the board (e.g. first plies SAN). */
  movesCaption?: string;
};

export function OpeningPreviewBoard({ fen, orientation, movesCaption }: OpeningPreviewBoardProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const pieceMap = useMemo(() => {
    try {
      const chess = new Chess(fen);
      const board = chess.board();
      const map = new Map<string, string>();
      for (let r = 0; r < 8; r++) {
        for (let f = 0; f < 8; f++) {
          const cell = board[r][f];
          if (!cell) continue;
          const square = `${String.fromCharCode("a".charCodeAt(0) + f)}${8 - r}`;
          const ch = cell.type;
          const piece = cell.color === "w" ? ch.toUpperCase() : ch.toLowerCase();
          map.set(square, piece);
        }
      }
      return map;
    } catch {
      return new Map<string, string>();
    }
  }, [fen]);

  const files = orientation === "white" ? ["a", "b", "c", "d", "e", "f", "g", "h"] : ["h", "g", "f", "e", "d", "c", "b", "a"];
  const ranks = orientation === "white" ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];

  return (
    <div className={styles.shell}>
      <div className={styles.boardWrap}>
        <div className={styles.grid} aria-hidden>
          {ranks.flatMap((rank) =>
            files.map((file) => {
              const square = `${file}${rank}`;
              const piece = pieceMap.get(square);
              const boardFileIndex = file.charCodeAt(0) - "a".charCodeAt(0);
              const isDark = (boardFileIndex + rank) % 2 === 1;
              return (
                <div key={square} className={`${styles.square} ${isDark ? styles.dark : styles.light}`}>
                  {piece ? (
                    imgFailed ? (
                      <span className={styles.pieceGlyph}>{getUnicodePieceGlyph(piece)}</span>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element -- match interactive board: native img for pieces
                      <img
                        src={getNeoPieceSrc(piece)}
                        alt=""
                        width={44}
                        height={44}
                        className={styles.pieceImg}
                        onError={() => setImgFailed(true)}
                      />
                    )
                  ) : null}
                </div>
              );
            }),
          )}
        </div>
      </div>
      {movesCaption ? (
        <p className={styles.caption} title={movesCaption}>
          {movesCaption}
        </p>
      ) : null}
    </div>
  );
}
