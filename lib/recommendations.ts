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

export function getRepertoire(profile: QuizProfile, insights?: ChessInsights): RepertoireResult {
  return {
    white: rankOpenings(openingCatalog.white, profile, insights)[0],
    blackE4: rankOpenings(openingCatalog.blackE4, profile, insights)[0],
    blackD4: rankOpenings(openingCatalog.blackD4, profile, insights)[0],
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

function rankOpenings(openings: Opening[], profile: QuizProfile, insights?: ChessInsights): RankedOpening[] {
  return openings
    .map((opening) => ({
      ...opening,
      score: calculateScore(opening, profile, insights),
      confidence: calculateConfidence(profile, insights),
      evidence: buildEvidence(opening, profile, insights),
    }))
    .sort((left, right) => right.score - left.score);
}

function calculateScore(opening: Opening, profile: QuizProfile, insights?: ChessInsights): number {
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
  score += getPerformanceBoost(opening.key, insights);

  return score;
}

function calculateConfidence(profile: QuizProfile, insights?: ChessInsights): number {
  const baseScore = profile.username ? 64 : 56;
  if (!insights) return baseScore;
  return Math.min(94, baseScore + Math.min(24, Math.floor(insights.gamesAnalyzed / 6)));
}

function buildEvidence(opening: Opening, profile: QuizProfile, insights?: ChessInsights): string[] {
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

  const performanceEvidence = getPerformanceEvidence(opening.key, insights);
  if (performanceEvidence) {
    evidence.push(performanceEvidence);
  }

  if (evidence.length === 0) {
    evidence.push("This is the best overall fit from your current Knightora profile.");
  }

  return evidence.slice(0, 3);
}

function getPerformanceBoost(openingKey: string, insights?: ChessInsights): number {
  if (!insights) return 0;

  const matchingStats = [
    ...insights.whiteBestScoring,
    ...insights.blackVsE4BestScoring,
    ...insights.blackVsD4BestScoring,
  ].filter((stat) => matchesOpeningKey(openingKey, stat.opening));

  if (matchingStats.length === 0) return 0;

  const bestStat = matchingStats.sort((left, right) => right.weightedScore - left.weightedScore)[0];
  return Math.round(bestStat.weightedScore * 4);
}

function getPerformanceEvidence(openingKey: string, insights?: ChessInsights): string | null {
  if (!insights) return null;

  const reasons = Object.values(insights.recommendationReasons);
  const matchingReason = reasons.find((reason) => reason && matchesOpeningKey(openingKey, reason));
  return matchingReason ?? null;
}

function matchesOpeningKey(openingKey: string, text: string): boolean {
  const normalized = text.toLowerCase();
  const aliases: Record<string, string[]> = {
    italian: ["italian", "giuoco"],
    london: ["london"],
    qg: ["queen's gambit", "queens gambit", "catalan"],
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
