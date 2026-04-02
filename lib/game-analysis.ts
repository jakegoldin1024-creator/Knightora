import { Chess, type Move } from "chess.js";

export type AnalysisLevel = "beginner" | "developing" | "improving" | "advanced";
export type MistakeType = "opening_plan" | "tactical_oversight" | "positional_inaccuracy" | "endgame_technique";
export type GamePhase = "opening" | "middlegame" | "endgame";

export type AnalyzedMove = {
  ply: number;
  fullMove: number;
  side: "white" | "black";
  san: string;
  playedUci: string;
  bestUci: string;
  practicalUci: string;
  bestEvalCp: number;
  playedEvalCp: number;
  evalLossCp: number;
  phase: GamePhase;
  mistakeType: MistakeType | null;
  severity: "good" | "inaccuracy" | "mistake" | "blunder";
  practicalReason: string;
};

export type GameAnalysisReport = {
  source: "pgn" | "chesscom" | "lichess";
  pgn: string;
  level: AnalysisLevel;
  summary: {
    opening: string;
    whiteCentipawnLoss: number;
    blackCentipawnLoss: number;
    keyMoments: number[];
  };
  moves: AnalyzedMove[];
  recommendations: string[];
};

const ANALYSIS_DEPTH = resolveAnalysisDepth();

export function analyzeGamePgn(input: { pgn: string; source: "pgn" | "chesscom" | "lichess"; level: AnalysisLevel }): GameAnalysisReport {
  const replay = new Chess();
  try {
    replay.loadPgn(input.pgn, { strict: false });
  } catch {
    throw new Error("PGN could not be parsed.");
  }

  const history = replay.history({ verbose: true }) as Move[];
  const board = new Chess();
  const analyzed: AnalyzedMove[] = [];

  let whiteLoss = 0;
  let blackLoss = 0;

  for (let i = 0; i < history.length; i++) {
    const played = history[i];
    const side = board.turn() === "w" ? "white" : "black";
    const phase = getPhase(board, i + 1);

    const candidates = scoreLegalMoves(board, ANALYSIS_DEPTH);
    const best = candidates[0];
    const practical = choosePracticalMove(candidates, input.level, side);
    const playedUci = toUci(played);
    const playedScore = candidates.find((c) => c.uci === playedUci)?.scoreCp ?? simulateMoveScore(board, playedUci, ANALYSIS_DEPTH);
    const bestScore = best?.scoreCp ?? playedScore;
    const evalLossCp = side === "white" ? Math.max(0, bestScore - playedScore) : Math.max(0, playedScore - bestScore);
    const severity = classifySeverity(evalLossCp);

    if (side === "white") whiteLoss += evalLossCp;
    else blackLoss += evalLossCp;

    analyzed.push({
      ply: i + 1,
      fullMove: Math.floor(i / 2) + 1,
      side,
      san: played.san,
      playedUci,
      bestUci: best?.uci ?? playedUci,
      practicalUci: practical.uci,
      bestEvalCp: bestScore,
      playedEvalCp: playedScore,
      evalLossCp,
      phase,
      mistakeType: inferMistakeType(played.san, phase, evalLossCp),
      severity,
      practicalReason: practical.reason,
    });

    board.move(played);
  }

  const opening = detectOpeningName(input.pgn);
  const keyMoments = analyzed
    .map((m, idx) => ({ idx, loss: m.evalLossCp }))
    .sort((a, b) => b.loss - a.loss)
    .slice(0, 6)
    .map((x) => x.idx + 1)
    .sort((a, b) => a - b);

  return {
    source: input.source,
    pgn: input.pgn,
    level: input.level,
    summary: {
      opening,
      whiteCentipawnLoss: Math.round(whiteLoss),
      blackCentipawnLoss: Math.round(blackLoss),
      keyMoments,
    },
    moves: analyzed,
    recommendations: buildRecommendations(analyzed),
  };
}

type ScoredMove = { uci: string; scoreCp: number; reason: string };

function scoreLegalMoves(chess: Chess, lookaheadPly: number): ScoredMove[] {
  const legal = chess.moves({ verbose: true }) as Move[];
  const side = chess.turn();

  const scored = legal.map((m) => {
    const clone = new Chess(chess.fen());
    clone.move(m);
    const scoreCp = minimaxStatic(clone, lookaheadPly - 1, side === "w");
    return { uci: toUci(m), scoreCp, reason: moveReason(m) };
  });

  scored.sort((a, b) => (side === "w" ? b.scoreCp - a.scoreCp : a.scoreCp - b.scoreCp));
  return scored;
}

function simulateMoveScore(chess: Chess, uci: string, lookaheadPly: number): number {
  const legal = chess.moves({ verbose: true }) as Move[];
  const matched = legal.find((m) => toUci(m) === uci);
  if (!matched) return evaluatePositionCp(chess);
  const clone = new Chess(chess.fen());
  clone.move(matched);
  return minimaxStatic(clone, lookaheadPly - 1, chess.turn() === "w");
}

function minimaxStatic(chess: Chess, depth: number, maximizingForWhite: boolean): number {
  if (depth <= 0 || chess.isGameOver()) return evaluatePositionCp(chess);
  const legal = chess.moves({ verbose: true }) as Move[];
  if (!legal.length) return evaluatePositionCp(chess);

  const sideToMove = chess.turn();
  const isMaxNode = (sideToMove === "w") === maximizingForWhite;
  let best = isMaxNode ? -Infinity : Infinity;

  for (const m of legal) {
    const clone = new Chess(chess.fen());
    clone.move(m);
    const score = minimaxStatic(clone, depth - 1, maximizingForWhite);
    if (isMaxNode) best = Math.max(best, score);
    else best = Math.min(best, score);
  }
  return Number.isFinite(best) ? best : evaluatePositionCp(chess);
}

function evaluatePositionCp(chess: Chess): number {
  // Positive means White is better.
  const board = chess.board();
  const values: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
  let score = 0;

  for (const row of board) {
    for (const cell of row) {
      if (!cell) continue;
      const v = values[cell.type] ?? 0;
      score += cell.color === "w" ? v : -v;
    }
  }

  // Small mobility term to avoid dead-equal ties.
  const mobility = (chess.moves().length - legalCountForOtherSide(chess)) * 2;
  return score + mobility;
}

function legalCountForOtherSide(chess: Chess): number {
  const fen = chess.fen().split(" ");
  fen[1] = fen[1] === "w" ? "b" : "w";
  // Flipping side-to-move can make the original en-passant square illegal.
  // It is only a mobility heuristic here, so clear ep to keep FEN valid.
  fen[3] = "-";
  const alt = new Chess(fen.join(" "));
  return alt.moves().length;
}

function choosePracticalMove(candidates: ScoredMove[], level: AnalysisLevel, side: "white" | "black"): ScoredMove {
  const best = candidates[0];
  if (!best) return { uci: "0000", scoreCp: 0, reason: "No legal practical alternative found." };

  const threshold = levelThreshold(level);
  const bestScore = best.scoreCp;
  const within = candidates.filter((c) =>
    side === "white" ? bestScore - c.scoreCp <= threshold : c.scoreCp - bestScore <= threshold,
  );
  const pool = within.length ? within : [best];
  const sorted = [...pool].sort((a, b) => practicalScore(a, bestScore, level, side) - practicalScore(b, bestScore, level, side));
  const pick = sorted[0] ?? best;
  return {
    ...pick,
    reason: `${pick.reason} Practical pick: close to best eval with lower execution risk.`,
  };
}

function complexityOfUci(uci: string): number {
  // very rough proxy; promotion/check-heavy SAN not available here.
  if (uci.length > 4) return 5;
  const fromFile = uci.charCodeAt(0);
  const toFile = uci.charCodeAt(2);
  return Math.abs(fromFile - toFile);
}

function practicalScore(move: ScoredMove, bestScore: number, level: AnalysisLevel, side: "white" | "black"): number {
  const evalGap = side === "white" ? bestScore - move.scoreCp : move.scoreCp - bestScore;
  const complexityWeight = practicalComplexityWeight(level);
  return evalGap + complexityWeight * complexityOfUci(move.uci);
}

function levelThreshold(level: AnalysisLevel): number {
  if (level === "beginner") return 140;
  if (level === "developing") return 100;
  if (level === "improving") return 75;
  return 45;
}

function practicalComplexityWeight(level: AnalysisLevel): number {
  if (level === "beginner") return 18;
  if (level === "developing") return 14;
  if (level === "improving") return 10;
  return 7;
}

function classifySeverity(loss: number): "good" | "inaccuracy" | "mistake" | "blunder" {
  if (loss < 45) return "good";
  if (loss < 110) return "inaccuracy";
  if (loss < 220) return "mistake";
  return "blunder";
}

function inferMistakeType(san: string, phase: GamePhase, loss: number): MistakeType | null {
  if (loss < 60) return null;
  if (phase === "opening") return "opening_plan";
  if (phase === "endgame") return "endgame_technique";
  if (/[+#x]/.test(san)) return "tactical_oversight";
  return "positional_inaccuracy";
}

function moveReason(move: Move): string {
  if (move.san.startsWith("O-O")) return "Safer king and rook activation.";
  if (move.san.includes("x")) return "Wins material or removes key defender.";
  if (move.san.includes("+")) return "Forcing line with check pressure.";
  if (/^[NBRQK]/.test(move.san)) return "Improves piece activity and coordination.";
  return "Supports central control and future plans.";
}

function detectOpeningName(pgn: string): string {
  const openingTag = /\[Opening\s+"([^"]+)"\]/i.exec(pgn)?.[1];
  if (openingTag) return openingTag;
  const ecoTag = /\[ECO\s+"([^"]+)"\]/i.exec(pgn)?.[1];
  if (ecoTag) return `ECO ${ecoTag}`;
  return "Unlabeled opening";
}

function toUci(move: Move): string {
  return `${move.from}${move.to}${move.promotion ?? ""}`;
}

function getPhase(chess: Chess, ply: number): GamePhase {
  if (ply <= 20) return "opening";
  const pieces = chess.board().flat().filter(Boolean).length;
  if (pieces <= 10) return "endgame";
  return "middlegame";
}

function buildRecommendations(moves: AnalyzedMove[]): string[] {
  const mistakes = moves.filter((m) => m.severity === "mistake" || m.severity === "blunder");
  const openingErrors = mistakes.filter((m) => m.phase === "opening").length;
  const tacticalErrors = mistakes.filter((m) => m.mistakeType === "tactical_oversight").length;
  const endgameErrors = mistakes.filter((m) => m.phase === "endgame").length;

  const out: string[] = [];
  if (openingErrors >= 2) out.push("Review your first 10-12 moves and focus on one consistent setup.");
  if (tacticalErrors >= 2) out.push("Do a short daily tactics block focused on checks, captures, and threats.");
  if (endgameErrors >= 1) out.push("Practice basic king-and-pawn and rook endgame conversion patterns.");
  if (out.length === 0) out.push("Your game stayed practical; next step is improving conversion after gaining an edge.");
  return out;
}

function resolveAnalysisDepth(): number {
  const raw = Number(process.env.GAME_ANALYSIS_DEPTH ?? "2");
  if (!Number.isFinite(raw)) return 2;
  return Math.min(4, Math.max(2, Math.floor(raw)));
}

