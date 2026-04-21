/**
 * Sanity checks for daily quest board idempotency and day rollover (pure logic).
 *
 * Run: npx tsx scripts/quest-board-sanity.ts
 */
import { defaultQuizProfile } from "../lib/recommendations";
import { getRepertoire } from "../lib/recommendations";
import { calendarDayKey, ensureDailyQuestBoard, generateDailyQuests } from "../lib/daily-quests";
import type { SavedDashboard } from "../lib/account-store";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function minimalDashboard(overrides: Partial<SavedDashboard> = {}): SavedDashboard {
  const profile = defaultQuizProfile();
  const repertoire = getRepertoire(profile);
  const base: SavedDashboard = {
    profile,
    repertoire,
    insights: null,
    savedAt: new Date().toISOString(),
    trainingProgress: {
      completedLessons: [],
      xp: 0,
      streak: 0,
      lastTrainingDate: null,
      lessonStats: {},
    },
    ...overrides,
  };
  return base;
}

function main() {
  const d0 = minimalDashboard();
  const noonUtc = new Date("2026-06-15T12:00:00.000Z");
  const nextDay = new Date("2026-06-16T12:00:00.000Z");

  const a = ensureDailyQuestBoard(d0, {
    isPaidPlan: true,
    lightMode: false,
    dueLessonCount: 0,
    now: noonUtc,
  });
  assert(a.questProgress && a.questProgress.quests.length > 0, "expected quests");
  assert(a.questProgress!.dayKey === calendarDayKey(noonUtc, "UTC"), "dayKey matches calendar UTC");

  const b = ensureDailyQuestBoard(a, {
    isPaidPlan: true,
    lightMode: false,
    dueLessonCount: 0,
    now: noonUtc,
  });
  assert(b === a, "idempotent same day/light");

  const c = ensureDailyQuestBoard(a, {
    isPaidPlan: true,
    lightMode: true,
    dueLessonCount: 0,
    now: noonUtc,
  });
  assert(c !== a, "light toggle should regenerate");
  assert(c.questProgress!.lightMode === true, "light mode persisted");

  const d = ensureDailyQuestBoard(c, {
    isPaidPlan: true,
    lightMode: true,
    dueLessonCount: 0,
    now: nextDay,
  });
  assert(d.questProgress!.dayKey === calendarDayKey(nextDay, "UTC"), "rollover new dayKey");

  const la = calendarDayKey(new Date("2026-01-15T07:00:00.000Z"), "America/Los_Angeles");
  assert(/^\d{4}-\d{2}-\d{2}$/.test(la), "quest calendar dayKey format for America/Los_Angeles");

  const g = generateDailyQuests({
    profile: defaultQuizProfile(),
    repertoire: getRepertoire(defaultQuizProfile()),
    insights: null,
    trainingProgress: d0.trainingProgress,
    dueLessonCount: 0,
    isPaidPlan: false,
    lightMode: false,
    now: noonUtc,
  });
  const tactics = g.quests.find((q) => q.kind === "tactics");
  assert(tactics && tactics.target <= 3, "free tactics cap");

  console.log("[quest-board-sanity] OK");
}

main();
