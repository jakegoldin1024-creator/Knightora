import type { QuestProgress, SavedDashboard, TrainingProgress } from "@/lib/account-store";
import { DEFAULT_TRAINING_PROGRESS } from "@/lib/account-store";
import { defaultQuizProfile, type QuizProfile } from "@/lib/recommendations";
import type { RepertoireResult } from "@/lib/recommendations";
import type { ChessProfileResponse } from "@/lib/chesscom";

function isQuestProgress(value: unknown): value is QuestProgress {
  if (!value || typeof value !== "object") return false;
  const q = value as QuestProgress;
  if (typeof q.dayKey !== "string" || typeof q.lightMode !== "boolean" || !Array.isArray(q.quests)) return false;
  if (q.rerollsUsed !== undefined && typeof q.rerollsUsed !== "number") return false;
  for (const item of q.quests) {
    if (!item || typeof item !== "object") return false;
    const t = item as Record<string, unknown>;
    if (typeof t.id !== "string" || typeof t.kind !== "string") return false;
    if (typeof t.title !== "string" || typeof t.description !== "string") return false;
    if (typeof t.target !== "number" || typeof t.progress !== "number") return false;
    if (typeof t.xpReward !== "number" || typeof t.completed !== "boolean") return false;
  }
  return true;
}

/**
 * Merge persisted dashboard JSON with defaults so older saves and partial payloads stay valid.
 */
export function normalizeSavedDashboard(raw: unknown): SavedDashboard | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Partial<SavedDashboard>;
  if (!r.profile || !r.repertoire || !r.trainingProgress) return null;

  const profile = { ...defaultQuizProfile(), ...(r.profile as QuizProfile) } as QuizProfile;
  const trainingProgress: TrainingProgress = {
    ...DEFAULT_TRAINING_PROGRESS,
    ...(r.trainingProgress as TrainingProgress),
    lessonStats: {
      ...(DEFAULT_TRAINING_PROGRESS.lessonStats as Record<string, never>),
      ...((r.trainingProgress as TrainingProgress)?.lessonStats ?? {}),
    },
    completedLessons: (r.trainingProgress as TrainingProgress)?.completedLessons ?? [],
  };

  const questProgress: QuestProgress | undefined = isQuestProgress(r.questProgress) ? r.questProgress : undefined;

  return {
    profile,
    repertoire: r.repertoire as RepertoireResult,
    insights: (r.insights ?? null) as ChessProfileResponse["insights"] | null,
    savedAt: typeof r.savedAt === "string" ? r.savedAt : new Date().toISOString(),
    trainingProgress,
    questProgress: questProgress ?? undefined,
  };
}
