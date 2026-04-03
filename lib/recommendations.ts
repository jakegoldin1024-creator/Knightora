import { openingCatalog, type Opening } from "@/data/openings";
import type { ChessInsights } from "@/lib/chesscom";

export type RatingBand = "beginner" | "developing" | "improving" | "advanced";
export type PositionType = "open" | "mixed" | "closed";
export type TheoryLevel = "low" | "medium" | "high";
export type RiskLevel = "sharp" | "balanced" | "solid";
export type TimeControl = "bullet" | "rapid" | "classical";
export type Goal = "initiative" | "clarity" | "counterplay";

export type QuizProfile = {
  rating: RatingBand;
  positionType: PositionType;
  theory: TheoryLevel;
  risk: RiskLevel;
  timeControl: TimeControl;
  goal: Goal;
  username?: string;
};

export type RankedOpening = Opening & {
  score: number;
  confidence: number;
  evidence: string[];
};

export type RepertoireResult = {
  white: RankedOpening;
  blackE4: RankedOpening;
  blackD4: RankedOpening;
};

type RepertoireLane = "white" | "blackE4" | "blackD4";

export function getRepertoire(profile: QuizProfile, insights?: ChessInsights): RepertoireResult {
  const whiteRanked = rankOpenings(openingCatalog.white, profile, "white", insights);
  const blackE4Ranked = rankOpenings(openingCatalog.blackE4, profile, "blackE4", insights);
  const blackD4Ranked = rankOpenings(openingCatalog.blackD4, profile, "blackD4", insights);
  return {
    white: whiteRanked[0] ?? whiteRanked.at(-1)!,
    blackE4: blackE4Ranked[0] ?? blackE4Ranked.at(-1)!,
    blackD4: blackD4Ranked[0] ?? blackD4Ranked.at(-1)!,
  };
}

export function describeStyle(profile: QuizProfile): string {
  const descriptors = {
    open: "dynamic",
    mixed: "flexible",
    closed: "strategic",
  } as const;

  const riskDescriptors = {
    sharp: "attack-minded",
    balanced: "balanced",
    solid: "stability-first",
  } as const;

  return `${descriptors[profile.positionType]} and ${riskDescriptors[profile.risk]}`;
}

export function describeGoal(goal: Goal): string {
  if (goal === "initiative") return "early initiative";
  if (goal === "clarity") return "clear, repeatable plans";
  return "counterplay and active chances";
}

function rankOpenings(openings: Opening[], profile: QuizProfile, lane: RepertoireLane, insights?: ChessInsights): RankedOpening[] {
  return openings
    .map((opening) => {
      const score = calculateScore(opening, profile, lane, insights);
      return {
        ...opening,
        score,
        confidence: calculateOpeningConfidence(opening, lane, profile, score, insights),
        evidence: buildEvidence(opening, profile, lane, insights),
      };
    })
    .sort((left, right) => right.score - left.score);
}

function calculateScore(opening: Opening, profile: QuizProfile, lane: RepertoireLane, insights?: ChessInsights): number {
  let score = 0;

  if (opening.tags.includes(profile.positionType)) score += 3;
  if (profile.positionType === "mixed" && opening.tags.includes("balanced")) score += 2;
  if (opening.tags.includes(profile.goal)) score += 3;
  if (opening.tags.includes(profile.theory)) score += 3;
  if (opening.tags.includes(profile.timeControl)) score += 2;
  if (opening.tags.includes(profile.risk)) score += 3;
  if (opening.tags.includes(profile.rating)) score += 2;

  if (profile.theory === "low" && opening.tags.includes("high")) score -= 4;
  if (profile.risk === "solid" && opening.tags.includes("sharp")) score -= 4;
  if (profile.risk === "sharp" && opening.tags.includes("solid")) score -= 1;
  if (profile.timeControl === "bullet" && opening.tags.includes("classical")) score -= 2;

  if (insights?.openingBoosts[opening.key]) score += insights.openingBoosts[opening.key];
  if (insights?.styleHints.positionType && opening.tags.includes(insights.styleHints.positionType)) score += 2;
  if (insights?.styleHints.risk && opening.tags.includes(insights.styleHints.risk)) score += 2;
  if (insights?.styleHints.theory && opening.tags.includes(insights.styleHints.theory)) score += 2;
  if (insights?.styleHints.goal && opening.tags.includes(insights.styleHints.goal)) score += 2;
  score += getPerformanceBoost(opening.key, lane, insights);

  return score;
}

function calculateOpeningConfidence(
  opening: Opening,
  lane: RepertoireLane,
  profile: QuizProfile,
  score: number,
  insights?: ChessInsights,
): number {
  const profileMatchCount = [
    opening.tags.includes(profile.positionType),
    opening.tags.includes(profile.goal),
    opening.tags.includes(profile.theory),
    opening.tags.includes(profile.risk),
    opening.tags.includes(profile.timeControl),
    opening.tags.includes(profile.rating),
  ].filter(Boolean).length;
  const profileFit = Math.round((profileMatchCount / 6) * 18);
  if (!insights) return Math.max(54, 58 + profileFit);

  const laneStats =
    lane === "white"
      ? [...insights.whiteTopOpenings, ...insights.whiteBestScoring]
      : lane === "blackE4"
        ? [...insights.blackVsE4TopDefenses, ...insights.blackVsE4BestScoring]
        : [...insights.blackVsD4TopDefenses, ...insights.blackVsD4BestScoring];
  const matching = laneStats.filter((stat) => matchesOpeningKey(opening.key, stat.opening));
  const strongest = matching.sort((a, b) => b.games - a.games)[0] ?? null;
  const sampleGames = strongest?.games ?? 0;
  const sampleScore = strongest?.weightedScore ?? 0.5;

  // Stabilize confidence by sample size, profile fit, and consistency signal.
  const sampleConfidence = Math.round(Math.min(1, sampleGames / 24) * 26);
  const performanceConfidence = Math.round(Math.max(0, (sampleScore - 0.45) / 0.25) * 12);
  const boostConfidence = Math.min(10, (insights.openingBoosts[opening.key] ?? 0) * 2);
  const scoreSignal = Math.max(0, Math.min(10, Math.round((score - 8) * 0.9)));

  return Math.max(51, Math.min(95, 48 + profileFit + sampleConfidence + performanceConfidence + boostConfidence + scoreSignal));
}

function buildEvidence(opening: Opening, profile: QuizProfile, lane: RepertoireLane, insights?: ChessInsights): string[] {
  const evidence: string[] = [];

  if (opening.tags.includes(profile.goal)) {
    evidence.push(`Matches your stated goal: ${describeGoal(profile.goal)}.`);
  }

  if (opening.tags.includes(profile.theory)) {
    evidence.push(`Fits your theory tolerance: ${profile.theory}.`);
  }

  if (opening.tags.includes(profile.risk)) {
    evidence.push(`Lines up with your risk preference: ${profile.risk}.`);
  }

  if (insights?.openingBoosts[opening.key]) {
    evidence.push("Your recent Chess.com games already show nearby opening patterns.");
  }

  if (insights?.styleHints.positionType && opening.tags.includes(insights.styleHints.positionType)) {
    evidence.push(`Recent games suggest you naturally reach ${insights.styleHints.positionType} positions.`);
  }

  const performanceEvidence = getPerformanceEvidence(opening.key, lane, insights);
  if (performanceEvidence) {
    evidence.push(performanceEvidence);
  }

  if (evidence.length === 0) {
    evidence.push("This is the best overall fit from your current Knightneo profile.");
  }

  return evidence.slice(0, 3);
}

function getPerformanceBoost(openingKey: string, lane: RepertoireLane, insights?: ChessInsights): number {
  if (!insights) return 0;

  const laneStats =
    lane === "white"
      ? insights.whiteBestScoring
      : lane === "blackE4"
        ? insights.blackVsE4BestScoring
        : insights.blackVsD4BestScoring;
  const matchingStats = laneStats.filter((stat) => matchesOpeningKey(openingKey, stat.opening));

  if (matchingStats.length === 0) return 0;

  const bestStat = matchingStats.sort((left, right) => right.weightedScore - left.weightedScore)[0];
  if (!bestStat) return 0;
  return Math.round(bestStat.weightedScore * 4);
}

function getPerformanceEvidence(openingKey: string, lane: RepertoireLane, insights?: ChessInsights): string | null {
  if (!insights) return null;

  const reason = insights.recommendationReasons[lane];
  const matchingReason = reason && matchesOpeningKey(openingKey, reason) ? reason : null;
  return matchingReason ?? null;
}

function matchesOpeningKey(openingKey: string, text: string): boolean {
  const normalized = text.toLowerCase();
  const aliases: Record<string, string[]> = {
    italian: ["italian", "giuoco"],
    london: ["london"],
    qg: ["queen's gambit", "queens gambit"],
    scotch: ["scotch"],
    caro: ["caro-kann", "caro kann"],
    sicilian: ["sicilian"],
    french: ["french"],
    scandinavian: ["scandinavian", "center counter"],
    qgd: ["queen's gambit declined", "queens gambit declined", "orthodox defense"],
    slav: ["slav", "semi-slav", "semi slav"],
    kid: ["king's indian", "kings indian"],
    nimzo: ["nimzo-indian", "nimzo indian"],
  };

  return (aliases[openingKey] ?? [openingKey]).some((alias) => normalized.includes(alias));
}
