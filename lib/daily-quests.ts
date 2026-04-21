import type { DailyQuest, DailyQuestKind, QuestProgress, SavedDashboard, TrainingProgress } from "@/lib/account-store";
import { matchOpeningLabelToCatalogKey, type ChessInsights } from "@/lib/chesscom";
import type { DailyStudyMinutes, QuizProfile, RepertoireResult } from "@/lib/recommendations";

const QUEST_KIND_PRIORITY: DailyQuestKind[] = ["tactics", "repertoire", "review", "chesscom_insight"];

const FREE_TACTICS_CAP = 3;

const MAX_PAID_REROLLS_PER_DAY = 1;

/** Calendar YYYY-MM-DD in the given IANA timezone (or UTC if invalid / omitted). */
export function calendarDayKey(now = new Date(), timeZone?: string | null): string {
  const raw = timeZone?.trim();
  if (!raw || raw.toUpperCase() === "UTC") {
    return now.toISOString().slice(0, 10);
  }
  try {
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: raw,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const parts = fmt.formatToParts(now);
    const y = parts.find((p) => p.type === "year")?.value;
    const m = parts.find((p) => p.type === "month")?.value;
    const d = parts.find((p) => p.type === "day")?.value;
    if (y && m && d) return `${y}-${m}-${d}`;
  } catch {
    // invalid TZ
  }
  return now.toISOString().slice(0, 10);
}

/** @deprecated Prefer calendarDayKey with explicit timezone. */
export function utcDayKey(d = new Date()): string {
  return calendarDayKey(d, "UTC");
}

function questDayKeyForProfile(now: Date, profile: QuizProfile): string {
  return calendarDayKey(now, profile.questDayTimezone ?? "UTC");
}

type Budget = { maxQuests: number; tacticsTarget: number };

function baseBudget(minutes: DailyStudyMinutes): Budget {
  switch (minutes) {
    case 15:
      return { maxQuests: 2, tacticsTarget: 3 };
    case 30:
      return { maxQuests: 3, tacticsTarget: 5 };
    case 45:
      return { maxQuests: 3, tacticsTarget: 6 };
    case 60:
      return { maxQuests: 4, tacticsTarget: 8 };
    case 90:
      return { maxQuests: 4, tacticsTarget: 10 };
    default:
      return { maxQuests: 3, tacticsTarget: 5 };
  }
}

function applyLightMode(b: Budget, lightMode: boolean): Budget {
  if (!lightMode) return b;
  return {
    maxQuests: Math.max(1, Math.floor(b.maxQuests / 2)),
    tacticsTarget: Math.max(1, Math.floor(b.tacticsTarget / 2)),
  };
}

export type GenerateDailyQuestsInput = {
  profile: QuizProfile;
  repertoire: RepertoireResult;
  insights: ChessInsights | null;
  trainingProgress: TrainingProgress;
  dueLessonCount: number;
  isPaidPlan: boolean;
  lightMode: boolean;
  now?: Date;
};

/**
 * Build a fresh quest board for the user's quest calendar day.
 */
export function generateDailyQuests(input: GenerateDailyQuestsInput): QuestProgress {
  const now = input.now ?? new Date();
  const dayKey = questDayKeyForProfile(now, input.profile);
  const { profile, repertoire, insights, dueLessonCount } = input;

  let budget = applyLightMode(baseBudget(profile.dailyStudyMinutes), input.lightMode);

  if (!input.isPaidPlan) {
    budget = {
      maxQuests: profile.dailyStudyMinutes >= 60 ? Math.min(budget.maxQuests, 3) : budget.maxQuests,
      tacticsTarget: Math.min(FREE_TACTICS_CAP, budget.tacticsTarget),
    };
  }

  const pool: DailyQuest[] = [];

  pool.push({
    id: "tactics",
    kind: "tactics",
    title: "Daily tactics",
    description: `Solve ${budget.tacticsTarget} one-move puzzles (refreshes at the start of each calendar day in your quest timezone).`,
    target: budget.tacticsTarget,
    progress: 0,
    xpReward: 14 + Math.min(22, budget.tacticsTarget * 2),
    completed: false,
  });

  pool.push({
    id: "repertoire",
    kind: "repertoire",
    title: "Repertoire win",
    description: `Finish a lesson correctly on your ${repertoire.white.name} White track.`,
    target: 1,
    progress: 0,
    xpReward: 35,
    completed: false,
    trackId: "white",
  });

  if (dueLessonCount > 0) {
    pool.push({
      id: "review",
      kind: "review",
      title: "Due review",
      description: "Answer a full lesson correctly when it was already due for review.",
      target: 1,
      progress: 0,
      xpReward: 28,
      completed: false,
    });
  } else {
    pool.push({
      id: "review",
      kind: "review",
      title: "Training reps",
      description: "Score two correct lesson completions in opening training today.",
      target: 2,
      progress: 0,
      xpReward: 22,
      completed: false,
    });
  }

  if (insights?.whiteTopOpenings?.length) {
    const top = insights.whiteTopOpenings[0]!;
    const hinted = matchOpeningLabelToCatalogKey(top.opening);
    const aligned = hinted === repertoire.white.key;
    pool.push({
      id: "chesscom-insight",
      kind: "chesscom_insight",
      title: aligned ? `White habit: ${truncate(top.opening, 48)}` : "White structure drill",
      description: aligned
        ? `Chess.com highlights this lane often — bank one clean White lesson in your ${repertoire.white.name} repertoire.`
        : `Your suggested White system is ${repertoire.white.name} — log a correct lesson there today.`,
      target: 1,
      progress: 0,
      xpReward: input.isPaidPlan ? 32 : 22,
      completed: false,
      trackId: "white",
      openingKey: repertoire.white.key,
    });
  }

  const ordered = [...pool].sort(
    (a, b) => QUEST_KIND_PRIORITY.indexOf(a.kind) - QUEST_KIND_PRIORITY.indexOf(b.kind),
  );
  const quests = ordered.slice(0, budget.maxQuests);

  return { dayKey, lightMode: input.lightMode, quests };
}

export type EnsureQuestBoardInput = {
  isPaidPlan: boolean;
  lightMode: boolean;
  dueLessonCount: number;
  now?: Date;
  /** When true, rebuild quests even if the board matches day + light mode (e.g. dev). */
  force?: boolean;
  /** Paid-only: regenerate quests for the same calendar day (MVP: once per day). */
  reroll?: boolean;
};

export function ensureDailyQuestBoard(dashboard: SavedDashboard, opts: EnsureQuestBoardInput): SavedDashboard {
  const now = opts.now ?? new Date();
  const dayKey = questDayKeyForProfile(now, dashboard.profile);
  const existing = dashboard.questProgress;

  let forceRegen = Boolean(opts.force);
  if (opts.reroll) {
    if (!opts.isPaidPlan) return dashboard;
    if (!existing || existing.dayKey !== dayKey) return dashboard;
    if ((existing.rerollsUsed ?? 0) >= MAX_PAID_REROLLS_PER_DAY) return dashboard;
    forceRegen = true;
  }

  if (!forceRegen && existing && existing.dayKey === dayKey && existing.lightMode === opts.lightMode && existing.quests.length > 0) {
    return dashboard;
  }

  const generated = generateDailyQuests({
    profile: dashboard.profile,
    repertoire: dashboard.repertoire,
    insights: dashboard.insights,
    trainingProgress: dashboard.trainingProgress,
    dueLessonCount: opts.dueLessonCount,
    isPaidPlan: opts.isPaidPlan,
    lightMode: opts.lightMode,
    now,
  });

  const rerollsUsed = opts.reroll ? (existing?.rerollsUsed ?? 0) + 1 : 0;

  const questProgress: QuestProgress = {
    ...generated,
    rerollsUsed,
  };

  return { ...dashboard, questProgress, savedAt: new Date().toISOString() };
}

function truncate(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function advanceQuest(quest: DailyQuest, delta: number): { next: DailyQuest; xpEarned: number } {
  if (quest.completed || delta <= 0) return { next: quest, xpEarned: 0 };
  const progress = Math.min(quest.target, quest.progress + delta);
  const completed = progress >= quest.target;
  const xpEarned = completed && !quest.completed ? quest.xpReward : 0;
  return { next: { ...quest, progress, completed }, xpEarned };
}

function patchQuestProgress(
  dashboard: SavedDashboard,
  matcher: (q: DailyQuest) => boolean,
  delta: number,
): SavedDashboard {
  const qp = dashboard.questProgress;
  if (!qp) return dashboard;
  let xpEarned = 0;
  const quests = qp.quests.map((q) => {
    if (!matcher(q)) return q;
    const { next, xpEarned: xp } = advanceQuest(q, delta);
    xpEarned += xp;
    return next;
  });
  const trainingProgress =
    xpEarned > 0
      ? { ...dashboard.trainingProgress, xp: dashboard.trainingProgress.xp + xpEarned }
      : dashboard.trainingProgress;
  return {
    ...dashboard,
    questProgress: { ...qp, quests },
    trainingProgress,
    savedAt: new Date().toISOString(),
  };
}

export function incrementTacticsQuest(dashboard: SavedDashboard, solvedDelta = 1): SavedDashboard {
  return patchQuestProgress(dashboard, (q) => q.kind === "tactics" && !q.completed, solvedDelta);
}

function lessonWasDue(statsBefore: TrainingProgress["lessonStats"][string] | undefined): boolean {
  if (!statsBefore?.dueAt) return true;
  return new Date(statsBefore.dueAt).getTime() <= Date.now();
}

export type LessonQuestEvent = {
  trackId: "white" | "black-e4" | "black-d4";
  lessonId: string;
  wasCorrect: boolean;
  /** Lesson stats before this attempt is applied (for due detection). */
  statsBefore: TrainingProgress["lessonStats"][string] | undefined;
  /** Whether this attempt is the first time this lesson is marked complete in training progress. */
  newlyCompleting: boolean;
};

export function applyQuestProgressAfterLesson(dashboard: SavedDashboard, event: LessonQuestEvent): SavedDashboard {
  if (!event.wasCorrect || !dashboard.questProgress) return dashboard;

  let next = dashboard;
  const wasDue = lessonWasDue(event.statsBefore);

  const repQuest = dashboard.questProgress.quests.find((q) => q.kind === "repertoire" && !q.completed);
  if (repQuest && event.newlyCompleting && (!repQuest.trackId || repQuest.trackId === event.trackId)) {
    next = patchQuestProgress(next, (q) => q.id === repQuest.id, 1);
  }

  const reviewQuest = next.questProgress?.quests.find((q) => q.kind === "review" && !q.completed);
  if (reviewQuest) {
    if (reviewQuest.target === 1) {
      if (event.newlyCompleting && wasDue) {
        next = patchQuestProgress(next, (q) => q.id === reviewQuest.id, 1);
      }
    } else if (event.newlyCompleting) {
      next = patchQuestProgress(next, (q) => q.id === reviewQuest.id, 1);
    }
  }

  const insightQuest = next.questProgress?.quests.find((q) => q.kind === "chesscom_insight" && !q.completed);
  if (insightQuest && event.newlyCompleting && event.trackId === "white") {
    if (!insightQuest.openingKey || insightQuest.openingKey === dashboard.repertoire.white.key) {
      next = patchQuestProgress(next, (q) => q.id === insightQuest.id, 1);
    }
  }

  return next;
}
