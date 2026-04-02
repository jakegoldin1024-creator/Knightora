"use client";

import { useEffect, useState } from "react";
import { type SubscriptionPlan, isPaidPlan } from "@/lib/subscription";
import styles from "./game-analysis-panel.module.css";

type AnalysisLevel = "beginner" | "developing" | "improving" | "advanced";
type GameAnalysisMove = {
  ply: number;
  fullMove: number;
  side: "white" | "black";
  san: string;
  bestUci: string;
  practicalUci: string;
  evalLossCp: number;
  phase: "opening" | "middlegame" | "endgame";
  severity: "good" | "inaccuracy" | "mistake" | "blunder";
};
type GameAnalysisResult = {
  report: {
    source: "pgn" | "chesscom" | "lichess";
    level: AnalysisLevel;
    summary: {
      opening: string;
      whiteCentipawnLoss: number;
      blackCentipawnLoss: number;
      keyMoments: number[];
    };
    moves: GameAnalysisMove[];
    recommendations: string[];
  };
  coach: {
    overall: string;
    opening: string;
    middlegame: string;
    endgame: string;
    keyMoments: Array<{
      ply: number;
      headline: string;
      bestMove: string;
      practicalMove: string;
      explanation: string;
    }>;
  };
};

const GAME_ANALYSIS_RECENT_KEY = "knightora-game-analysis-recent-v1";

export function GameAnalysisPanel({ selectedPlan }: { selectedPlan: SubscriptionPlan }) {
  const [gameInputMode, setGameInputMode] = useState<"pgn" | "url">("pgn");
  const [gamePgnInput, setGamePgnInput] = useState("");
  const [gameUrlInput, setGameUrlInput] = useState("");
  const [gameLevel, setGameLevel] = useState<AnalysisLevel>("developing");
  const [gameAnalysisPending, setGameAnalysisPending] = useState(false);
  const [gameAnalysisError, setGameAnalysisError] = useState<string | null>(null);
  const [gameAnalysisResult, setGameAnalysisResult] = useState<GameAnalysisResult | null>(null);
  const [recentAnalyses, setRecentAnalyses] = useState<Array<{ opening: string; source: string; createdAt: string }>>([]);

  const canUseFullGameAnalysis = isPaidPlan(selectedPlan);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(GAME_ANALYSIS_RECENT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Array<{ opening: string; source: string; createdAt: string }>;
      if (Array.isArray(parsed)) setRecentAnalyses(parsed.slice(0, 8));
    } catch {
      // ignore local parse issues
    }
  }, []);

  async function analyzeSubmittedGame() {
    setGameAnalysisError(null);
    setGameAnalysisResult(null);
    if (!canUseFullGameAnalysis) {
      setGameAnalysisError("Full-game analysis is included with a Knightora subscription ($9.99/mo or $99.99/yr).");
      return;
    }
    if (gameInputMode === "pgn" && !gamePgnInput.trim()) {
      setGameAnalysisError("Paste a PGN first.");
      return;
    }
    if (gameInputMode === "url" && !gameUrlInput.trim()) {
      setGameAnalysisError("Paste a Chess.com or Lichess game URL first.");
      return;
    }

    setGameAnalysisPending(true);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 25000);
    try {
      const response = await fetch("/api/game-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          level: gameLevel,
          pgn: gameInputMode === "pgn" ? gamePgnInput : undefined,
          url: gameInputMode === "url" ? gameUrlInput : undefined,
        }),
      });
      const payload = (await response.json()) as GameAnalysisResult | { error?: string };
      if (!response.ok || !("report" in payload)) {
        throw new Error("error" in payload && payload.error ? payload.error : "Game analysis failed.");
      }
      setGameAnalysisResult(payload);
      const nextRecent = [
        {
          opening: payload.report.summary.opening,
          source: payload.report.source,
          createdAt: new Date().toISOString(),
        },
        ...recentAnalyses,
      ].slice(0, 8);
      setRecentAnalyses(nextRecent);
      try {
        window.localStorage.setItem(GAME_ANALYSIS_RECENT_KEY, JSON.stringify(nextRecent));
      } catch {
        // ignore local storage failures
      }
    } catch (error) {
      const message =
        error instanceof DOMException && error.name === "AbortError"
          ? "Analysis took too long. Try a shorter game or reduce depth via GAME_ANALYSIS_DEPTH=2."
          : error instanceof Error
            ? error.message
            : "Game analysis failed.";
      setGameAnalysisError(message);
    } finally {
      window.clearTimeout(timeout);
      setGameAnalysisPending(false);
    }
  }

  return (
    <section className={styles.panel}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>Game coach</p>
        <h1 className={styles.title}>Full-game human-level analysis</h1>
        <p className={styles.intro}>Import a full game and get practical coaching for opening, middlegame, and endgame decisions.</p>
      </div>

      <div className={styles.toolbar}>
        <button type="button" className={`${styles.button} ${gameInputMode === "pgn" ? styles.buttonPrimary : ""}`} onClick={() => setGameInputMode("pgn")}>
          PGN
        </button>
        <button type="button" className={`${styles.button} ${gameInputMode === "url" ? styles.buttonPrimary : ""}`} onClick={() => setGameInputMode("url")}>
          URL
        </button>
        <select className={styles.selectInput} value={gameLevel} onChange={(event) => setGameLevel(event.target.value as AnalysisLevel)}>
          <option value="beginner">Beginner</option>
          <option value="developing">Developing</option>
          <option value="improving">Improving</option>
          <option value="advanced">Advanced</option>
        </select>
        <button type="button" className={`${styles.button} ${styles.buttonPrimary}`} onClick={() => void analyzeSubmittedGame()} disabled={gameAnalysisPending}>
          {gameAnalysisPending ? "Analyzing..." : "Analyze game"}
        </button>
      </div>

      {gameInputMode === "pgn" ? (
        <textarea className={styles.analysisTextarea} value={gamePgnInput} onChange={(event) => setGamePgnInput(event.target.value)} placeholder="Paste full PGN here..." rows={8} />
      ) : (
        <input className={styles.analysisUrlInput} type="url" value={gameUrlInput} onChange={(event) => setGameUrlInput(event.target.value)} placeholder="Paste Chess.com or Lichess game URL" />
      )}

      {!canUseFullGameAnalysis ? <p className={styles.status}>Subscription required for full-game analysis.</p> : null}
      {gameAnalysisError ? <p className={styles.error}>{gameAnalysisError}</p> : null}

      {gameAnalysisResult ? (
        <div className={styles.report}>
          <div className={styles.grid}>
            <article className={styles.card}>
              <p className={styles.cardLabel}>Coach summary</p>
              <p>{gameAnalysisResult.coach.overall}</p>
            </article>
            <article className={styles.card}>
              <p className={styles.cardLabel}>Opening</p>
              <p>{gameAnalysisResult.coach.opening}</p>
            </article>
            <article className={styles.card}>
              <p className={styles.cardLabel}>Middlegame</p>
              <p>{gameAnalysisResult.coach.middlegame}</p>
            </article>
            <article className={styles.card}>
              <p className={styles.cardLabel}>Endgame</p>
              <p>{gameAnalysisResult.coach.endgame}</p>
            </article>
          </div>
          <details className={styles.details} open>
            <summary>Key moments</summary>
            <ul className={styles.list}>
              {gameAnalysisResult.coach.keyMoments.map((m) => (
                <li key={`${m.ply}-${m.bestMove}`}>
                  <strong>Move {Math.ceil(m.ply / 2)}</strong>: {m.headline}. Best <code>{m.bestMove}</code>, practical <code>{m.practicalMove}</code>. {m.explanation}
                </li>
              ))}
            </ul>
          </details>
        </div>
      ) : null}

      {recentAnalyses.length ? (
        <details className={styles.details}>
          <summary>Recent analyses</summary>
          <ul className={styles.list}>
            {recentAnalyses.map((entry, idx) => (
              <li key={`${entry.createdAt}-${idx}`}>
                {entry.opening} ({entry.source}) - {new Date(entry.createdAt).toLocaleString()}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}
