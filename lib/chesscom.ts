import { getRepertoire, type Goal, type PositionType, type QuizProfile, type RepertoireResult, type RiskLevel, type TheoryLevel, type TimeControl } from "@/lib/recommendations";

type ChessPlayer = {
  username?: string;
  result?: string;
  rating?: number;
};

type ChessGame = {
  pgn?: string;
  eco?: string;
  time_class?: string;
  white?: ChessPlayer;
  black?: ChessPlayer;
};

type ChessArchiveResponse = {
  games?: ChessGame[];
};

type ChessArchivesIndex = {
  archives?: string[];
};

type OpeningStat = {
  opening: string;
  games: number;
  wins: number;
  draws: number;
  losses: number;
  scoreRate: number;
  weightedScore: number;
  averageOpponentRating: number | null;
};

type OpeningAccumulator = {
  opening: string;
  games: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  opponentRatingTotal: number;
  opponentRatingGames: number;
};

export type ChessInsights = {
  username: string;
  gamesAnalyzed: number;
  archivesChecked: number;
  detectedTimeControl?: TimeControl;
  styleHints: Partial<{
    positionType: PositionType;
    risk: RiskLevel;
    theory: TheoryLevel;
    goal: Goal;
  }>;
  openingBoosts: Record<string, number>;
  whiteTopOpenings: OpeningStat[];
  blackVsE4TopDefenses: OpeningStat[];
  blackVsD4TopDefenses: OpeningStat[];
  whiteBestScoring: OpeningStat[];
  blackVsE4BestScoring: OpeningStat[];
  blackVsD4BestScoring: OpeningStat[];
  recommendationReasons: Partial<Record<"white" | "blackE4" | "blackD4", string>>;
  summary: string[];
};

export type ChessProfileResponse = {
  insights: ChessInsights;
  repertoire: RepertoireResult;
};

const CHESS_HEADERS = {
  "User-Agent": "Knightora/0.1 (opening-recommendation prototype)",
};

const DRAW_RESULTS = new Set([
  "agreed",
  "stalemate",
  "repetition",
  "insufficient",
  "50move",
  "timevsinsufficient",
]);

const openingKeyMatchers: Record<string, RegExp[]> = {
  italian: [/italian/i, /giuoco/i],
  london: [/london/i],
  qg: [/queen'?s gambit/i, /catalan/i],
  scotch: [/scotch/i],
  caro: [/caro-kann/i],
  sicilian: [/sicilian/i],
  french: [/french/i],
  scandinavian: [/scandinavian/i, /center counter/i],
  qgd: [/queen'?s gambit declined/i, /orthodox defense/i],
  slav: [/slav/i, /semi-slav/i],
  kid: [/king'?s indian/i],
  nimzo: [/nimzo-indian/i],
};

export async function buildChessProfile(username: string, quizProfile: QuizProfile): Promise<ChessProfileResponse> {
  const insights = await fetchChessInsights(username);
  const repertoire = getRepertoire(
    {
      ...quizProfile,
      timeControl: insights.detectedTimeControl ?? quizProfile.timeControl,
    },
    insights,
  );

  return { insights, repertoire };
}

export async function fetchChessInsights(username: string): Promise<ChessInsights> {
  const normalizedUsername = username.trim().toLowerCase();
  if (!normalizedUsername) {
    throw new Error("A Chess.com username is required.");
  }

  const archivesResponse = await fetch(`https://api.chess.com/pub/player/${normalizedUsername}/games/archives`, {
    headers: CHESS_HEADERS,
    cache: "no-store",
  });

  if (archivesResponse.status === 404) {
    throw new Error("We could not find that Chess.com username.");
  }

  if (!archivesResponse.ok) {
    throw new Error("Chess.com is unavailable right now. Please try again in a moment.");
  }

  const archivesData = (await archivesResponse.json()) as ChessArchivesIndex;
  const archives = (archivesData.archives ?? []).slice(-3).reverse();

  if (archives.length === 0) {
    throw new Error("No public game archives were found for that Chess.com username.");
  }

  const archiveResponses = await Promise.all(
    archives.map(async (archiveUrl) => {
      const archiveResponse = await fetch(archiveUrl, {
        headers: CHESS_HEADERS,
        cache: "no-store",
      });

      if (!archiveResponse.ok) {
        return { games: [] } satisfies ChessArchiveResponse;
      }

      return (await archiveResponse.json()) as ChessArchiveResponse;
    }),
  );

  const games = archiveResponses.flatMap((archive) => archive.games ?? []).slice(-120);
  if (games.length === 0) {
    throw new Error("We found the player, but there were no recent public games to analyze.");
  }

  return analyzeGames(normalizedUsername, games, archives.length);
}

function analyzeGames(username: string, games: ChessGame[], archivesChecked: number): ChessInsights {
  const whiteOpenings = new Map<string, OpeningAccumulator>();
  const blackVsE4 = new Map<string, OpeningAccumulator>();
  const blackVsD4 = new Map<string, OpeningAccumulator>();
  const timeClasses = new Map<string, number>();
  const openingBoosts: Record<string, number> = {};

  let sharpSignals = 0;
  let solidSignals = 0;
  let openSignals = 0;
  let closedSignals = 0;
  let theorySignals = 0;
  let initiativeSignals = 0;
  let counterplaySignals = 0;

  for (const game of games) {
    const color = getPlayerColor(game, username);
    if (!color) continue;

    const openingName = extractOpeningName(game) ?? "Unclassified opening";
    const result = normalizeResult(color === "white" ? game.white?.result : game.black?.result);
    const timeClass = normalizeTimeControl(game.time_class);

    if (timeClass) {
      timeClasses.set(timeClass, (timeClasses.get(timeClass) ?? 0) + 1);
    }

    applyStyleSignals(openingName, {
      onSharp: () => {
        sharpSignals += 1;
        counterplaySignals += 1;
      },
      onSolid: () => {
        solidSignals += 1;
      },
      onOpen: () => {
        openSignals += 1;
        initiativeSignals += 1;
      },
      onClosed: () => {
        closedSignals += 1;
      },
      onTheory: () => {
        theorySignals += 1;
      },
    });

    boostFromOpening(openingName, openingBoosts);

    if (color === "white") {
      updateOpeningStat(whiteOpenings, openingName, result, getOpponentRating(game, color));
      continue;
    }

    const defenseBucket = classifyBlackDefense(openingName, game);
    if (defenseBucket === "e4") {
      updateOpeningStat(blackVsE4, openingName, result, getOpponentRating(game, color));
    } else if (defenseBucket === "d4") {
      updateOpeningStat(blackVsD4, openingName, result, getOpponentRating(game, color));
    }
  }

  const detectedTimeControl = pickMostFrequentTimeControl(timeClasses);
  const styleHints: ChessInsights["styleHints"] = {};

  if (openSignals > closedSignals + 1) styleHints.positionType = "open";
  if (closedSignals > openSignals + 1) styleHints.positionType = "closed";
  if (sharpSignals > solidSignals + 1) styleHints.risk = "sharp";
  if (solidSignals > sharpSignals + 1) styleHints.risk = "solid";
  if (theorySignals >= Math.max(4, Math.floor(games.length * 0.18))) styleHints.theory = "high";
  if (theorySignals <= Math.max(2, Math.floor(games.length * 0.06))) styleHints.theory = "low";
  if (initiativeSignals > counterplaySignals + 1) styleHints.goal = "initiative";
  if (counterplaySignals > initiativeSignals + 1) styleHints.goal = "counterplay";

  const whiteTopOpenings = sortOpeningStats(whiteOpenings, "usage");
  const blackVsE4TopDefenses = sortOpeningStats(blackVsE4, "usage");
  const blackVsD4TopDefenses = sortOpeningStats(blackVsD4, "usage");
  const whiteBestScoring = sortOpeningStats(whiteOpenings, "score");
  const blackVsE4BestScoring = sortOpeningStats(blackVsE4, "score");
  const blackVsD4BestScoring = sortOpeningStats(blackVsD4, "score");

  const recommendationReasons = {
    white: buildRecommendationReason(whiteTopOpenings, whiteBestScoring),
    blackE4: buildRecommendationReason(blackVsE4TopDefenses, blackVsE4BestScoring),
    blackD4: buildRecommendationReason(blackVsD4TopDefenses, blackVsD4BestScoring),
  };

  const summary = [
    `Analyzed ${games.length} recent public games across ${archivesChecked} Chess.com archive months.`,
    buildOpeningSummary("White", whiteTopOpenings, whiteBestScoring),
    buildOpeningSummary("Black vs 1.e4", blackVsE4TopDefenses, blackVsE4BestScoring),
    buildOpeningSummary("Black vs 1.d4", blackVsD4TopDefenses, blackVsD4BestScoring),
  ].filter(Boolean) as string[];

  return {
    username,
    gamesAnalyzed: games.length,
    archivesChecked,
    detectedTimeControl,
    styleHints,
    openingBoosts,
    whiteTopOpenings,
    blackVsE4TopDefenses,
    blackVsD4TopDefenses,
    whiteBestScoring,
    blackVsE4BestScoring,
    blackVsD4BestScoring,
    recommendationReasons,
    summary,
  };
}

function getPlayerColor(game: ChessGame, username: string): "white" | "black" | null {
  const whiteUsername = game.white?.username?.toLowerCase();
  const blackUsername = game.black?.username?.toLowerCase();

  if (whiteUsername === username) return "white";
  if (blackUsername === username) return "black";
  return null;
}

function normalizeResult(result: string | undefined): "win" | "draw" | "loss" {
  if (result === "win") return "win";
  if (DRAW_RESULTS.has(result ?? "")) return "draw";
  return "loss";
}

function normalizeTimeControl(timeClass: string | undefined): TimeControl | undefined {
  if (timeClass === "bullet" || timeClass === "blitz") return "bullet";
  if (timeClass === "rapid") return "rapid";
  if (timeClass === "daily") return "classical";
  return undefined;
}

function extractOpeningName(game: ChessGame): string | null {
  const ecoValue = game.eco?.trim();
  if (ecoValue) {
    if (ecoValue.startsWith("http")) {
      const slug = ecoValue.split("/").pop();
      if (slug) {
        return decodeURIComponent(slug).replace(/-/g, " ");
      }
    }

    if (!/^https?:/i.test(ecoValue)) {
      return ecoValue;
    }
  }

  const pgn = game.pgn ?? "";
  const openingHeader = pgn.match(/\[Opening\s+"([^"]+)"\]/i)?.[1];
  if (openingHeader) return openingHeader;

  const ecoUrlHeader = pgn.match(/\[ECOUrl\s+"([^"]+)"\]/i)?.[1];
  if (ecoUrlHeader) {
    const slug = ecoUrlHeader.split("/").pop();
    if (slug) {
      return decodeURIComponent(slug).replace(/-/g, " ");
    }
  }

  return null;
}

function updateOpeningStat(
  store: Map<string, OpeningAccumulator>,
  opening: string,
  result: "win" | "draw" | "loss",
  opponentRating: number | null,
) {
  const current = store.get(opening) ?? {
    opening,
    games: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    points: 0,
    opponentRatingTotal: 0,
    opponentRatingGames: 0,
  };

  current.games += 1;
  if (result === "win") {
    current.wins += 1;
    current.points += 1;
  }
  if (result === "draw") {
    current.draws += 1;
    current.points += 0.5;
  }
  if (result === "loss") current.losses += 1;
  if (typeof opponentRating === "number") {
    current.opponentRatingTotal += opponentRating;
    current.opponentRatingGames += 1;
  }

  store.set(opening, current);
}

function sortOpeningStats(store: Map<string, OpeningAccumulator>, mode: "usage" | "score"): OpeningStat[] {
  return [...store.values()]
    .map(toOpeningStat)
    .sort((left, right) => {
      if (mode === "usage") {
        const usageGap = right.games - left.games;
        if (usageGap !== 0) return usageGap;
        return right.weightedScore - left.weightedScore;
      }

      const scoreGap = right.weightedScore - left.weightedScore;
      if (scoreGap !== 0) return scoreGap;
      return right.games - left.games;
    })
    .slice(0, 3);
}

function toOpeningStat(accumulator: OpeningAccumulator): OpeningStat {
  const scoreRate = accumulator.games === 0 ? 0 : accumulator.points / accumulator.games;
  const sampleBonus = Math.min(0.18, Math.log2(accumulator.games + 1) * 0.045);

  return {
    opening: accumulator.opening,
    games: accumulator.games,
    wins: accumulator.wins,
    draws: accumulator.draws,
    losses: accumulator.losses,
    scoreRate,
    weightedScore: scoreRate + sampleBonus,
    averageOpponentRating:
      accumulator.opponentRatingGames > 0
        ? Math.round(accumulator.opponentRatingTotal / accumulator.opponentRatingGames)
        : null,
  };
}

function pickMostFrequentTimeControl(timeClasses: Map<string, number>): TimeControl | undefined {
  const ordered = [...timeClasses.entries()].sort((left, right) => right[1] - left[1]);
  return ordered[0]?.[0] as TimeControl | undefined;
}

function classifyBlackDefense(openingName: string, game: ChessGame): "e4" | "d4" | null {
  const normalized = openingName.toLowerCase();

  if (
    /(sicilian|caro-kann|french|scandinavian|petroff|pirc|philidor|alekhine|vienna|bishop'?s opening|ruy lopez|italian|scotch|four knights|king'?s gambit)/i.test(
      normalized,
    )
  ) {
    return "e4";
  }

  if (
    /(queen'?s gambit|slav|king'?s indian|nimzo-indian|grunfeld|benoni|benko|catalan|london|colle|reti|english|bird|dutch|trompowsky)/i.test(
      normalized,
    )
  ) {
    return "d4";
  }

  const firstMove = extractFirstWhiteMove(game.pgn);
  if (firstMove === "e4") return "e4";
  if (firstMove === "d4") return "d4";

  return null;
}

function extractFirstWhiteMove(pgn: string | undefined): "e4" | "d4" | null {
  if (!pgn) return null;

  const moveSection = pgn
    .replace(/\[[^\]]*\]\s*/g, " ")
    .replace(/\{[^}]*\}/g, " ")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\d+\.(\.\.)?/g, " ")
    .replace(/1-0|0-1|1\/2-1\/2|\*/g, " ")
    .trim();

  const firstMove = moveSection.split(/\s+/)[0]?.replace(/[+#?!]/g, "");
  if (firstMove === "e4") return "e4";
  if (firstMove === "d4") return "d4";
  return null;
}

function getOpponentRating(game: ChessGame, color: "white" | "black"): number | null {
  const rating = color === "white" ? game.black?.rating : game.white?.rating;
  return typeof rating === "number" ? rating : null;
}

function boostFromOpening(openingName: string, boosts: Record<string, number>) {
  for (const [openingKey, patterns] of Object.entries(openingKeyMatchers)) {
    if (patterns.some((pattern) => pattern.test(openingName))) {
      boosts[openingKey] = (boosts[openingKey] ?? 0) + 2;
    }
  }
}

function applyStyleSignals(
  openingName: string,
  handlers: {
    onSharp: () => void;
    onSolid: () => void;
    onOpen: () => void;
    onClosed: () => void;
    onTheory: () => void;
  },
) {
  if (/(sicilian|king'?s indian|scotch|benoni|gambit|dragon|najdorf|grunfeld)/i.test(openingName)) {
    handlers.onSharp();
    handlers.onTheory();
  }

  if (/(caro-kann|london|queen'?s gambit declined|slav|french|scandinavian|nimzo-indian)/i.test(openingName)) {
    handlers.onSolid();
  }

  if (/(italian|scotch|sicilian|scandinavian|ruy lopez|king'?s gambit|vienna)/i.test(openingName)) {
    handlers.onOpen();
  }

  if (/(queen'?s gambit|london|slav|french|king'?s indian|nimzo-indian|catalan|colle)/i.test(openingName)) {
    handlers.onClosed();
  }
}

function buildOpeningSummary(label: string, usage: OpeningStat[], scoring: OpeningStat[]): string | null {
  const topUsage = usage[0];
  const topScoring = scoring[0];
  if (!topUsage && !topScoring) return null;

  if (topUsage && topScoring && topUsage.opening !== topScoring.opening) {
    return `${label}: most used is ${topUsage.opening} (${topUsage.games} games), but best scoring is ${topScoring.opening} (${formatScoreRate(topScoring.scoreRate)} score rate).`;
  }

  const leader = topScoring ?? topUsage;
  if (!leader) return null;
  return `${label}: strongest recent signal is ${leader.opening} (${leader.games} games, ${formatScoreRate(leader.scoreRate)} score rate).`;
}

function buildRecommendationReason(usage: OpeningStat[], scoring: OpeningStat[]): string | undefined {
  const topUsage = usage[0];
  const topScoring = scoring[0];

  if (!topUsage && !topScoring) return undefined;
  if (topUsage && topScoring && topUsage.opening !== topScoring.opening) {
    return `You play ${topUsage.opening} most, but your best recent results come from ${topScoring.opening}.`;
  }

  const opening = topScoring ?? topUsage;
  if (!opening) return undefined;
  return `${opening.opening} is both familiar and productive in your recent games.`;
}

function formatScoreRate(scoreRate: number): string {
  return `${Math.round(scoreRate * 100)}%`;
}
