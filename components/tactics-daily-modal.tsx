"use client";

import { Chess } from "chess.js";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DailyPuzzle } from "@/data/daily-puzzles";
import { getNeoPieceSrc, getUnicodePieceGlyph } from "@/lib/neo-board-pieces";
import styles from "./tactics-daily-modal.module.css";

type TacticsDailyModalProps = {
  open: boolean;
  puzzles: DailyPuzzle[];
  onClose: () => void;
  onSolvedPuzzle: () => void;
};

export function TacticsDailyModal({ open, puzzles, onClose, onSolvedPuzzle }: TacticsDailyModalProps) {
  const [index, setIndex] = useState(0);
  const [fromSquare, setFromSquare] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<"idle" | "correct" | "wrong">("idle");
  const [imgFailed, setImgFailed] = useState(false);

  const puzzle = puzzles[index] ?? null;

  useEffect(() => {
    if (!open) return;
    setIndex(0);
    setFromSquare(null);
    setRevealed("idle");
    setImgFailed(false);
  }, [open, puzzles]);

  const orientation = useMemo(() => {
    if (!puzzle) return "white";
    try {
      return new Chess(puzzle.fen).turn() === "b" ? "black" : "white";
    } catch {
      return "white";
    }
  }, [puzzle]);

  const pieceMap = useMemo(() => {
    if (!puzzle) return new Map<string, string>();
    try {
      const chess = new Chess(puzzle.fen);
      const board = chess.board();
      const map = new Map<string, string>();
      for (let r = 0; r < 8; r++) {
        for (let f = 0; f < 8; f++) {
          const cell = board[r][f];
          if (!cell) continue;
          const square = `${String.fromCharCode(97 + f)}${8 - r}`;
          const ch = cell.type;
          const piece = cell.color === "w" ? ch.toUpperCase() : ch.toLowerCase();
          map.set(square, piece);
        }
      }
      return map;
    } catch {
      return new Map<string, string>();
    }
  }, [puzzle]);

  const handleSquare = useCallback(
    (square: string) => {
      if (!puzzle || revealed !== "idle") return;
      const piece = pieceMap.get(square);
      if (fromSquare == null) {
        if (!piece) return;
        try {
          const c = new Chess(puzzle.fen);
          const turn = c.turn();
          const isOwn =
            (turn === "w" && piece === piece.toUpperCase() && piece !== piece.toLowerCase()) ||
            (turn === "b" && piece === piece.toLowerCase() && piece !== piece.toUpperCase());
          if (!isOwn) return;
        } catch {
          return;
        }
        setFromSquare(square);
        return;
      }

      if (square === fromSquare) {
        setFromSquare(null);
        return;
      }

      const ok = fromSquare === puzzle.from && square === puzzle.to;
      setRevealed(ok ? "correct" : "wrong");
      if (ok) {
        onSolvedPuzzle();
        window.setTimeout(() => {
          if (index >= puzzles.length - 1) {
            onClose();
            return;
          }
          setIndex((i) => i + 1);
          setFromSquare(null);
          setRevealed("idle");
        }, 650);
      } else {
        window.setTimeout(() => {
          setFromSquare(null);
          setRevealed("idle");
        }, 700);
      }
    },
    [fromSquare, index, onClose, onSolvedPuzzle, pieceMap, puzzle, puzzles.length, revealed],
  );

  if (!open || !puzzle) return null;

  const files = orientation === "white" ? ["a", "b", "c", "d", "e", "f", "g", "h"] : ["h", "g", "f", "e", "d", "c", "b", "a"];
  const ranks = orientation === "white" ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];

  return (
    <div className={styles.backdrop} role="dialog" aria-modal aria-labelledby="tactics-daily-title">
      <div className={styles.dialog}>
        <div className={styles.header}>
          <h2 id="tactics-daily-title" className={styles.title}>
            Daily tactics
          </h2>
          <button type="button" className={styles.close} onClick={onClose}>
            Close
          </button>
        </div>
        <p className={styles.meta}>
          Puzzle {index + 1} of {puzzles.length} · click your piece, then the destination
        </p>
        <p className={styles.hint}>{puzzle.hint}</p>
        <div className={styles.boardShell}>
          <div className={styles.boardGrid}>
            {ranks.flatMap((rank) =>
              files.map((file) => {
                const square = `${file}${rank}`;
                const piece = pieceMap.get(square);
                const boardFileIndex = file.charCodeAt(0) - "a".charCodeAt(0);
                const isDark = (boardFileIndex + rank) % 2 === 1;
                const isSelected = fromSquare === square;
                const showCorrect = revealed === "correct" && (square === puzzle.to || square === puzzle.from);
                const showWrong = revealed === "wrong" && (square === fromSquare || square === puzzle.to);
                return (
                  <button
                    key={square}
                    type="button"
                    className={`${styles.square} ${isDark ? styles.squareDark : styles.squareLight} ${isSelected ? styles.squareSelected : ""} ${showCorrect ? styles.squareCorrect : ""} ${showWrong ? styles.squareWrong : ""}`}
                    onClick={() => handleSquare(square)}
                  >
                    {piece ? (
                      imgFailed ? (
                        <span className={styles.pieceGlyph}>{getUnicodePieceGlyph(piece)}</span>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element -- match app board assets
                        <img
                          src={getNeoPieceSrc(piece)}
                          alt=""
                          className={styles.pieceImg}
                          onError={() => setImgFailed(true)}
                        />
                      )
                    ) : null}
                  </button>
                );
              }),
            )}
          </div>
        </div>
        <p className={styles.feedback}>
          {revealed === "wrong" ? "Not quite — try the combo again." : null}
          {revealed === "correct" ? "Nice — counting toward your quest." : null}
        </p>
        <div className={styles.actions}>
          <button type="button" className={`${styles.button} ${styles.buttonPrimary}`} onClick={() => setFromSquare(null)}>
            Clear selection
          </button>
        </div>
      </div>
    </div>
  );
}
