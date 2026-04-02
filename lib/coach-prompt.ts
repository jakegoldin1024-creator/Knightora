import type { AnalysisLevel, AnalyzedMove, GameAnalysisReport } from "@/lib/game-analysis";

export type CoachSummary = {
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

export async function buildCoachSummary(report: GameAnalysisReport): Promise<CoachSummary> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return buildFallbackCoachSummary(report);
  }

  try {
    const payload = await requestCoachSummaryFromLlm(report, apiKey);
    if (payload) return payload;
    return buildFallbackCoachSummary(report);
  } catch {
    return buildFallbackCoachSummary(report);
  }
}

async function requestCoachSummaryFromLlm(report: GameAnalysisReport, apiKey: string): Promise<CoachSummary | null> {
  const keyMoves = report.moves
    .filter((m) => m.severity !== "good")
    .sort((a, b) => b.evalLossCp - a.evalLossCp)
    .slice(0, 8)
    .map((m) => ({
      ply: m.ply,
      side: m.side,
      san: m.san,
      bestUci: m.bestUci,
      practicalUci: m.practicalUci,
      loss: m.evalLossCp,
      phase: m.phase,
      type: m.mistakeType,
      practicalReason: m.practicalReason,
    }));

  const phaseStats = {
    opening: summarizePhase(report.moves, "opening"),
    middlegame: summarizePhase(report.moves, "middlegame"),
    endgame: summarizePhase(report.moves, "endgame"),
  };

  const prompt = JSON.stringify(
    {
      task: "Create practical, encouraging full-game chess coaching.",
      level: report.level,
      opening: report.summary.opening,
      cpl: {
        white: report.summary.whiteCentipawnLoss,
        black: report.summary.blackCentipawnLoss,
      },
      phaseStats,
      recommendations: report.recommendations,
      keyMoves,
      instructions: [
        "Keep feedback specific, kind, and action-oriented.",
        "Explain why the practical move can be easier than the engine-best move.",
        "Use language suited to the player's level.",
        "Return strictly valid JSON only.",
      ],
      outputShape: {
        overall: "2-3 sentences summary",
        opening: "2-3 sentences with one concrete study focus",
        middlegame: "2-3 sentences with one concrete study focus",
        endgame: "2-3 sentences with one concrete study focus",
        keyMoments: [
          {
            ply: "number",
            headline: "short title",
            bestMove: "uci string",
            practicalMove: "uci string",
            explanation: "1-2 sentence coaching explanation",
          },
        ],
      },
    },
    null,
    2,
  );

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_COACH_MODEL ?? "gpt-4.1-mini",
      temperature: 0.35,
      messages: [
        {
          role: "system",
          content:
            "You are a practical chess coach. Return only strict JSON. Prefer concrete advice tied to mistakes and practical alternatives.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    }),
    cache: "no-store",
  });

  if (!response.ok) return null;
  const json = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = json.choices?.[0]?.message?.content;
  if (!content) return null;

  const parsed = JSON.parse(content) as Partial<CoachSummary>;
  if (!parsed.overall || !parsed.opening || !parsed.middlegame || !parsed.endgame || !Array.isArray(parsed.keyMoments)) {
    return null;
  }
  return {
    overall: parsed.overall,
    opening: parsed.opening,
    middlegame: parsed.middlegame,
    endgame: parsed.endgame,
    keyMoments: parsed.keyMoments.slice(0, 6).map((k) => ({
      ply: Number(k.ply) || 1,
      headline: String(k.headline ?? "Critical moment"),
      bestMove: String(k.bestMove ?? "N/A"),
      practicalMove: String(k.practicalMove ?? "N/A"),
      explanation: String(k.explanation ?? "Play practical chess and keep improving piece activity."),
    })),
  };
}

function buildFallbackCoachSummary(report: GameAnalysisReport): CoachSummary {
  const levelTone = levelDescriptor(report.level);
  const openingLosses = report.moves.filter((m) => m.phase === "opening").map((m) => m.evalLossCp);
  const middleLosses = report.moves.filter((m) => m.phase === "middlegame").map((m) => m.evalLossCp);
  const endLosses = report.moves.filter((m) => m.phase === "endgame").map((m) => m.evalLossCp);

  const keyMoves = report.moves
    .filter((m) => m.severity !== "good")
    .sort((a, b) => b.evalLossCp - a.evalLossCp)
    .slice(0, 6);

  return {
    overall: `Great effort. At your ${levelTone} level, this game shows useful growth areas. Your key wins will come from reducing high-cost decisions and choosing practical moves that keep your position stable.`,
    opening: `Opening review (${report.summary.opening}): your biggest gains come from cleaner development and simpler plans in the first 10 moves. Average opening loss was ${average(openingLosses)} cp.`,
    middlegame: `Middlegame review: focus on \"checks, captures, threats\" before committing. Average middlegame loss was ${average(middleLosses)} cp, which suggests a few tactical/coordination swings.`,
    endgame: `Endgame review: keep king activity and pawn structure discipline in mind. Average endgame loss was ${average(endLosses)} cp; practical consolidation usually beats sharp lines here.`,
    keyMoments: keyMoves.map((m) => ({
      ply: m.ply,
      headline: `${capitalize(m.severity)} on move ${m.fullMove}${m.side === "black" ? "..." : ""}`,
      bestMove: m.bestUci,
      practicalMove: m.practicalUci,
      explanation: `Best move is strongest objectively, but at this level the practical move is often easier to execute while staying close in evaluation.`,
    })),
  };
}

function average(values: number[]): number {
  if (!values.length) return 0;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

function levelDescriptor(level: AnalysisLevel): string {
  if (level === "beginner") return "beginner";
  if (level === "developing") return "developing";
  if (level === "improving") return "improving";
  return "advanced";
}

function capitalize(text: string): string {
  return text ? text[0].toUpperCase() + text.slice(1) : text;
}

function summarizePhase(moves: AnalyzedMove[], phase: AnalyzedMove["phase"]) {
  const selected = moves.filter((m) => m.phase === phase);
  const averageLoss = selected.length
    ? Math.round(selected.reduce((sum, m) => sum + m.evalLossCp, 0) / selected.length)
    : 0;
  const mistakes = selected.filter((m) => m.severity === "mistake" || m.severity === "blunder").length;
  return {
    moves: selected.length,
    averageLossCp: averageLoss,
    mistakes,
  };
}

