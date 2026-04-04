import { trainingCatalog } from "@/data/training";

export type TrainingSuggestion = {
  /** Key in data/training.ts `trainingCatalog`. */
  catalogKey: string;
  headline: string;
  /** Where to train in-app (Quiz is repertoire-aware). */
  href: "/quiz";
  howToFind: string;
};

const CATALOG_ALIASES: Record<string, string[]> = {
  italian: ["italian", "giuoco", "piano", "italian game"],
  london: ["london", "london system"],
  qg: ["queen's gambit", "qgd", "d4 d5", "c4", "queens gambit"],
  scotch: ["scotch", "scotch game"],
  caro: ["caro", "caro-kann", "carokann"],
  sicilian: ["sicilian", "sicilian defense", "c5"],
  french: ["french", "french defense", "e6"],
  scandinavian: ["scandinavian", "nordic", "bxf7"],
  qgd: ["qgd", "tartakower", "orthodox"],
  slav: ["slav", "slav defense"],
  kid: ["king's indian", "kings indian", "king indian"],
  nimzo: ["nimzo", "nimzo-indian", "nimzowitsch"],
};

function catalogKeys(): string[] {
  return Object.keys(trainingCatalog);
}

function scoreCatalogKey(topic: string, key: string): number {
  const t = topic.toLowerCase();
  let score = 0;
  if (t.includes(key)) score += 4;
  const aliases = CATALOG_ALIASES[key];
  if (aliases) {
    for (const a of aliases) {
      if (t.includes(a)) score += 5;
    }
  }
  return score;
}

/**
 * Map a free-text weakness or opening interest to in-app training (Quiz catalog tracks).
 */
export function suggestTrainingFromTopic(topic: string): {
  suggestions: TrainingSuggestion[];
  /** Extra routing when the topic is not a named opening in the catalog. */
  generalTips: string[];
} {
  const t = topic.trim();
  const lower = t.toLowerCase();
  const keys = catalogKeys();
  const ranked = keys
    .map((key) => ({ key, score: scoreCatalogKey(lower, key) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  const suggestions: TrainingSuggestion[] = ranked.map(({ key }) => {
    const track = trainingCatalog[key as keyof typeof trainingCatalog];
    return {
      catalogKey: key,
      headline: track.headline,
      href: "/quiz",
      howToFind:
        "Open Quiz → Training, pick the repertoire side that matches your color (White / Black vs 1.e4 / Black vs 1.d4), then choose the opening line that contains this repertoire. Lessons include an “Endgame micro-drills” chapter when you need conversion practice.",
    };
  });

  const generalTips: string[] = [];
  if (/(endgame|rook endgame|pawn endgame|king and pawn|technique)/i.test(lower)) {
    generalTips.push(
      "For endgame study inside Knightneo: use Quiz → Training on your repertoire track and work through the “Endgame micro-drills” chapter when it appears in your course path.",
    );
    generalTips.push("Pair that with Analysis on your own games to see where advantages slip in the last phase.");
  }
  if (/(tactic|calculation|blunder|hanging)/i.test(lower)) {
    generalTips.push(
      "Tactical habits: use the Quiz lines you already play so patterns feel familiar, then review the same structures in Analysis to catch recurring slip-ups.",
    );
  }
  if (/(opening|repertoire|theory)/i.test(lower) && suggestions.length === 0) {
    generalTips.push(
      "Pick one repertoire in Quiz and stay with it for a few sessions—Knightneo is built around repeatable move-order work rather than one-off memorization.",
    );
  }

  return { suggestions, generalTips };
}
