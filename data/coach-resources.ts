/**
 * Curated external study links (v1: static map). Knightneo-owned; no live web scraping.
 * YouTube IDs point to well-known educational creators; swap IDs if you prefer different episodes.
 */
export type CoachVideoPick = {
  youtubeId: string;
  title: string;
  /** Why this fits the learner (shown to the model and optionally echoed in UI). */
  why: string;
  /** Loose tags for matching user intent. */
  tags: string[];
};

export const COACH_VIDEO_CURATION: CoachVideoPick[] = [
  {
    youtubeId: "Ao9iOeK_jvU",
    title: "Chess Fundamentals #1: Undefended Pieces",
    why: "Builds pattern recognition for hanging pieces—common at every level before tactics get sharp.",
    tags: ["tactics", "blunders", "fundamentals", "beginner", "basics"],
  },
  {
    youtubeId: "I5o2d9slUCM",
    title: "Chess Fundamentals #3: Typical Mistakes",
    why: "Names recurring decision errors so you can spot them in your own games.",
    tags: ["mistakes", "fundamentals", "habits", "improving"],
  },
  {
    youtubeId: "h-JGqEiNs-I",
    title: "Chess Fundamentals #4: Pawn Play",
    why: "Helps when plans feel fuzzy—pawn breaks and structure often decide middlegame direction.",
    tags: ["middlegame", "pawn", "structure", "plans"],
  },
  {
    youtubeId: "8kdjSqNcViw",
    title: "Chess Fundamentals #5: Trades",
    why: "Clarifies when to exchange and when to keep tension—useful for endgame transitions.",
    tags: ["trades", "endgame", "middlegame", "technique"],
  },
  {
    youtubeId: "TWJ6751RRis",
    title: "Chess Fundamentals #2: Coordination",
    why: "Improves how pieces work together—often the gap between “seeing” a tactic and playing it.",
    tags: ["coordination", "pieces", "development", "tactics"],
  },
];

export function matchCuratedVideos(topic: string, limit = 3): CoachVideoPick[] {
  const q = topic.toLowerCase().trim();
  if (!q) {
    return COACH_VIDEO_CURATION.slice(0, limit);
  }

  const words = q.split(/\s+/).filter((w) => w.length > 2);
  const scored = COACH_VIDEO_CURATION.map((v) => {
    let score = 0;
    for (const tag of v.tags) {
      if (q.includes(tag)) score += 3;
      for (const w of words) {
        if (tag.includes(w) || w.includes(tag)) score += 2;
      }
    }
    if (v.title.toLowerCase().includes(q)) score += 2;
    if (v.why.toLowerCase().includes(q)) score += 1;
    return { v, score };
  });

  scored.sort((a, b) => b.score - a.score || a.v.title.localeCompare(b.v.title));
  const best = scored.filter((s) => s.score > 0);
  const picks = (best.length ? best : scored).slice(0, limit).map((s) => s.v);
  return picks;
}
