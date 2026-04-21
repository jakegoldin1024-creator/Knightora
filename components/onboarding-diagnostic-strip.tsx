"use client";

import { Chess } from "chess.js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { OnboardingPuzzle } from "@/data/onboarding-puzzles";
import { getNeoPieceSrc, getUnicodePieceGlyph } from "@/lib/neo-board-pieces";
import styles from "./onboarding-diagnostic-strip.module.css";

type OnboardingDiagnosticStripProps = {
  puzzles: OnboardingPuzzle[];
  onComplete: (summary: { attempted: number; correct: number }) => void;
};

export function OnboardingDiagnosticStrip({ puzzles, onComplete }: OnboardingDiagnosticStripProps) {
  const [index, setIndex] = useState(0);
  const [fromSquare, setFromSquare] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<"idle" | "correct" | "wrong">("idle");
  const [done, setDone] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const totalsRef = useRef({ attempted: 0, correct: 0 });

  const puzzle = puzzles[index] ?? null;

  useEffect(() => {
    totalsRef.current = { attempted: 0, correct: 0 };
    setIndex(0);
    setFromSquare(null);
    setRevealed("idle");
    setDone(false);
    setImgFailed(false);
  }, [puzzles]);

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

  const finalize = useCallback(() => {
    setDone(true);
    onComplete({ ...totalsRef.current });
  }, [onComplete]);

  const handleSquare = useCallback(
    (square: string) => {
      if (!puzzle || revealed !== "idle" || done) return;
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
      totalsRef.current.attempted += 1;
      if (ok) totalsRef.current.correct += 1;
      setRevealed(ok ? "correct" : "wrong");

      const isLast = index >= puzzles.length - 1;
      window.setTimeout(() => {
        if (isLast) {
          finalize();
          return;
        }
        setIndex((i) => i + 1);
        setFromSquare(null);
        setRevealed("idle");
      }, ok ? 520 : 640);
    },
    [done, finalize, fromSquare, index, pieceMap, puzzle, puzzles.length, revealed],
  );

  if (!puzzles.length) {
    return (
      <div className={styles.empty}>
        <p>No diagnostic puzzles for this profile band.</p>
        <button type="button" className={styles.skip} onClick={finalize}>
          Continue
        </button>
      </div>
    );
  }

  if (!puzzle) return null;

  if (done) {
    return (
      <div className={styles.done}>
        <p className={styles.doneTitle}>Diagnostic saved</p>
        <p className={styles.doneMeta}>
          {totalsRef.current.correct} correct of {totalsRef.current.attempted} attempts — we use this only inside Knightneo to tune your daily puzzle
          difficulty, not as an Elo.
        </p>
      </div>
    );
  }

  const files = orientation === "white" ? ["a", "b", "c", "d", "e", "f", "g", "h"] : ["h", "g", "f", "e", "d", "c", "b", "a"];
  const ranks = orientation === "white" ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];

  return (
    <div className={styles.strip}>
      <p className={styles.eyebrow}>Quick puzzle check</p>
      <h3 className={styles.heading}>Five one-movers — calibrates your daily tactics band</h3>
      <p className={styles.lede}>
        Puzzle {index + 1} of {puzzles.length}. Tap your piece, then the winning square (same as training boards).
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
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={getNeoPieceSrc(piece)} alt="" className={styles.pieceImg} onError={() => setImgFailed(true)} />
                    )
                  ) : null}
                </button>
              );
            }),
          )}
        </div>
      </div>
      <p className={styles.feedback}>
        {revealed === "wrong" ? "Try again on the next puzzle." : null}
        {revealed === "correct" ? "Got it." : null}
      </p>
      <button type="button" className={styles.skip} onClick={finalize}>
        Skip remaining
      </button>
    </div>
  );
}
