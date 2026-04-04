import { tool } from "ai";
import { z } from "zod";
import { matchCuratedVideos } from "@/data/coach-resources";
import { suggestTrainingFromTopic } from "@/lib/coach-training-suggestions";

export const coachTools = {
  suggest_training: tool({
    description:
      "Find Knightneo Quiz training tracks that match the user's stated weakness, opening interest, or phase (e.g. endgames, Italian, tactics). Returns catalog matches plus general in-app tips.",
    inputSchema: z.object({
      topic: z
        .string()
        .describe("What the user wants to improve or explore (free text: opening name, phase, or habit)."),
    }),
    execute: async ({ topic }) => suggestTrainingFromTopic(topic),
  }),
  suggest_resources: tool({
    description:
      "Return a small curated list of educational YouTube videos (static allowlist) relevant to the user's topic. Use before recommending external viewing.",
    inputSchema: z.object({
      topic: z.string().describe("Topic or weakness to match against curated tags (e.g. endgames, pawn play, tactics)."),
    }),
    execute: async ({ topic }) => ({
      videos: matchCuratedVideos(topic, 4).map((v) => ({
        title: v.title,
        youtubeId: v.youtubeId,
        watchUrl: `https://www.youtube.com/watch?v=${v.youtubeId}`,
        why: v.why,
      })),
    }),
  }),
};

export type CoachToolSet = typeof coachTools;
