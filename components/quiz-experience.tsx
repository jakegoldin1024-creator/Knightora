"use client";

import { UserButton, useAuth, useClerk, useSession } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type DragEvent, type FormEvent } from "react";
import { filterLessonsForPlan, getTrainingTrack, type TrainingLesson, type TrainingVariation } from "@/data/training";
import { pickDailyTacticsPuzzles, type DailyPuzzle } from "@/data/daily-puzzles";
import { QUEST_TIMEZONE_OPTIONS } from "@/data/quest-timezones";
import { getOnboardingPuzzleSet } from "@/data/onboarding-puzzles";
import { OnboardingDiagnosticStrip } from "@/components/onboarding-diagnostic-strip";
import { TacticsDailyModal } from "@/components/tactics-daily-modal";
import {
  DEFAULT_TRAINING_PROGRESS,
  type LessonStat,
  type SavedDashboard,
  type TrainingProgress,
} from "@/lib/account-store";
import {
  applyQuestProgressAfterLesson,
  calendarDayKey,
  ensureDailyQuestBoard,
  incrementTacticsQuest,
} from "@/lib/daily-quests";
import { normalizeSavedDashboard } from "@/lib/merge-dashboard";
import { ADMIN_UNLOCK_ENABLED } from "@/lib/admin-unlock";
import { type SubscriptionPlan, isPaidPlan } from "@/lib/subscription";
import { buildFenFromKnightneoPlacements, inferSideToMoveFromSource } from "@/lib/board-fen";
import { getLegalDestinationsForSource, isLegalDestinationForSource } from "@/lib/move-legality";
import { OpeningPreviewBoard } from "@/components/opening-preview-board";
import { getNeoPieceSrc, getUnicodePieceGlyph } from "@/lib/neo-board-pieces";
import { analyzeFenWithStockfish, type StockfishEval } from "@/lib/stockfish-client";
import type { ChessProfileResponse } from "@/lib/chesscom";
import {
  describeGoal,
  describeStyle,
  defaultQuizProfile,
  getRepertoire,
  type DailyStudyMinutes,
  type Goal,
  type PositionType,
  type QuizProfile,
  type RankedOpening,
  type RepertoireResult,
  type RiskLevel,
  type TimeControl,
  type TheoryLevel,
  type RatingBand,
} from "@/lib/recommendations";
import styles from "./quiz-experience.module.css";

type AccountUser = {
  id: string;
  name: string;
  email: string;
  subscriptionPlan: SubscriptionPlan;
  createdAt: string;
};

type TrainingSessionState = {
  trackId: string;
  lessonIndex: number;
  selectedChoice: string | null;
  revealed: boolean;
  /** Current step index inside multi-move `line` lessons */
  lineStepIndex: number;
  variationSelections: Record<string, string>;
};


const CHAPTER_FLOW = ["Mainline", "Opponent deviations", "Core concepts", "Endgame micro-drills", "Review and retention"] as const;
const CHAPTER_COPY: Record<string, { subtitle: string; estimate: string }> = {
  Mainline: {
    subtitle: "Build your default move-order backbone first.",
    estimate: "8-12 min",
  },
  "Opponent deviations": {
    subtitle: "Train practical replies when opponents sidestep theory.",
    estimate: "6-10 min",
  },
  "Core concepts": {
    subtitle: "Learn plans, pawn breaks, and decision patterns.",
    estimate: "6-9 min",
  },
  "Endgame micro-drills": {
    subtitle: "Sharpen practical conversion patterns after the opening battle.",
    estimate: "4-7 min",
  },
  "Review and retention": {
    subtitle: "Lock patterns into long-term memory with quick reps.",
    estimate: "4-8 min",
  },
};

function getNextChapterAfter(chapter: string) {
  const idx = CHAPTER_FLOW.findIndex((name) => name === chapter);
  if (idx < 0 || idx >= CHAPTER_FLOW.length - 1) return null;
  return CHAPTER_FLOW[idx + 1];
}

function sideToMoveFromFen(fen: string | undefined): "w" | "b" | null {
  if (!fen) return null;
  const parts = fen.split(" ");
  const side = parts[1];
  return side === "w" || side === "b" ? side : null;
}

function getLastUserLineStepIndex(steps: Array<{ fen: string }>, desiredSide: "w" | "b"): number {
  let last = 0;
  for (let i = 0; i < steps.length; i++) {
    if (sideToMoveFromFen(steps[i].fen) === desiredSide) last = i;
  }
  return last;
}

function countUserPliesInLine(steps: Array<{ fen: string }>, desiredSide: "w" | "b"): number {
  return steps.reduce((n, s) => (sideToMoveFromFen(s.fen) === desiredSide ? n + 1 : n), 0);
}

function userPlyNumberAtStep(steps: Array<{ fen: string }>, lineStepIndex: number, desiredSide: "w" | "b"): number {
  let n = 0;
  for (let i = 0; i <= lineStepIndex && i < steps.length; i++) {
    if (sideToMoveFromFen(steps[i].fen) === desiredSide) n += 1;
  }
  return n;
}

const STORAGE_KEY = "knightneo-dashboard-v2";
const TRAINING_TELEMETRY_KEY = "knightneo-training-telemetry-v1";
const UX_TELEMETRY_KEY = "knightneo-ux-telemetry-v1";

const initialProfile: QuizProfile = defaultQuizProfile({ username: "" });

const initialTrainingProgress: TrainingProgress = DEFAULT_TRAINING_PROGRESS;

export function QuizExperience() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const { signOut } = useClerk();
  const { session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [profile, setProfile] = useState<QuizProfile>(initialProfile);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const [savedDashboard, setSavedDashboard] = useState<SavedDashboard | null>(null);
  const [accountUser, setAccountUser] = useState<AccountUser | null>(null);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [guestSubscriptionPlan, setGuestSubscriptionPlan] = useState<SubscriptionPlan>("free");
  const [adminCodeInput, setAdminCodeInput] = useState("");
  const [adminCodeMessage, setAdminCodeMessage] = useState<string | null>(null);
  const [engineEval, setEngineEval] = useState<StockfishEval | null>(null);
  const [engineStatus, setEngineStatus] = useState<string | null>(null);
  const analysisAbortRef = useRef<AbortController | null>(null);
  const lineAdvanceTimeoutRef = useRef<number | null>(null);
  const hadDashboardRef = useRef(false);
  const completedBaselineForTrackRef = useRef<string[]>([]);
  const lastTrackIdForCelebrationRef = useRef<string | null>(null);
  const chapterCelebrationTimerRef = useRef<number | null>(null);
  const lineAutoFinishRef = useRef<string | null>(null);
  const lessonCelebrationKeyRef = useRef<string | null>(null);
  const lessonFeedbackRef = useRef<HTMLDivElement | null>(null);
  const lessonConfettiTimerRef = useRef<number | null>(null);

  const [hydrated, setHydrated] = useState(false);
  const [lessonCelebrationBurst, setLessonCelebrationBurst] = useState(0);
  const [lessonCelebrationActive, setLessonCelebrationActive] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [endlessMode, setEndlessMode] = useState(false);
  const [showQuizForm, setShowQuizForm] = useState(false);
  const [showPickExtras, setShowPickExtras] = useState(false);
  const [diagnosticSummary, setDiagnosticSummary] = useState<{ attempted: number; correct: number } | null>(null);
  const [tacticsModalOpen, setTacticsModalOpen] = useState(false);
  const [tacticsSessionPuzzles, setTacticsSessionPuzzles] = useState<DailyPuzzle[]>([]);
  const [dashboardTab, setDashboardTab] = useState<"overview" | "openings" | "training">("overview");
  const [chapterCelebration, setChapterCelebration] = useState<string | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  /** pick = choose opening, intro = opening context, linePrimer = basics overview, variationSelect = choose branch, course = lesson path */
  const [trainingUiPhase, setTrainingUiPhase] = useState<"pick" | "intro" | "linePrimer" | "variationSelect" | "course">("pick");
  const [trainingSession, setTrainingSession] = useState<TrainingSessionState>({
    trackId: "white",
    lessonIndex: 0,
    selectedChoice: null,
    revealed: false,
    lineStepIndex: 0,
    variationSelections: {},
  });

  const fallbackRepertoire = useMemo(() => getRepertoire(profile), [profile]);
  const onboardingPuzzles = useMemo(() => getOnboardingPuzzleSet(profile.rating), [profile.rating]);
  const activeDashboard = savedDashboard;
  const selectedPlan = accountUser?.subscriptionPlan ?? guestSubscriptionPlan;
  const trainingTracks = useMemo(
    () => (activeDashboard ? buildTrainingTracks(activeDashboard.repertoire, selectedPlan) : []),
    [activeDashboard, selectedPlan],
  );
  const activeTrack = useMemo(
    () => trainingTracks.find((track) => track.id === trainingSession.trackId) ?? trainingTracks[0] ?? null,
    [trainingTracks, trainingSession.trackId],
  );
  const activeTrackId = activeTrack?.id ?? null;
  const selectedVariationId = activeTrackId ? trainingSession.variationSelections[activeTrackId] ?? null : null;
  const activeCourseLessons = useMemo(
    () => getCourseLessonsForVariation(activeTrack?.lessons ?? [], selectedVariationId),
    [activeTrack?.lessons, selectedVariationId],
  );
  const activeTrackLessonCount = activeCourseLessons.length;
  const activeLesson = activeCourseLessons[trainingSession.lessonIndex] ?? null;
  const selectedVariation = useMemo(
    () => activeTrack?.variations?.find((v) => v.id === selectedVariationId) ?? null,
    [activeTrack?.variations, selectedVariationId],
  );
  const recommendedVariation = useMemo(
    () => recommendVariation(activeTrack?.variations ?? [], profile),
    [activeTrack?.variations, profile],
  );
  const recommendationReasons = useMemo(
    () => buildRecommendationReasons(profile, recommendedVariation),
    [profile, recommendedVariation],
  );
  const progress = activeDashboard?.trainingProgress ?? initialTrainingProgress;

  useEffect(() => {
    if (!hydrated || !activeDashboard) return;
    const day = calendarDayKey(new Date(), activeDashboard.profile.questDayTimezone ?? "UTC");
    const qp = activeDashboard.questProgress;
    const needsBoard = !qp || qp.dayKey !== day || !qp.quests?.length;
    if (!needsBoard) return;
    const due = countDueLessons(trainingTracks, activeDashboard.trainingProgress.lessonStats);
    const light = qp?.dayKey === day ? qp.lightMode : Boolean(activeDashboard.profile.prefersLightDaysDefault);
    setSavedDashboard((d) => {
      if (!d) return d;
      return ensureDailyQuestBoard(d, {
        isPaidPlan: isPaidPlan(selectedPlan),
        lightMode: light,
        dueLessonCount: due,
      });
    });
  }, [hydrated, activeDashboard, trainingTracks, selectedPlan]);

  useEffect(() => {
    if (!hydrated) return;
    if (searchParams.get("focus") !== "today") return;
    setDashboardTab("overview");
    window.setTimeout(() => {
      document.getElementById("dashboard")?.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
    }, 80);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("focus");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [hydrated, searchParams, pathname, router, reduceMotion]);

  const weeklyCompletedCount = useMemo(() => {
    const since = new Date();
    since.setDate(since.getDate() - 7);
    return Object.values(progress.lessonStats).filter((s) => s.lastReviewed && new Date(s.lastReviewed) >= since).length;
  }, [progress.lessonStats]);
  const weeklyGoal = 12;
  const milestoneProgress = useMemo(() => {
    const completed = progress.completedLessons.length;
    if (completed < 10) return { next: 10, done: completed };
    if (completed < 25) return { next: 25, done: completed };
    if (completed < 50) return { next: 50, done: completed };
    return { next: 100, done: completed };
  }, [progress.completedLessons.length]);
  const chapterGroups = useMemo(
    () => buildChapterGroups(activeCourseLessons, progress.completedLessons),
    [activeCourseLessons, progress.completedLessons],
  );
  const nextChapterLessonIndex = useMemo(
    () => getNextChapterLessonIndex(activeCourseLessons, progress.completedLessons),
    [activeCourseLessons, progress.completedLessons],
  );
  const latestDashboardRef = useRef<SavedDashboard | null>(null);
  const canUsePremiumReview = isPaidPlan(selectedPlan);
  const canUsePremiumStudies = isPaidPlan(selectedPlan);
  const assignedTrackId = useMemo(
    () =>
      trainingTracks.find((track) => track.id === "white" && getTrackCompletion(track.lessons, progress.completedLessons) < 100)?.id ??
      trainingTracks.find((track) => track.id === "black-e4" && getTrackCompletion(track.lessons, progress.completedLessons) < 100)?.id ??
      trainingTracks.find((track) => track.id === "black-d4" && getTrackCompletion(track.lessons, progress.completedLessons) < 100)?.id ??
      trainingTracks[0]?.id ??
      null,
    [trainingTracks, progress.completedLessons],
  );

  const scrollDashboardIntoView = useCallback(() => {
    window.setTimeout(() => {
      document.getElementById("dashboard")?.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
    }, 80);
  }, [reduceMotion]);

  const goToOpeningsAfterRepertoireBuild = useCallback(() => {
    setDashboardTab("openings");
    scrollDashboardIntoView();
  }, [scrollDashboardIntoView]);

  const prepFlowStep = useMemo(() => {
    if (!activeDashboard) return 0;
    if (dashboardTab === "overview") return 1;
    if (dashboardTab === "openings") return 2;
    if (dashboardTab === "training") {
      if (trainingUiPhase === "pick") return 3;
      if (trainingUiPhase === "course") return 5;
      return 4;
    }
    return 1;
  }, [activeDashboard, dashboardTab, trainingUiPhase]);

  function clearLineAdvanceTimer() {
    if (lineAdvanceTimeoutRef.current != null) {
      window.clearTimeout(lineAdvanceTimeoutRef.current);
      lineAdvanceTimeoutRef.current = null;
    }
  }

  useEffect(() => {
    setDiagnosticSummary(null);
  }, [profile.rating]);

  useEffect(() => {
    setHydrated(true);

    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = normalizeSavedDashboard(JSON.parse(saved));
        if (parsed) {
          setSavedDashboard(parsed);
          setProfile(parsed.profile);
        }
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }

    void loadAccount();
  }, []);

  useEffect(() => {
    if (isLoaded && isSignedIn && userId) {
      void loadAccount();
    }
  }, [isLoaded, isSignedIn, userId]);

  useEffect(() => {
    if (!hydrated || !activeDashboard) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(activeDashboard));
  }, [activeDashboard, hydrated]);

  useEffect(() => {
    latestDashboardRef.current = activeDashboard;
  }, [activeDashboard]);

  useEffect(() => {
    const hasDashboard = Boolean(activeDashboard);
    if (hasDashboard && !hadDashboardRef.current) {
      window.setTimeout(() => {
        document.getElementById("dashboard")?.scrollIntoView({
          behavior: reduceMotion ? "auto" : "smooth",
          block: "start",
        });
      }, 120);
    }
    hadDashboardRef.current = hasDashboard;
  }, [activeDashboard, reduceMotion]);

  useEffect(() => {
    if (!latestDashboardRef.current || !accountUser) return;
    void persistDashboard(latestDashboardRef.current);
  }, [accountUser, activeDashboard?.savedAt]);

  useEffect(() => {
    if (!activeTrackId) return;
    setTrainingSession((current) => {
      const maxIdx = Math.max(0, activeTrackLessonCount - 1);
      const safeIndex = Math.min(current.lessonIndex, maxIdx);
      const trackMatches = current.trackId === activeTrackId;
      const hasValidIndex = activeTrackLessonCount === 0 ? current.lessonIndex === 0 : current.lessonIndex === safeIndex;
      if (trackMatches && hasValidIndex) {
        return current;
      }

      return {
        trackId: activeTrackId,
        lessonIndex: safeIndex,
        selectedChoice: null,
        revealed: false,
        lineStepIndex: 0,
        variationSelections: current.variationSelections,
      };
    });
  }, [activeTrackId, activeTrackLessonCount]);

  useEffect(() => {
    if (!focusMode || !assignedTrackId) return;
    setTrainingSession((current) => {
      if (current.trackId === assignedTrackId) return current;
      return {
        trackId: assignedTrackId,
        lessonIndex: 0,
        selectedChoice: null,
        revealed: false,
        lineStepIndex: 0,
        variationSelections: current.variationSelections,
      };
    });
  }, [focusMode, assignedTrackId]);

  useEffect(() => {
    setLessonCelebrationActive(false);
    if (lessonConfettiTimerRef.current != null) {
      window.clearTimeout(lessonConfettiTimerRef.current);
      lessonConfettiTimerRef.current = null;
    }
    setTrainingSession((current) => ({ ...current, lineStepIndex: 0 }));
  }, [activeLesson?.id]);

  useEffect(() => {
    return () => {
      clearLineAdvanceTimer();
      if (chapterCelebrationTimerRef.current != null) window.clearTimeout(chapterCelebrationTimerRef.current);
      if (lessonConfettiTimerRef.current != null) window.clearTimeout(lessonConfettiTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!hydrated || !activeTrack) return;

    const lessonIds = new Set(activeTrack.lessons.map((l) => l.id));
    const forTrack = progress.completedLessons.filter((id) => lessonIds.has(id));

    if (lastTrackIdForCelebrationRef.current !== activeTrack.id) {
      lastTrackIdForCelebrationRef.current = activeTrack.id;
      completedBaselineForTrackRef.current = forTrack;
      return;
    }

    const prev = completedBaselineForTrackRef.current;
    const newlyCompleted = forTrack.filter((id) => !prev.includes(id));
    completedBaselineForTrackRef.current = forTrack;
    if (newlyCompleted.length === 0) return;

    for (const lessonId of newlyCompleted) {
      const lesson = activeTrack.lessons.find((l) => l.id === lessonId);
      if (!lesson) continue;
      const chapter = getLessonChapter(lesson);
      const inChapter = activeTrack.lessons.filter((l) => getLessonChapter(l) === chapter);
      const allDone = inChapter.every((l) => forTrack.includes(l.id));
      if (!allDone) continue;

      const nextChapter = getNextChapterAfter(chapter);
      const message = nextChapter
        ? `${chapter} complete — ${nextChapter} unlocked`
        : `${chapter} complete — you finished this track’s curriculum`;
      setChapterCelebration(message);
      if (chapterCelebrationTimerRef.current != null) window.clearTimeout(chapterCelebrationTimerRef.current);
      chapterCelebrationTimerRef.current = window.setTimeout(() => {
        setChapterCelebration(null);
        chapterCelebrationTimerRef.current = null;
      }, 8000);
      break;
    }
  }, [hydrated, activeTrack, progress.completedLessons]);

  useEffect(() => {
    lineAutoFinishRef.current = null;
  }, [activeLesson?.id]);

  // Full-line lessons: skip opponent plies; if the line ends on opponent moves, finish the drill without leaving a stale index.
  useEffect(() => {
    if (!activeLesson?.line?.steps?.length || !activeTrack || !activeDashboard) return;
    if (trainingSession.revealed) return;

    const steps = activeLesson.line.steps;
    const desiredSide = activeTrack.id === "white" ? "w" : "b";

    const finishLine = (lastUserIdx: number) => {
      if (lineAutoFinishRef.current === activeLesson.id) return;
      lineAutoFinishRef.current = activeLesson.id;
      const lastStep = steps[lastUserIdx];
      if (!lastStep) return;
      setSavedDashboard((d) => {
        if (!d || !activeTrack) return d;
        return commitLessonAfterAttempt(d, activeTrack.id, activeLesson.id, true);
      });
      setTrainingSession((current) => ({
        ...current,
        lineStepIndex: lastUserIdx,
        selectedChoice: lastStep.targetSquare,
        revealed: true,
      }));
    };

    let idx = trainingSession.lineStepIndex;
    if (idx >= steps.length) {
      finishLine(getLastUserLineStepIndex(steps, desiredSide));
      return;
    }

    const step = steps[idx];
    const side = sideToMoveFromFen(step?.fen);
    if (!side) return;
    if (side === desiredSide) return;

    while (idx < steps.length) {
      const s = sideToMoveFromFen(steps[idx]?.fen);
      if (!s || s === desiredSide) break;
      idx += 1;
    }

    if (idx >= steps.length) {
      finishLine(getLastUserLineStepIndex(steps, desiredSide));
      return;
    }

    if (idx !== trainingSession.lineStepIndex) {
      setTrainingSession((current) => ({
        ...current,
        lineStepIndex: idx,
        selectedChoice: null,
        revealed: false,
      }));
    }
  }, [
    activeLesson?.id,
    activeLesson?.line,
    activeTrack,
    activeDashboard,
    trainingSession.lineStepIndex,
    trainingSession.revealed,
  ]);

  useEffect(() => {
    if (!activeLesson || !trainingSession.revealed) return;
    if (!isLessonAnswerCorrect(activeLesson, trainingSession.selectedChoice, trainingSession.lineStepIndex)) return;
    const key = `${activeLesson.id}:${trainingSession.lineStepIndex}:${trainingSession.selectedChoice ?? ""}`;
    if (lessonCelebrationKeyRef.current === key) return;
    lessonCelebrationKeyRef.current = key;
    if (!reduceMotion) {
      setLessonCelebrationBurst((b) => b + 1);
      setLessonCelebrationActive(true);
      if (lessonConfettiTimerRef.current != null) window.clearTimeout(lessonConfettiTimerRef.current);
      lessonConfettiTimerRef.current = window.setTimeout(() => {
        setLessonCelebrationActive(false);
        lessonConfettiTimerRef.current = null;
      }, 1150);
    }
    window.setTimeout(() => {
      lessonFeedbackRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest" });
    }, 80);
  }, [activeLesson, trainingSession.revealed, trainingSession.selectedChoice, trainingSession.lineStepIndex, reduceMotion]);

  useEffect(() => {
    recordUxEvent("phase_entered", {
      phase: trainingUiPhase,
      trackId: trainingSession.trackId,
      variationId: selectedVariationId,
    });
  }, [trainingUiPhase, trainingSession.trackId, selectedVariationId]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  /** After Stripe redirects back, refresh Clerk session + account (webhook may need a second or two). */
  useEffect(() => {
    if (!hydrated) return;
    const params = new URLSearchParams(window.location.search);
    const billing = params.get("billing");
    if (!billing) return;

    const refreshAccount = async () => {
      try {
        await session?.reload();
      } catch {
        // non-blocking
      }
      try {
        const response = await fetch("/api/account/me");
        const payload = (await response.json()) as { user: AccountUser | null; dashboard: SavedDashboard | null };
        if (payload.user) {
          setAccountUser(payload.user);
          setGuestSubscriptionPlan(payload.user.subscriptionPlan);
          if (payload.dashboard) {
            const parsed = normalizeSavedDashboard(payload.dashboard);
            if (parsed) {
              setSavedDashboard(parsed);
              setProfile(parsed.profile);
            }
          }
        }
      } catch {
        setAccountError("Could not refresh account after checkout. Reload the page.");
      }
    };

    if (billing === "success") {
      setAccountError(null);
      void refreshAccount();
      window.setTimeout(() => void refreshAccount(), 2800);
      window.setTimeout(() => void refreshAccount(), 8000);
    } else if (billing === "cancel") {
      setAccountError("Checkout was canceled.");
    }
    window.history.replaceState({}, "", window.location.pathname);
  }, [hydrated, session]);

  async function loadAccount() {
    try {
      const response = await fetch("/api/account/me");
      const payload = (await response.json()) as { user: AccountUser | null; dashboard: SavedDashboard | null };

      if (!payload.user) {
        setAccountUser(null);
        return;
      }

      setAccountUser(payload.user);
      setGuestSubscriptionPlan(payload.user.subscriptionPlan);

      if (payload.dashboard) {
        const parsed = normalizeSavedDashboard(payload.dashboard);
        if (parsed) {
          setSavedDashboard(parsed);
          setProfile(parsed.profile);
        }
      }
    } catch {
      setAccountError("Unable to load account state. Refresh and try again.");
    }
  }

  function updateField<Key extends keyof QuizProfile>(key: Key, value: QuizProfile[Key]) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAnalysisError(null);

    const profileForSave: QuizProfile = {
      ...profile,
      puzzleDiagnostic: diagnosticSummary
        ? {
            version: 1,
            attempted: diagnosticSummary.attempted,
            correct: diagnosticSummary.correct,
            finishedAt: new Date().toISOString(),
          }
        : profile.puzzleDiagnostic,
    };

    if (!profileForSave.username?.trim()) {
      const dashboard = buildDashboard(profileForSave, fallbackRepertoire, null, progress, undefined);
      setSavedDashboard(dashboard);
      setProfile(profileForSave);
      goToOpeningsAfterRepertoireBuild();
      return;
    }

    const query = new URLSearchParams({
      username: profileForSave.username.trim(),
      rating: profileForSave.rating,
      positionType: profileForSave.positionType,
      theory: profileForSave.theory,
      risk: profileForSave.risk,
      timeControl: profileForSave.timeControl,
      goal: profileForSave.goal,
      dailyStudyMinutes: String(profileForSave.dailyStudyMinutes),
    });
    if (profileForSave.questDayTimezone) {
      query.set("questDayTimezone", profileForSave.questDayTimezone);
    }

    setIsPending(true);

    try {
      const response = await fetch(`/api/chess-profile?${query.toString()}`);
      const payload = (await response.json()) as ChessProfileResponse | { error?: string };

      if (!response.ok) {
        throw new Error(payload && "error" in payload ? payload.error : "Unable to analyze that username.");
      }

      const resolved = payload as ChessProfileResponse;
      setSavedDashboard(buildDashboard(profileForSave, resolved.repertoire, resolved.insights, progress, undefined));
      setProfile(profileForSave);
      goToOpeningsAfterRepertoireBuild();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "We could not analyze that Chess.com account, so Knightneo fell back to quiz-only recommendations.";
      setAnalysisError(message);
      setSavedDashboard(buildDashboard(profileForSave, fallbackRepertoire, null, progress, undefined));
      setProfile(profileForSave);
      goToOpeningsAfterRepertoireBuild();
    } finally {
      setIsPending(false);
    }
  }

  async function handleLogout() {
    await signOut({ redirectUrl: "/" });
    await fetch("/api/account/logout", { method: "POST" });
    setAccountUser(null);
  }

  async function persistDashboard(dashboard: SavedDashboard) {
    const response = await fetch("/api/dashboard", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dashboard),
    });

    const payload = (await response.json()) as { dashboard?: SavedDashboard; error?: string };
    if (!response.ok) {
      if (payload.error) setAccountError(payload.error);
      return;
    }

    if (payload.dashboard) {
      const parsed = normalizeSavedDashboard(payload.dashboard);
      if (parsed) setSavedDashboard(parsed);
    }
  }

  async function choosePlan(plan: SubscriptionPlan, adminCode?: string) {
    setGuestSubscriptionPlan(plan);

    const response = await fetch("/api/subscription", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscriptionPlan: plan, adminCode }),
    });

    const payload = (await response.json()) as { user?: AccountUser; error?: string };
    if (!response.ok || !payload.user) {
      const message = payload.error ?? "Unable to update subscription.";
      setAccountError(message);
      return { ok: false as const, error: message };
    }

    setAccountUser(payload.user);
    setAccountError(null);
    return { ok: true as const };
  }

  async function startCheckout(interval: "month" | "year") {
    setAccountError(null);
    if (!isLoaded) {
      setAccountError("Finishing sign-in—try checkout again in a second.");
      return;
    }
    if (!isSignedIn) {
      setAccountError("Please sign in before checkout.");
      return;
    }

    const response = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ plan: "paid" as SubscriptionPlan, interval }),
    });

    let payload: { url?: string; error?: string } = {};
    try {
      payload = (await response.json()) as { url?: string; error?: string };
    } catch {
      setAccountError(`Checkout failed (${response.status}). Check Stripe env vars on the server.`);
      return;
    }
    if (!response.ok || !payload.url) {
      const hint =
        response.status === 500 && (payload.error ?? "").toLowerCase().includes("stripe")
          ? " Add STRIPE_SECRET_KEY and price IDs in Vercel (or .env.local)."
          : "";
      setAccountError((payload.error ?? "Unable to start billing checkout.") + hint);
      return;
    }

    window.location.href = payload.url;
  }

  function canUseStockfish(plan: SubscriptionPlan) {
    return isPaidPlan(plan);
  }

  async function runStockfishAnalysis(fen: string) {
    if (!canUseStockfish(selectedPlan)) {
      setEngineStatus("Subscribe to unlock Stockfish analysis on lesson positions.");
      return;
    }

    analysisAbortRef.current?.abort();
    const controller = new AbortController();
    analysisAbortRef.current = controller;

    setEngineEval(null);
    setEngineStatus("Analyzing with Stockfish…");

    try {
      const best = await analyzeFenWithStockfish({
        fen,
        depth: 16,
        multiPv: 1,
        onInfo: (info) => {
          if (info.depth >= 10) setEngineEval(info);
        },
        signal: controller.signal,
      });

      if (controller.signal.aborted) return;
      setEngineEval(best);
      setEngineStatus(best ? "Stockfish analysis ready." : "No analysis produced.");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Stockfish failed to analyze.";
      setEngineStatus(
        `${msg} If this keeps happening, check your network, disable ad blockers for this page, and ensure cdn.jsdelivr.net can load.`,
      );
    }
  }

  async function applyAdminCode() {
    if (!isLoaded || !isSignedIn) {
      setAdminCodeMessage("Sign in first to apply an admin code.");
      return;
    }

    if (!adminCodeInput.trim()) {
      setAdminCodeMessage("Enter your admin code first.");
      return;
    }

    const result = await choosePlan("admin", adminCodeInput.trim());
    if (!result.ok) {
      setAdminCodeMessage(result.error);
      return;
    }
    setAdminCodeInput("");
    setAdminCodeMessage("Admin unlock enabled for this account.");
  }

  function beginTrack(trackId: string) {
    clearLineAdvanceTimer();
    recordUxEvent("track_started", { trackId });
    setDashboardTab("training");
    setTrainingUiPhase("intro");
    setTrainingSession((current) => ({
      trackId,
      lessonIndex: 0,
      selectedChoice: null,
      revealed: false,
      lineStepIndex: 0,
      variationSelections: current.variationSelections,
    }));
  }

  function continueToLinePrimer() {
    if (!activeTrack) return;
    setTrainingUiPhase("linePrimer");
  }

  function continueToVariationSelection() {
    if (!activeTrack) return;
    setTrainingUiPhase("variationSelect");
  }

  function applyVariationSelection(variationId: string) {
    if (!activeTrack) return;
    const trackId = activeTrack.id;
    recordUxEvent("variation_selected", { trackId, variationId });
    setTrainingSession((current) => {
      const nextSelections = { ...current.variationSelections, [trackId]: variationId };
      const lessons = getCourseLessonsForVariation(activeTrack.lessons, variationId);
      const nextIdx = Math.min(current.lessonIndex, Math.max(0, lessons.length - 1));
      return {
        ...current,
        trackId,
        lessonIndex: nextIdx,
        selectedChoice: null,
        revealed: false,
        lineStepIndex: 0,
        variationSelections: nextSelections,
      };
    });
  }

  function startCourseFromVariation() {
    if (!activeTrack) return;
    const chosen = selectedVariationId ?? recommendedVariation?.id ?? activeTrack.variations?.[0]?.id ?? "main";
    applyVariationSelection(chosen);
    recordUxEvent("course_started", { trackId: activeTrack.id, variationId: chosen });
    setTrainingUiPhase("course");
  }

  function exitTrainingCourse() {
    setTrainingUiPhase("pick");
  }

  function chooseAnswer(answer: string) {
    if (!activeDashboard || !activeLesson) {
      setTrainingSession((current) => ({ ...current, selectedChoice: answer, revealed: true }));
      return;
    }

    const line = activeLesson.line;
    if (line?.steps?.length) {
      const step = line.steps[trainingSession.lineStepIndex];
      if (!step) return;
      const expected = step.targetSquare;
      const isCorrect = answer === expected;

      if (isCorrect && trainingSession.lineStepIndex < line.steps.length - 1) {
        setTrainingSession((current) => ({
          ...current,
          selectedChoice: answer,
          revealed: false,
        }));
        clearLineAdvanceTimer();
        const stepDelayMs = reduceMotion ? 1100 : 720;
        lineAdvanceTimeoutRef.current = window.setTimeout(() => {
          setTrainingSession((current) => ({
            ...current,
            // Advance to next ply; an effect auto-skips opponent ply.
            lineStepIndex: current.lineStepIndex + 1,
            selectedChoice: null,
            revealed: false,
          }));
        }, stepDelayMs);
        return;
      }

      if (!activeTrack) return;
      recordTrainingTelemetry(activeLesson.id, isCorrect);
      const nextDashboard = commitLessonAfterAttempt(activeDashboard, activeTrack.id, activeLesson.id, isCorrect);
      setSavedDashboard(nextDashboard);
      setTrainingSession((current) => ({
        ...current,
        selectedChoice: answer,
        revealed: true,
      }));
      return;
    }

    if (activeLesson.board) {
      const isCorrect = answer === activeLesson.board.targetSquare;
      if (!activeTrack) return;
      recordTrainingTelemetry(activeLesson.id, isCorrect);
      const nextDashboard = commitLessonAfterAttempt(activeDashboard, activeTrack.id, activeLesson.id, isCorrect);
      setSavedDashboard(nextDashboard);
      setTrainingSession((current) => ({
        ...current,
        selectedChoice: answer,
        revealed: true,
      }));
      return;
    }

    const isCorrect = answer === activeLesson.answer;
    if (!activeTrack) return;
    recordTrainingTelemetry(activeLesson.id, isCorrect);
    const nextDashboard = commitLessonAfterAttempt(activeDashboard, activeTrack.id, activeLesson.id, isCorrect);

    setSavedDashboard(nextDashboard);
    setTrainingSession((current) => ({
      ...current,
      selectedChoice: answer,
      revealed: true,
    }));
  }

  function resetCurrentLesson() {
    lineAutoFinishRef.current = null;
    clearLineAdvanceTimer();
    lessonCelebrationKeyRef.current = null;
    setLessonCelebrationActive(false);
    if (lessonConfettiTimerRef.current != null) window.clearTimeout(lessonConfettiTimerRef.current);
    setTrainingSession((current) => ({
      ...current,
      selectedChoice: null,
      revealed: false,
    }));
  }

  function advanceLesson() {
    if (!activeTrack) return;
    clearLineAdvanceTimer();
    lessonCelebrationKeyRef.current = null;
    setLessonCelebrationActive(false);
    if (lessonConfettiTimerRef.current != null) window.clearTimeout(lessonConfettiTimerRef.current);
    if (endlessMode) {
      const nextDue = getNextDueIndex(activeCourseLessons, progress.lessonStats, trainingSession.lessonIndex);
      setTrainingSession((current) => ({
        trackId: current.trackId,
        lessonIndex: nextDue,
        selectedChoice: null,
        revealed: false,
        lineStepIndex: 0,
        variationSelections: current.variationSelections,
      }));
      return;
    }
    setTrainingSession((current) => ({
      trackId: current.trackId,
      lessonIndex: Math.min(current.lessonIndex + 1, activeCourseLessons.length - 1),
      selectedChoice: null,
      revealed: false,
      lineStepIndex: 0,
      variationSelections: current.variationSelections,
    }));
    if (trainingSession.lessonIndex >= activeCourseLessons.length - 1) {
      recordUxEvent("track_completed", {
        trackId: activeTrack.id,
        variationId: selectedVariationId,
      });
      setTrainingUiPhase("pick");
    }
  }

  function restartCurrentLineDrill() {
    lineAutoFinishRef.current = null;
    clearLineAdvanceTimer();
    setTrainingSession((current) => ({
      ...current,
      lineStepIndex: 0,
      selectedChoice: null,
      revealed: false,
    }));
  }

  function jumpToLessonById(lessonId: string) {
    if (!activeTrack) return;
    const idx = activeCourseLessons.findIndex((l) => l.id === lessonId);
    if (idx < 0) return;
    clearLineAdvanceTimer();
    setTrainingUiPhase("course");
    setTrainingSession((current) => ({
      trackId: activeTrack.id,
      lessonIndex: idx,
      selectedChoice: null,
      revealed: false,
      lineStepIndex: 0,
      variationSelections: current.variationSelections,
    }));
  }

  function jumpToTrackLesson(trackId: string, lessonId: string) {
    const track = trainingTracks.find((t) => t.id === trackId);
    if (!track) return;
    const selectedForTrack = trainingSession.variationSelections[trackId] ?? null;
    const scoped = getCourseLessonsForVariation(track.lessons, selectedForTrack);
    let idx = scoped.findIndex((l) => l.id === lessonId);
    let nextVariationSelections = trainingSession.variationSelections;
    if (idx < 0) {
      const targetLesson = track.lessons.find((l) => l.id === lessonId);
      if (!targetLesson) return;
      const targetVariation = targetLesson.variationId ?? selectedForTrack;
      nextVariationSelections = { ...trainingSession.variationSelections, [trackId]: targetVariation ?? "main" };
      const retargeted = getCourseLessonsForVariation(track.lessons, targetVariation ?? null);
      idx = retargeted.findIndex((l) => l.id === lessonId);
      if (idx < 0) return;
    }
    clearLineAdvanceTimer();
    setTrainingUiPhase("course");
    setTrainingSession(() => ({
      trackId: track.id,
      lessonIndex: idx,
      selectedChoice: null,
      revealed: false,
      lineStepIndex: 0,
      variationSelections: nextVariationSelections,
    }));
  }

  function jumpToLessonIndex(lessonIndex: number) {
    if (!activeTrack) return;
    if (lessonIndex < 0 || lessonIndex >= activeCourseLessons.length) return;
    clearLineAdvanceTimer();
    setTrainingUiPhase("course");
    setTrainingSession((current) => ({
      trackId: activeTrack.id,
      lessonIndex,
      selectedChoice: null,
      revealed: false,
      lineStepIndex: 0,
      variationSelections: current.variationSelections,
    }));
  }

  function startNextAssignedLesson() {
    if (!assignedTrackId) return;
    const track = trainingTracks.find((t) => t.id === assignedTrackId);
    if (!track) return;
    const nextIdx = getFirstDueIndex(track.lessons, progress.lessonStats);
    clearLineAdvanceTimer();
    setTrainingUiPhase("course");
    setFocusMode(true);
    setDashboardTab("training");
    setTrainingSession((current) => ({
      trackId: track.id,
      lessonIndex: nextIdx,
      selectedChoice: null,
      revealed: false,
      lineStepIndex: 0,
      variationSelections: current.variationSelections,
    }));
    window.setTimeout(() => {
      document.getElementById("training-course")?.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
    }, 80);
  }

  function startNextChapterLesson() {
    if (!activeTrack || nextChapterLessonIndex == null) return;
    jumpToLessonIndex(nextChapterLessonIndex);
  }

  const openTacticsSession = useCallback(async () => {
    if (!activeDashboard) return;
    setAccountError(null);
    const tacticQuest = activeDashboard.questProgress?.quests.find((q) => q.kind === "tactics");
    const n = tacticQuest?.target ?? 3;
    let list: DailyPuzzle[] = [];
    try {
      const response = await fetch(`/api/puzzles/batch?count=${n}`);
      if (response.ok) {
        const payload = (await response.json()) as { puzzles?: DailyPuzzle[] };
        const remote = payload.puzzles ?? [];
        if (remote.length >= n) {
          list = remote.slice(0, n);
        } else if (remote.length > 0) {
          list = [
            ...remote,
            ...pickDailyTacticsPuzzles(activeDashboard.profile.rating, activeDashboard.profile.puzzleDiagnostic, n - remote.length),
          ];
        }
      }
    } catch {
      // fall through to static pool
    }
    if (!list.length) {
      list = pickDailyTacticsPuzzles(activeDashboard.profile.rating, activeDashboard.profile.puzzleDiagnostic, n);
    }
    if (!list.length) {
      setAccountError("No tactics puzzles available for this profile yet — try again after onboarding.");
      return;
    }
    setTacticsSessionPuzzles(list);
    setTacticsModalOpen(true);
  }, [activeDashboard]);

  const handleTacticsPuzzleSolved = useCallback(() => {
    setSavedDashboard((d) => (d ? incrementTacticsQuest(d) : d));
  }, []);

  function toggleLightDayQuests() {
    if (!activeDashboard) return;
    const due = countDueLessons(trainingTracks, activeDashboard.trainingProgress.lessonStats);
    const day = calendarDayKey(new Date(), activeDashboard.profile.questDayTimezone ?? "UTC");
    const currentLight =
      activeDashboard.questProgress?.dayKey === day
        ? activeDashboard.questProgress.lightMode
        : Boolean(activeDashboard.profile.prefersLightDaysDefault);
    setSavedDashboard(
      ensureDailyQuestBoard(activeDashboard, {
        isPaidPlan: isPaidPlan(selectedPlan),
        lightMode: !currentLight,
        dueLessonCount: due,
      }),
    );
  }

  function rerollPaidQuests() {
    if (!activeDashboard) return;
    const due = countDueLessons(trainingTracks, activeDashboard.trainingProgress.lessonStats);
    const qp = activeDashboard.questProgress;
    if (!qp) return;
    setSavedDashboard(
      ensureDailyQuestBoard(activeDashboard, {
        isPaidPlan: isPaidPlan(selectedPlan),
        lightMode: qp.lightMode,
        dueLessonCount: due,
        reroll: true,
      }),
    );
  }

  if (!hydrated) {
    return (
      <div className={styles.pageShell}>
        <main>
          <section className={styles.panel}>
            <div className={styles.sectionHeading}>
              <p className={styles.eyebrow}>Knightneo</p>
              <h2>Loading your training dashboard…</h2>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.pageShell}>
      <header className={styles.hero}>
        <nav className={styles.topbar}>
          <div className={styles.brand}>
            <span className={styles.brandMark}>K</span>
            <span className={styles.brandName}>Knightneo</span>
          </div>
          <div className={styles.topbarLinks}>
            <Link href="/" className={styles.ghostLink}>
              Home
            </Link>
            <Link href="/pricing" className={styles.ghostLink}>
              Pricing
            </Link>
            <Link href="/quiz" className={styles.ghostLink}>
              Quiz
            </Link>
            <Link href="/today" className={styles.ghostLink}>
              Today
            </Link>
            <Link href="/analysis" className={styles.ghostLink}>
              Analysis
            </Link>
            <Link href="/coach" className={styles.ghostLink}>
              Chess coach
            </Link>
            {activeDashboard ? (
              <a href="#dashboard" className={styles.ghostLink}>
                Dashboard
              </a>
            ) : null}
            {isLoaded && isSignedIn ? (
              <UserButton />
            ) : (
              <Link href="/sign-in" className={styles.ghostLink}>
                Sign in
              </Link>
            )}
          </div>
        </nav>
      </header>

      <main>
        {!isPaidPlan(selectedPlan) ? (
          <section className={styles.upgradeStrip} aria-label="Upgrade">
            <div className={styles.upgradeStripInner}>
              <div>
                <p className={styles.upgradeStripTitle}>Free plan</p>
                <p className={styles.upgradeStripCopy}>
                  Main-line board drills and core lessons are included. Subscribe for every branch, Stockfish on lessons, deeper review, and full game
                  analysis.
                </p>
              </div>
              <div className={styles.upgradeStripActions}>
                <button type="button" className={`${styles.button} ${styles.buttonPrimary}`} onClick={() => void startCheckout("month")}>
                  $9.99/mo
                </button>
                <button type="button" className={`${styles.button} ${styles.buttonSecondary}`} onClick={() => void startCheckout("year")}>
                  $99.99/yr
                </button>
                <Link href="/pricing" className={`${styles.button} ${styles.buttonSecondary}`}>
                  Pricing
                </Link>
              </div>
            </div>
            {accountError ? <p className={styles.accountError}>{accountError}</p> : null}
            {isLoaded && isSignedIn && ADMIN_UNLOCK_ENABLED ? (
              <details className={styles.adminUnlockDetails}>
                <summary>Admin unlock</summary>
                <div className={styles.adminUnlockRow}>
                  <input
                    type="password"
                    value={adminCodeInput}
                    onChange={(event) => setAdminCodeInput(event.target.value)}
                    placeholder="Admin code"
                  />
                  <button type="button" className={`${styles.button} ${styles.buttonSecondary}`} onClick={() => void applyAdminCode()}>
                    Apply
                  </button>
                </div>
                {adminCodeMessage ? <p className={styles.adminUnlockMessage}>{adminCodeMessage}</p> : null}
              </details>
            ) : null}
          </section>
        ) : null}
        {!activeDashboard || showQuizForm ? (
        <section id="quiz" className={styles.panel}>
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>Onboarding</p>
            <h2>Build your repertoire</h2>
          </div>

          <form className={styles.quizForm} onSubmit={handleSubmit}>
            <div className={styles.questionBlock}>
              <label htmlFor="rating">Your current rating</label>
              <select id="rating" value={profile.rating} onChange={(event) => updateField("rating", event.target.value as RatingBand)}>
                <option value="beginner">Under 800</option>
                <option value="developing">800-1199</option>
                <option value="improving">1200-1599</option>
                <option value="advanced">1600+</option>
              </select>
            </div>

            <QuestionGroup
              label="1. What kind of positions do you enjoy most?"
              name="positionType"
              value={profile.positionType}
              onChange={(value) => updateField("positionType", value as PositionType)}
              options={[
                { value: "open", label: "Open and active" },
                { value: "mixed", label: "A healthy mix" },
                { value: "closed", label: "Closed and strategic" },
              ]}
            />

            <QuestionGroup
              label="2. How much opening theory are you willing to learn?"
              name="theory"
              value={profile.theory}
              onChange={(value) => updateField("theory", value as TheoryLevel)}
              options={[
                { value: "low", label: "Very little" },
                { value: "medium", label: "Some, if worth it" },
                { value: "high", label: "I do not mind depth" },
              ]}
            />

            <QuestionGroup
              label="3. What sounds more like you?"
              name="risk"
              value={profile.risk}
              onChange={(value) => updateField("risk", value as RiskLevel)}
              options={[
                { value: "sharp", label: "I like pressure and attacks" },
                { value: "balanced", label: "I can do either" },
                { value: "solid", label: "I want reliable positions" },
              ]}
            />

            <QuestionGroup
              label="4. What time control do you play most?"
              name="timeControl"
              value={profile.timeControl}
              onChange={(value) => updateField("timeControl", value as TimeControl)}
              options={[
                { value: "bullet", label: "Bullet / blitz" },
                { value: "rapid", label: "Rapid" },
                { value: "classical", label: "Longer games" },
              ]}
            />

            <QuestionGroup
              label="5. What do you want from your openings right now?"
              name="goal"
              value={profile.goal}
              onChange={(value) => updateField("goal", value as Goal)}
              options={[
                { value: "initiative", label: "Early initiative" },
                { value: "clarity", label: "Simple plans" },
                { value: "counterplay", label: "Strong counterplay" },
              ]}
            />

            <div className={styles.questionBlock}>
              <label htmlFor="dailyStudyMinutes">6. Realistic study time per day</label>
              <p className={styles.resultsSummaryMuted} style={{ marginTop: 4 }}>
                Drives how many daily quests and tactics we suggest (you can still use a &quot;light day&quot; on the dashboard).
              </p>
              <select
                id="dailyStudyMinutes"
                value={profile.dailyStudyMinutes}
                onChange={(event) => updateField("dailyStudyMinutes", Number(event.target.value) as DailyStudyMinutes)}
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
                <option value={90}>90 minutes</option>
              </select>
            </div>

            <div className={styles.questionBlock}>
              <label htmlFor="questDayTimezone">Quest calendar timezone</label>
              <p className={styles.resultsSummaryMuted} style={{ marginTop: 4 }}>
                Daily quests use midnight in this IANA zone to start a new day (UTC is the default).
              </p>
              <select
                id="questDayTimezone"
                value={profile.questDayTimezone ?? "UTC"}
                onChange={(event) => {
                  const v = event.target.value;
                  updateField("questDayTimezone", v === "UTC" ? undefined : v);
                }}
              >
                {QUEST_TIMEZONE_OPTIONS.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.questionBlock}>
              <label>
                <input
                  type="checkbox"
                  checked={Boolean(profile.prefersLightDaysDefault)}
                  onChange={(event) => updateField("prefersLightDaysDefault", event.target.checked)}
                />{" "}
                Prefer light daily quests by default (smaller board — you can toggle per day)
              </label>
            </div>

            <OnboardingDiagnosticStrip
              key={`diag-${profile.rating}`}
              puzzles={onboardingPuzzles}
              onComplete={(summary) => setDiagnosticSummary(summary)}
            />

            <div className={styles.questionBlock}>
              <p>7. Optional Chess.com username</p>
              <label htmlFor="username" className={styles.assistiveLabel}>
                Knightneo will blend recent public games into the recommendation and training path.
              </label>
              <input id="username" type="text" placeholder="e.g. hikaru" value={profile.username ?? ""} onChange={(event) => updateField("username", event.target.value)} />
            </div>

            <button type="submit" className={`${styles.button} ${styles.buttonPrimary} ${styles.buttonWide}`}>
              {isPending ? "Analyzing games..." : "Build my repertoire"}
            </button>
            {activeDashboard ? (
              <button type="button" className={`${styles.button} ${styles.buttonSecondary}`} onClick={() => setShowQuizForm(false)}>
                Back to training
              </button>
            ) : null}
            <p style={{ marginTop: 10, opacity: 0.85 }}>
              Sign in to sync progress across devices. Core opening training runs on the free tier; subscriptions unlock deeper branches, Stockfish on
              lessons, and full-game analysis.
            </p>
          </form>
        </section>
        ) : null}

        {activeDashboard ? (
          <section id="dashboard" className={styles.panel}>
            <div className={styles.sectionHeading}>
              <p className={styles.eyebrow}>Dashboard</p>
              <h2>Your corner of the repertoire—saved, synced, ready when you are</h2>
            </div>
            {prepFlowStep > 0 ? (
              <nav className={styles.flowRibbon} aria-label="Prep journey">
                <ol className={styles.flowRibbonList}>
                  {[
                    { n: 1, label: "Onboarding" },
                    { n: 2, label: "Suggested openings" },
                    { n: 3, label: "Pick track" },
                    { n: 4, label: "Branch on board" },
                    { n: 5, label: "Lesson drills" },
                  ].map((step) => {
                    const done = prepFlowStep > step.n;
                    const current = prepFlowStep === step.n;
                    return (
                      <li
                        key={step.n}
                        className={`${styles.flowStep} ${done ? styles.flowStepDone : ""} ${current ? styles.flowStepCurrent : ""}`}
                        aria-current={current ? "step" : undefined}
                      >
                        <span className={styles.flowStepMark} aria-hidden>
                          {done ? "✓" : step.n}
                        </span>
                        <span className={styles.flowStepLabel}>{step.label}</span>
                      </li>
                    );
                  })}
                </ol>
              </nav>
            ) : null}
            <div className={styles.dashboardTabs}>
              <button type="button" className={`${styles.dashboardTab} ${dashboardTab === "overview" ? styles.dashboardTabActive : ""}`} onClick={() => setDashboardTab("overview")}>
                Overview
              </button>
              <button type="button" className={`${styles.dashboardTab} ${dashboardTab === "openings" ? styles.dashboardTabActive : ""}`} onClick={() => setDashboardTab("openings")}>
                Openings
              </button>
              <button type="button" className={`${styles.dashboardTab} ${dashboardTab === "training" ? styles.dashboardTabActive : ""}`} onClick={() => setDashboardTab("training")}>
                Training
              </button>
            </div>

            {dashboardTab === "overview" ? (
              <>
            <div className={styles.dashboardGrid}>
              <article className={styles.metricCard}>
                <p className={styles.metricLabel}>Current style</p>
                <h3>{describeStyle(activeDashboard.profile)}</h3>
                <p>{describeGoal(activeDashboard.profile.goal)}</p>
              </article>
              <article className={styles.metricCard}>
                <p className={styles.metricLabel}>Training streak</p>
                <h3>{progress.streak} day{progress.streak === 1 ? "" : "s"}</h3>
                <p>{progress.xp} XP earned</p>
              </article>
              <article className={styles.metricCard}>
                <p className={styles.metricLabel}>Current plan</p>
                <h3>{formatPlanLabel(selectedPlan)}</h3>
                <p>{progress.completedLessons.length} lessons marked complete</p>
              </article>
            </div>

            {activeDashboard.questProgress &&
            activeDashboard.questProgress.dayKey ===
              calendarDayKey(new Date(), activeDashboard.profile.questDayTimezone ?? "UTC") ? (
              <div className={styles.statusCard}>
                <p className={styles.statusTitle}>
                  Today&apos;s quests ({activeDashboard.profile.questDayTimezone ?? "UTC"} calendar)
                </p>
                <p className={styles.resultsSummaryMuted} style={{ marginTop: 0 }}>
                  Quests reset at midnight in your quest timezone. Light day halves targets — good for recovery sessions.
                </p>
                <label style={{ display: "flex", alignItems: "flex-start", gap: 10, margin: "12px 0 16px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={activeDashboard.questProgress.lightMode}
                    onChange={toggleLightDayQuests}
                    style={{ marginTop: 3 }}
                  />
                  <span>Light day (regenerates today&apos;s board with smaller targets)</span>
                </label>
                {isPaidPlan(selectedPlan) ? (
                  <div style={{ marginBottom: 14 }}>
                    <button
                      type="button"
                      className={`${styles.button} ${styles.buttonSecondary}`}
                      onClick={rerollPaidQuests}
                      disabled={(activeDashboard.questProgress.rerollsUsed ?? 0) >= 1}
                    >
                      Reroll today&apos;s quests (paid · once per day)
                    </button>
                    {(activeDashboard.questProgress.rerollsUsed ?? 0) >= 1 ? (
                      <p className={styles.resultsSummaryMuted} style={{ marginTop: 6 }}>
                        Reroll used for this calendar day.
                      </p>
                    ) : null}
                  </div>
                ) : null}
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 14 }}>
                  {activeDashboard.questProgress.quests.map((q) => {
                    const pct = q.target > 0 ? Math.min(100, Math.round((q.progress / q.target) * 100)) : 0;
                    return (
                      <li key={q.id}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
                          <strong>{q.title}</strong>
                          <span style={{ fontSize: "0.88rem", opacity: 0.85 }}>
                            {q.progress}/{q.target} · +{q.xpReward} XP {q.completed ? "· done" : ""}
                          </span>
                        </div>
                        <p style={{ margin: "4px 0 6px", fontSize: "0.9rem", opacity: 0.88 }}>{q.description}</p>
                        <div
                          style={{
                            height: 8,
                            borderRadius: 999,
                            background: "rgba(0,0,0,0.08)",
                            overflow: "hidden",
                          }}
                        >
                          <div style={{ width: `${pct}%`, height: "100%", background: q.completed ? "#2f9e6b" : "#4c6ef5" }} />
                        </div>
                        <div style={{ marginTop: 8 }}>
                          {q.kind === "tactics" && !q.completed ? (
                            <button type="button" className={`${styles.button} ${styles.buttonPrimary}`} onClick={() => void openTacticsSession()}>
                              Open tactics session
                            </button>
                          ) : null}
                          {q.kind !== "tactics" && !q.completed ? (
                            <button
                              type="button"
                              className={`${styles.button} ${styles.buttonSecondary}`}
                              onClick={() => {
                                setDashboardTab("training");
                                setTrainingUiPhase("pick");
                                scrollDashboardIntoView();
                              }}
                            >
                              Go to training
                            </button>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}

            <div className={styles.resultsSummary}>
              <p>
                <strong>{describeStyle(activeDashboard.profile)}</strong> · {describeGoal(activeDashboard.profile.goal)}
                {activeDashboard.insights ? (
                  <> · {activeDashboard.insights.gamesAnalyzed} games analyzed ({activeDashboard.insights.username})</>
                ) : null}
              </p>
              <p className={styles.resultsSummaryMuted}>
                {accountUser ? "Progress syncs with your account." : "Sign in to sync progress across devices."}
              </p>
              <div className={styles.heroActions} style={{ marginTop: 8 }}>
                <button type="button" className={`${styles.button} ${styles.buttonPrimary}`} onClick={startNextAssignedLesson}>
                  Continue training
                </button>
                <button
                  type="button"
                  className={`${styles.button} ${styles.buttonSecondary}`}
                  onClick={() => {
                    if (activeDashboard) {
                      setProfile({ ...defaultQuizProfile(), ...activeDashboard.profile });
                    }
                    setDiagnosticSummary(null);
                    setShowQuizForm(true);
                  }}
                >
                  Edit quiz answers
                </button>
              </div>
            </div>
            <div className={styles.statusCard}>
              <p className={styles.statusTitle}>Weekly training goal</p>
              <p>
                {weeklyCompletedCount}/{weeklyGoal} lessons reviewed this week.
                {weeklyCompletedCount >= weeklyGoal ? " Goal hit - keep your streak alive." : " Keep going to hit your weekly target."}
              </p>
              <p>
                Next milestone: {milestoneProgress.next} completed lessons ({milestoneProgress.done} done).
              </p>
            </div>

            {isPending ? (
              <div className={styles.statusCard}>
                <p className={styles.statusTitle}>Analyzing Chess.com games</p>
                <p>Knightneo is comparing your real opening habits against the quiz profile.</p>
              </div>
            ) : null}

            {analysisError ? (
              <div className={`${styles.statusCard} ${styles.statusCardWarning}`}>
                <p className={styles.statusTitle}>Using quiz-only fallback</p>
                <p>{analysisError}</p>
              </div>
            ) : null}

            {activeDashboard.insights ? (
              <div className={styles.insightsGrid}>
                <InsightCard title="White habits" lines={formatComparisonLines(activeDashboard.insights.whiteTopOpenings, activeDashboard.insights.whiteBestScoring)} />
                <InsightCard title="Black vs 1.e4" lines={formatComparisonLines(activeDashboard.insights.blackVsE4TopDefenses, activeDashboard.insights.blackVsE4BestScoring)} />
                <InsightCard title="Black vs 1.d4" lines={formatComparisonLines(activeDashboard.insights.blackVsD4TopDefenses, activeDashboard.insights.blackVsD4BestScoring)} />
              </div>
            ) : null}
              </>
            ) : null}

            {dashboardTab === "openings" ? (
              <div id="openings-showcase" className={styles.openingsShowcase}>
                <header className={styles.openingsShowcaseHeader}>
                  <p className={styles.eyebrow}>Your three lines</p>
                  <h3 className={styles.openingsShowcaseTitle}>Why these openings fit you</h3>
                  <p className={styles.trainingIntro}>
                    Knightneo ranked these systems from your quiz (and Chess.com stats when provided). Read the rationale, then open
                    the lesson path for the one you want to install first—you can train all three over time.
                  </p>
                </header>
                <div className={styles.recommendationGrid}>
                  <ResultCard
                    label="White"
                    opening={activeDashboard.repertoire.white}
                    dark={false}
                    onTrain={() => beginTrack("white")}
                  />
                  <ResultCard
                    label="Black vs 1.e4"
                    opening={activeDashboard.repertoire.blackE4}
                    dark
                    onTrain={() => beginTrack("black-e4")}
                  />
                  <ResultCard
                    label="Black vs 1.d4"
                    opening={activeDashboard.repertoire.blackD4}
                    dark
                    onTrain={() => beginTrack("black-d4")}
                  />
                </div>
              </div>
            ) : null}

            {dashboardTab === "openings" ? <section className={styles.trainingPanel}>
              <div className={styles.trainingHeader}>
                <div>
                  <p className={styles.eyebrow}>Game coach moved</p>
                  <h3>Dedicated analysis workspace</h3>
                  <p className={styles.trainingIntro}>
                    Game analysis now lives on its own page so your quiz, line primer, and variation selection flow stay focused and easier to follow.
                  </p>
                </div>
              </div>
              <div className={styles.heroActions}>
                <Link href="/analysis" className={`${styles.button} ${styles.buttonPrimary}`}>
                  Open analysis workspace
                </Link>
              </div>
            </section> : null}

            {dashboardTab === "training" ? <section className={styles.trainingPanel} id="training-course">
              {trainingUiPhase === "pick" ? (
                <>
                  <div className={styles.trainingHeader}>
                    <div>
                      <p className={styles.eyebrow}>Training</p>
                      <h3>Pick an opening</h3>
                      <p className={styles.trainingIntro}>
                        Choose <strong>one</strong> opening to focus now (White, vs 1.e4, or vs 1.d4). You will see context, a line primer,
                        branch choice, then chapter drills—switch paths anytime from the tabs inside a course.
                      </p>
                    </div>
                    <div className={styles.trainingStats}>
                      <span>{progress.completedLessons.length} done</span>
                      <span>{progress.xp} XP</span>
                    </div>
                  </div>
                  <div className={styles.trainingToolbar}>
                    <button
                      type="button"
                      className={`${styles.button} ${styles.buttonSecondary}`}
                      onClick={() => setFocusMode((prev) => !prev)}
                    >
                      {focusMode ? "Focus: one track" : "Focus: off"}
                    </button>
                    <button
                      type="button"
                      className={`${styles.button} ${styles.buttonSecondary}`}
                      onClick={() => setEndlessMode((prev) => !prev)}
                    >
                      {endlessMode ? "Endless review" : "Linear order"}
                    </button>
                  </div>
                  <div className={styles.trackGrid}>
                    {(focusMode && assignedTrackId ? trainingTracks.filter((track) => track.id === assignedTrackId) : trainingTracks).map((track) => (
                      <button
                        key={track.id}
                        type="button"
                        className={styles.trackCard}
                        onClick={() => beginTrack(track.id)}
                      >
                        <span className={styles.trackBadge}>{track.label}</span>
                        <span className={styles.trackCardTitle}>{track.opening.name}</span>
                        <span className={styles.trackCardBlurb}>{track.headline}</span>
                        <span className={styles.trackPlanHint}>
                          {getTrackCompletion(track.lessons, progress.completedLessons)}% · {track.lessons.length} steps
                        </span>
                        <span className={styles.trackDueText}>{getTrackDueSummary(track.lessons, progress.lessonStats)}</span>
                      </button>
                    ))}
                  </div>
                  <div className={styles.trainingToolbar}>
                    <button type="button" className={`${styles.button} ${styles.buttonSecondary}`} onClick={() => setShowPickExtras((v) => !v)}>
                      {showPickExtras ? "Hide extra panels" : "Show extra panels"}
                    </button>
                  </div>
                  {showPickExtras ? (
                    <>
                      <details className={styles.trainingDetails} open>
                        <summary>Review queue (due lessons)</summary>
                        <ul className={styles.drillList}>
                          {getGlobalReviewQueue(trainingTracks, progress.lessonStats)
                            .slice(0, 8)
                            .map((entry) => (
                              <li key={`${entry.trackId}-${entry.lesson.id}`}>
                                <button type="button" className={styles.drillJumpButton} onClick={() => jumpToTrackLesson(entry.trackId, entry.lesson.id)}>
                                  {entry.trackLabel}: {entry.lesson.title}
                                </button>
                              </li>
                            ))}
                        </ul>
                        {getGlobalReviewQueue(trainingTracks, progress.lessonStats).length === 0 ? (
                          <p className={styles.drillEmpty}>No due reps yet.</p>
                        ) : null}
                      </details>
                      <details className={styles.trainingDetails}>
                        <summary>Training telemetry (local)</summary>
                        <ul className={styles.drillList}>
                          {getWeakLessonEntries(progress.lessonStats)
                            .slice(0, 6)
                            .map((entry) => (
                              <li key={entry.lessonId}>
                                <span>
                                  {entry.lessonId}: {(entry.accuracy * 100).toFixed(0)}% ({entry.correct}/{entry.attempts})
                                </span>
                              </li>
                            ))}
                        </ul>
                        {getWeakLessonEntries(progress.lessonStats).length === 0 ? (
                          <p className={styles.drillEmpty}>No telemetry yet — complete a few lessons.</p>
                        ) : null}
                      </details>
                    </>
                  ) : null}
                </>
              ) : activeTrack ? (
                <div className={styles.courseShell}>
                  <div className={styles.courseTopBar}>
                    <div className={styles.courseHeader}>
                      <button type="button" className={styles.courseBackButton} onClick={exitTrainingCourse}>
                        ← All openings
                      </button>
                      <div className={styles.courseHeaderMain}>
                        <h3 className={styles.courseTitle}>{activeTrack.opening.name}</h3>
                        {trainingTracks.length > 1 ? (
                          <div className={styles.coursePathSwitcher} role="tablist" aria-label="Opening paths">
                            {trainingTracks.map((t) => (
                              <button
                                key={t.id}
                                type="button"
                                role="tab"
                                aria-selected={t.id === activeTrack.id}
                                className={`${styles.coursePathTab} ${t.id === activeTrack.id ? styles.coursePathTabActive : ""}`}
                                onClick={() => beginTrack(t.id)}
                              >
                                {t.label}
                              </button>
                            ))}
                          </div>
                        ) : null}
                        <div className={styles.trainingStats}>
                          <span>{getTrackCompletion(activeCourseLessons, progress.completedLessons)}%</span>
                          <span>{progress.xp} XP</span>
                        </div>
                      </div>
                    </div>
                    <div className={styles.trainingToolbar}>
                      <button
                        type="button"
                        className={`${styles.button} ${styles.buttonSecondary}`}
                        onClick={() => setFocusMode((prev) => !prev)}
                      >
                        {focusMode ? "One track" : "All tracks"}
                      </button>
                      <button
                        type="button"
                        className={`${styles.button} ${styles.buttonSecondary}`}
                        onClick={() => setEndlessMode((prev) => !prev)}
                      >
                        {endlessMode ? "Endless" : "Linear"}
                      </button>
                      <button
                        type="button"
                        className={`${styles.button} ${styles.buttonPrimary}`}
                        disabled={nextChapterLessonIndex == null}
                        onClick={startNextChapterLesson}
                      >
                        {nextChapterLessonIndex == null ? "Done" : "Next"}
                      </button>
                    </div>
                    {chapterCelebration ? (
                      <div className={styles.chapterCelebrationBanner} role="status">
                        <p>{chapterCelebration}</p>
                        <button
                          type="button"
                          className={styles.chapterCelebrationDismiss}
                          onClick={() => {
                            if (chapterCelebrationTimerRef.current != null) window.clearTimeout(chapterCelebrationTimerRef.current);
                            chapterCelebrationTimerRef.current = null;
                            setChapterCelebration(null);
                          }}
                        >
                          OK
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <div className={styles.courseSplit}>
                    <aside className={styles.pathSidebar} aria-label="Lesson path">
                      <div className={styles.duolingoPath}>
                        {groupLessonsByChapter(activeCourseLessons).map((group) => (
                          <div key={`${group.name}-${group.startIndex}`} className={styles.pathChapterBlock}>
                            <div className={styles.pathChapterLabel}>{group.name}</div>
                            <div className={styles.pathChapterSteps}>
                              {group.items.map(({ lesson, index }) => {
                                const isCompleted = progress.completedLessons.includes(lesson.id);
                                const isCurrent = index === trainingSession.lessonIndex;
                                const previousLessonId = index > 0 ? activeCourseLessons[index - 1]?.id : null;
                                const chapterUnlocked = isChapterUnlocked(
                                  getLessonChapter(lesson),
                                  activeCourseLessons,
                                  progress.completedLessons,
                                );
                                const mainlineJump =
                                  getLessonChapter(lesson) === "Mainline" &&
                                  isChapterUnlocked("Mainline", activeCourseLessons, progress.completedLessons);
                                const isUnlocked =
                                  chapterUnlocked &&
                                  (mainlineJump ||
                                    index === 0 ||
                                    isCompleted ||
                                    isCurrent ||
                                    (previousLessonId ? progress.completedLessons.includes(previousLessonId) : false));
                                const isBoardLesson = Boolean(lesson.line?.steps?.length || lesson.board);
                                return (
                                  <div key={lesson.id} className={styles.pathStepRow}>
                                    <button
                                      type="button"
                                      disabled={!isUnlocked}
                                      onClick={() => jumpToLessonIndex(index)}
                                      className={`${styles.pathStepOrb} ${isCurrent ? styles.pathStepCurrent : ""} ${isCompleted ? styles.pathStepDone : ""} ${!isUnlocked ? styles.pathStepLocked : ""}`}
                                      title={lesson.title}
                                    >
                                      <span className={styles.pathStepGlyph}>{isCompleted ? "✓" : isUnlocked ? (isBoardLesson ? "♟" : "?") : "•"}</span>
                                    </button>
                                    <div className={styles.pathStepCaption}>
                                      <span className={styles.pathStepTitle}>{lesson.title}</span>
                                      <span className={styles.pathStepMeta}>{isBoardLesson ? "Board" : "Quiz"}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>

                      {activeTrack && activeDashboard && canUsePremiumReview ? (
                        <details className={styles.trainingDetails}>
                          <summary>Replay lines</summary>
                          <ul className={styles.drillList}>
                            {activeCourseLessons
                              .filter((l) => l.line?.steps?.length && progress.completedLessons.includes(l.id))
                              .map((l) => (
                                <li key={l.id}>
                                  <button type="button" className={styles.drillJumpButton} onClick={() => jumpToLessonById(l.id)}>
                                    {l.title}
                                  </button>
                                </li>
                              ))}
                          </ul>
                          {!activeCourseLessons.some((l) => l.line?.steps?.length && progress.completedLessons.includes(l.id)) ? (
                            <p className={styles.drillEmpty}>Complete a line drill first.</p>
                          ) : null}
                        </details>
                      ) : null}

                      {activeTrack && canUsePremiumStudies ? (
                        <details className={styles.trainingDetails}>
                          <summary>Notes</summary>
                          <div className={styles.studyGrid}>
                            {(activeTrack.studies ?? []).map((study) => (
                              <article key={study} className={styles.studyCard}>
                                <p>{study}</p>
                              </article>
                            ))}
                          </div>
                        </details>
                      ) : null}
                    </aside>

                    <div className={styles.lessonStudio}>
                      {trainingUiPhase === "intro" && activeTrack ? (
                        <div className={styles.lessonShell}>
                          <div className={styles.lessonMeta}>
                            <span className={styles.lessonTag}>{activeTrack.label}</span>
                            <span className={styles.lessonTagMuted}>{activeTrack.opening.name}</span>
                          </div>
                          <h4 className={styles.lessonTitle}>Why you’re studying this now</h4>
                          <p className={styles.introLede}>{activeTrack.intro?.whyThisOpening ?? activeTrack.headline}</p>
                          <details className={styles.openingIntroDetails}>
                            <summary>Go deeper</summary>
                            <div className={styles.openingIntroBlock}>
                              <h5>Where it comes from</h5>
                              <p>{activeTrack.intro?.history ?? `${activeTrack.opening.name} stays viable across eras of prep.`}</p>
                            </div>
                            <div className={styles.openingIntroBlock}>
                              <h5>Why it fits you</h5>
                              <p>{activeTrack.intro?.viability}</p>
                              {recommendationReasons.length ? (
                                <ul className={styles.openingReasonList}>
                                  {recommendationReasons.map((reason) => (
                                    <li key={reason}>{reason}</li>
                                  ))}
                                </ul>
                              ) : null}
                            </div>
                          </details>
                          <div className={styles.lessonCompleteActions}>
                            <button type="button" className={`${styles.button} ${styles.buttonPrimary}`} onClick={continueToLinePrimer}>
                              Next: how you’ll play it
                            </button>
                          </div>
                        </div>
                      ) : trainingUiPhase === "linePrimer" && activeTrack ? (
                        <div className={styles.lessonShell}>
                          <div className={styles.lessonMeta}>
                            <span className={styles.lessonTag}>Line fundamentals</span>
                            <span className={styles.lessonTagMuted}>{activeTrack.opening.name}</span>
                          </div>
                          <h4 className={styles.lessonTitle}>See each branch on the board</h4>
                          <p className={styles.lessonPrompt}>
                            Open a card: the mini-board shows the tabiya after the first moves of that branch. Read the plan text, then continue to
                            pick the line you want to drill.
                          </p>
                          <div className={styles.variationGrid}>
                            {(activeTrack.variations ?? []).map((variation) => (
                              <details key={`primer-${variation.id}`} className={styles.variationPrimerCard}>
                                <summary className={styles.variationPrimerSummary}>
                                  <span className={styles.statusTitle}>{variation.label}</span>
                                  <span className={styles.variationMetaInline}>
                                    {variation.style} · {variation.risk} risk
                                  </span>
                                </summary>
                                <div className={styles.variationPrimerBody}>
                                  {variation.previewFen ? (
                                    <div className={styles.variationPreviewAside}>
                                      <OpeningPreviewBoard
                                        fen={variation.previewFen}
                                        orientation={activeTrack.id === "white" ? "white" : "black"}
                                        movesCaption={variation.previewMovesSan ? `First plies: ${variation.previewMovesSan}` : undefined}
                                      />
                                    </div>
                                  ) : null}
                                  <div className={styles.variationPrimerCopy}>
                                    <p>{variation.summary}</p>
                                    <p className={styles.variationMeta}>
                                      {variation.theoryLoad} theory · {variation.timeControlFit}
                                    </p>
                                    <p className={styles.variationMeta}>{variation.tempo}</p>
                                    <p className={styles.variationMeta}>{variation.sampleLine}</p>
                                    <ul className={styles.openingReasonList}>
                                      {variation.middlegamePlans.slice(0, 2).map((plan) => (
                                        <li key={`${variation.id}-${plan}`}>{plan}</li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              </details>
                            ))}
                          </div>
                          <div className={styles.lessonCompleteActions}>
                            <button type="button" className={`${styles.button} ${styles.buttonPrimary}`} onClick={continueToVariationSelection}>
                              Next: choose your branch
                            </button>
                          </div>
                        </div>
                      ) : trainingUiPhase === "variationSelect" && activeTrack ? (
                        <div className={styles.lessonShell}>
                          <div className={styles.lessonMeta}>
                            <span className={styles.lessonTag}>Variation choice</span>
                            <span className={styles.lessonTagMuted}>{activeTrack.opening.name}</span>
                          </div>
                          <h4 className={styles.lessonTitle}>Pick the branch you’ll drill</h4>
                          <p className={styles.lessonPrompt}>
                            Each card shows the same tabiya you previewed—tap the line that matches how you want to play this opening.
                          </p>
                          {recommendedVariation ? (
                            <div className={styles.variationRecommended}>
                              <p className={styles.statusTitle}>We’d start you here</p>
                              <h5>{recommendedVariation.label}</h5>
                              <p>{recommendedVariation.summary}</p>
                              {recommendationReasons.length ? (
                                <ul className={styles.openingReasonList}>
                                  {recommendationReasons.map((reason) => (
                                    <li key={`rec-${reason}`}>{reason}</li>
                                  ))}
                                </ul>
                              ) : null}
                            </div>
                          ) : null}
                          <div className={styles.variationGrid}>
                            {(activeTrack.variations ?? []).map((variation) => {
                              const isSelected = (selectedVariationId ?? recommendedVariation?.id) === variation.id;
                              return (
                                <button
                                  key={variation.id}
                                  type="button"
                                  className={`${styles.variationCard} ${isSelected ? styles.variationCardSelected : ""}`}
                                  onClick={() => applyVariationSelection(variation.id)}
                                >
                                  <div className={styles.variationCardInner}>
                                    <div className={styles.variationCardBody}>
                                      <p className={styles.statusTitle}>{variation.label}</p>
                                      <p>{variation.summary}</p>
                                      <p className={styles.variationMeta}>
                                        {variation.style} · {variation.risk} risk · {variation.theoryLoad} theory
                                      </p>
                                      <p className={styles.variationMeta}>{variation.tempo}</p>
                                      <p className={styles.variationMeta}>{variation.timeControlFit}</p>
                                    </div>
                                    {variation.previewFen ? (
                                      <OpeningPreviewBoard
                                        fen={variation.previewFen}
                                        orientation={activeTrack.id === "white" ? "white" : "black"}
                                        movesCaption={variation.previewMovesSan ? `First plies: ${variation.previewMovesSan}` : undefined}
                                      />
                                    ) : null}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                          <div className={styles.lessonCompleteActions}>
                            {selectedVariation ? (
                              <p className={styles.lessonCompleteHint}>
                                {recommendedVariation && selectedVariation.id === recommendedVariation.id ? (
                                  <>
                                    You picked <strong>{selectedVariation.label}</strong> — it aligns with your quiz profile and tempo.
                                  </>
                                ) : (
                                  <>
                                    You picked <strong>{selectedVariation.label}</strong>. Drills will follow the lessons mapped to this branch.
                                  </>
                                )}
                              </p>
                            ) : null}
                            <button type="button" className={`${styles.button} ${styles.buttonPrimary}`} onClick={startCourseFromVariation}>
                              Start training
                            </button>
                          </div>
                        </div>
                      ) : trainingUiPhase === "course" && activeLesson ? (
                <div className={styles.lessonShell}>
                  <LessonConfettiBurst burstId={lessonCelebrationBurst} active={lessonCelebrationActive && !reduceMotion} />
                  <div className={styles.lessonMeta}>
                    <span className={styles.lessonTag}>{activeTrack.label}</span>
                    <span className={styles.lessonTagMuted}>
                      Lesson {trainingSession.lessonIndex + 1} of {activeCourseLessons.length}
                    </span>
                    <span className={styles.lessonTagMuted}>Chapter: {getLessonChapter(activeLesson)}</span>
                    {activeLesson.deviationPlan ? (
                      <span className={styles.lessonTag}>Deviation drill</span>
                    ) : null}
                  </div>
                  <h4 className={styles.lessonTitle}>{activeLesson.title}</h4>
                  <p className={styles.lessonPrompt}>{activeLesson.prompt}</p>

                  {activeLesson.line?.steps?.length && activeTrack ? (
                    (() => {
                      const ds = activeTrack.id === "white" ? "w" : "b";
                      const stepNow = activeLesson.line.steps[trainingSession.lineStepIndex];
                      const hint = stepNow?.hint;
                      return (
                        <>
                          {hint ? <p className={styles.moveHint}>{hint}</p> : null}
                          <div className={styles.lineDrillRow}>
                            <p className={styles.lineStepBadge}>
                              Your moves · {userPlyNumberAtStep(activeLesson.line.steps, trainingSession.lineStepIndex, ds)} /{" "}
                              {countUserPliesInLine(activeLesson.line.steps, ds)}
                            </p>
                            <button type="button" className={styles.drillRestartButton} onClick={restartCurrentLineDrill}>
                              Restart
                            </button>
                          </div>
                        </>
                      );
                    })()
                  ) : null}

                  {getBoardInteractionSpec(activeLesson, trainingSession.lineStepIndex) ? (
                    <>
                      <BoardLessonView
                        key={`${activeLesson.id}-${trainingSession.lineStepIndex}-${getBoardInteractionSpec(activeLesson, trainingSession.lineStepIndex)?.targetSquare ?? ""}`}
                        boardSpec={getBoardInteractionSpec(activeLesson, trainingSession.lineStepIndex)!}
                        selectedSquare={trainingSession.selectedChoice}
                        revealed={trainingSession.revealed}
                        orientation={activeTrack.id === "white" ? "white" : "black"}
                        onChooseSquare={chooseAnswer}
                      />
                      {getBoardInteractionSpec(activeLesson, trainingSession.lineStepIndex)?.fen ? (
                        <details className={styles.engineDetails}>
                          <summary className={styles.engineSummary}>Stockfish</summary>
                          <div className={styles.enginePanel}>
                            <div className={styles.engineRow}>
                              <button
                                type="button"
                                className={`${styles.button} ${styles.buttonSecondary}`}
                                onClick={() => void runStockfishAnalysis(getBoardInteractionSpec(activeLesson, trainingSession.lineStepIndex)!.fen!)}
                              >
                                Analyze position
                              </button>
                              <p className={styles.engineStatus}>
                                {engineStatus ?? (canUseStockfish(selectedPlan) ? "Ready." : "Subscription required.")}
                              </p>
                            </div>
                            {engineEval ? (
                              <div className={styles.engineResult}>
                                <p>
                                  <strong>Depth:</strong> {engineEval.depth} <strong>Eval:</strong>{" "}
                                  {engineEval.mate != null
                                    ? `Mate ${engineEval.mate}`
                                    : engineEval.cp != null
                                      ? `${(engineEval.cp / 100).toFixed(2)}`
                                      : "—"}
                                </p>
                                {engineEval.pv.length ? (
                                  <p className={styles.enginePv}>
                                    <strong>PV:</strong> {engineEval.pv.slice(0, 10).join(" ")}
                                  </p>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        </details>
                      ) : null}
                    </>
                  ) : (
                    <div className={styles.choiceGrid}>
                      {activeLesson.choices.map((choice, choiceIndex) => {
                        const isCorrect = trainingSession.revealed && choice === activeLesson.answer;
                        const isWrong = trainingSession.revealed && trainingSession.selectedChoice === choice && choice !== activeLesson.answer;
                        return (
                          <button
                            key={`${activeLesson.id}-c${choiceIndex}`}
                            type="button"
                            className={`${styles.choiceCard} ${isCorrect ? styles.choiceCardCorrect : ""} ${isWrong ? styles.choiceCardWrong : ""}`}
                            onClick={() => chooseAnswer(choice)}
                            disabled={trainingSession.revealed}
                          >
                            {choice}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {trainingSession.revealed ? (
                    <div
                      ref={lessonFeedbackRef}
                      className={`${styles.feedbackCard} ${
                        isLessonAnswerCorrect(activeLesson, trainingSession.selectedChoice, trainingSession.lineStepIndex)
                          ? styles.feedbackCardCorrect
                          : styles.feedbackCardWrong
                      } ${
                        isLessonAnswerCorrect(activeLesson, trainingSession.selectedChoice, trainingSession.lineStepIndex)
                          ? styles.feedbackCardSuccess
                          : ""
                      }`}
                    >
                      <p className={styles.statusTitle}>
                        {isLessonAnswerCorrect(activeLesson, trainingSession.selectedChoice, trainingSession.lineStepIndex)
                          ? activeLesson.line?.steps?.length
                            ? "Line complete"
                            : activeLesson.board
                              ? "Nice work"
                              : "Correct"
                          : "Needs review"}
                      </p>
                      <p>{activeLesson.explanation}</p>
                      {activeLesson.deviationPlan ? (
                        <div className={styles.deviationPlanBlock}>
                          <p className={styles.deviationPlanLabel}>Your plan after this line</p>
                          <p className={styles.deviationPlanText}>{activeLesson.deviationPlan}</p>
                        </div>
                      ) : null}
                      {isLessonAnswerCorrect(activeLesson, trainingSession.selectedChoice, trainingSession.lineStepIndex) ? (
                        <div className={styles.lessonCompleteActions}>
                          <button type="button" className={`${styles.button} ${styles.buttonPrimary}`} onClick={advanceLesson}>
                            {trainingSession.lessonIndex === activeCourseLessons.length - 1 ? "Finish track" : "Next lesson"}
                          </button>
                          {activeLesson.line?.steps?.length ? (
                            <button type="button" className={`${styles.button} ${styles.buttonSecondary}`} onClick={restartCurrentLineDrill}>
                              Replay this line
                            </button>
                          ) : null}
                          <Link href="/analysis" className={`${styles.button} ${styles.buttonSecondary}`}>
                            Analyze a recent game
                          </Link>
                          {trainingSession.lessonIndex < activeCourseLessons.length - 1 ? (
                            <p className={styles.lessonCompleteHint}>Continue with the next mini lesson when you are ready.</p>
                          ) : null}
                        </div>
                      ) : (
                        <button type="button" className={`${styles.button} ${styles.buttonSecondary}`} onClick={resetCurrentLesson}>
                          Try again
                        </button>
                      )}
                    </div>
                  ) : null}

                  <div className={styles.moduleList}>
                    {activeTrack.modules.map((module) => (
                      <span key={module} className={styles.modulePill}>
                        {module}
                      </span>
                    ))}
                  </div>
                </div>
                      ) : (
                        <div className={styles.lessonPlaceholder}>
                          <p className={styles.lessonPlaceholderText}>Select a lesson on the path.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </section> : null}

            {/* roadmap intentionally hidden from core flow to reduce scroll and confusion */}
          </section>
        ) : null}
        <TacticsDailyModal
          open={tacticsModalOpen}
          puzzles={tacticsSessionPuzzles}
          onClose={() => setTacticsModalOpen(false)}
          onSolvedPuzzle={handleTacticsPuzzleSolved}
        />
      </main>
    </div>
  );
}

function QuestionGroup({
  label,
  name,
  value,
  onChange,
  options,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className={styles.questionBlock}>
      <p>{label}</p>
      <div className={styles.optionGrid}>
        {options.map((option) => (
          <label key={option.value}>
            <input type="radio" name={name} checked={value === option.value} onChange={() => onChange(option.value)} />
            {option.label}
          </label>
        ))}
      </div>
    </div>
  );
}

function ResultCard({
  label,
  opening,
  dark,
  onTrain,
}: {
  label: string;
  opening: RankedOpening;
  dark: boolean;
  onTrain?: () => void;
}) {
  return (
    <article className={styles.resultCard}>
      <span className={`${styles.pieceTag} ${dark ? styles.pieceTagDark : ""}`}>{label}</span>
      <h3>{opening.name}</h3>
      <p className={styles.resultCardLead}>{opening.summary}</p>
      <p className={styles.resultCardMeta}>
        <strong>{opening.confidence}%</strong> match to your profile
      </p>
      <p className={styles.resultCardSectionTitle}>Why it is viable</p>
      <p className={styles.resultCardWhy}>{opening.why}</p>
      <p className={styles.resultCardSectionTitle}>Signals we used</p>
      <ul className={styles.resultCardList}>
        {opening.evidence.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p className={styles.resultCardSectionTitle}>Study this first</p>
      <ul className={styles.resultCardList}>
        {opening.study.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      {onTrain ? (
        <button type="button" className={`${styles.button} ${styles.buttonPrimary}`} style={{ marginTop: 14, width: "100%" }} onClick={onTrain}>
          Open lesson path
        </button>
      ) : null}
    </article>
  );
}

function InsightCard({ title, lines }: { title: string; lines: string[] }) {
  return (
    <article className={styles.insightCard}>
      <p className={styles.insightTitle}>{title}</p>
      <ul>
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </article>
  );
}

type BoardInteractionSpec = {
  instruction: string;
  sourceSquare?: string;
  targetSquare: string;
  pieces: Array<{ square: string; piece: string }>;
  /** When set, only chess-legal destinations (for the moving piece) are accepted. */
  fen?: string;
  /** Line lessons carry exact full-board placements at each step. */
  isExactPosition?: boolean;
};

function getBoardInteractionSpec(lesson: TrainingLesson, lineStepIndex: number): BoardInteractionSpec | null {
  if (lesson.line?.steps?.length) {
    const step = lesson.line.steps[lineStepIndex];
    if (!step) return null;
    return {
      instruction: step.instruction,
      sourceSquare: step.sourceSquare,
      targetSquare: step.targetSquare,
      pieces: step.pieces,
      fen: step.fen,
      isExactPosition: true,
    };
  }
  if (lesson.board) {
    try {
      const fen = buildFenFromKnightneoPlacements(
        lesson.board.pieces,
        inferSideToMoveFromSource(lesson.board.pieces, lesson.board.sourceSquare),
      );
      return {
        instruction: lesson.board.instruction,
        sourceSquare: lesson.board.sourceSquare,
        targetSquare: lesson.board.targetSquare,
        pieces: lesson.board.pieces,
        fen,
      };
    } catch {
      return {
        instruction: lesson.board.instruction,
        sourceSquare: lesson.board.sourceSquare,
        targetSquare: lesson.board.targetSquare,
        pieces: lesson.board.pieces,
      };
    }
  }
  return null;
}

function LessonConfettiBurst({ burstId, active }: { burstId: number; active: boolean }) {
  if (burstId < 1 || !active) return null;
  const pieces = Array.from({ length: 56 }, (_, i) => {
    const left = 4 + (i * 31) % 92;
    const x = -62 + ((i * 27 + burstId * 9) % 124);
    return {
      i,
      left: `${left}%`,
      delay: `${(i % 14) * 0.02}s`,
      dur: `${0.75 + (i % 7) * 0.06}s`,
      hue: (i * 43) % 360,
      w: 5 + (i % 5),
      h: 7 + (i % 6),
      x: `${x}px`,
    };
  });
  return (
    <div className={styles.lessonConfettiLayer} aria-hidden>
      {pieces.map((p) => (
        <span
          key={`${burstId}-${p.i}`}
          className={styles.lessonConfettiPiece}
          style={
            {
              left: p.left,
              animationDelay: p.delay,
              animationDuration: p.dur,
              width: p.w,
              height: p.h,
              background: `hsl(${p.hue} 72% 56%)`,
              ...({ "--confetti-x": p.x } as CSSProperties),
            }
          }
        />
      ))}
    </div>
  );
}

function isLessonAnswerCorrect(lesson: TrainingLesson, selected: string | null, lineStepIndex: number) {
  if (selected == null) return false;
  if (lesson.line?.steps?.length) {
    const step = lesson.line.steps[lineStepIndex];
    return step ? selected === step.targetSquare : false;
  }
  if (lesson.board) return selected === lesson.board.targetSquare;
  return selected === lesson.answer;
}

function BoardLessonView({
  boardSpec,
  selectedSquare,
  revealed,
  orientation,
  onChooseSquare,
}: {
  boardSpec: BoardInteractionSpec;
  selectedSquare: string | null;
  revealed: boolean;
  orientation: "white" | "black";
  onChooseSquare: (square: string) => void;
}) {
  const [illegalHint, setIllegalHint] = useState<string | null>(null);
  /** Set only after the user clicks the moving piece or starts a drag — not on load (no tap-to-move on empty squares). */
  const [confirmedSource, setConfirmedSource] = useState<string | null>(null);
  const [lastMovedTo, setLastMovedTo] = useState<string | null>(null);
  const [dragSource, setDragSource] = useState<string | null>(null);
  const [failedPieceKeys, setFailedPieceKeys] = useState<Record<string, true>>({});
  const hintTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (hintTimerRef.current != null) window.clearTimeout(hintTimerRef.current);
    };
  }, []);

  const boardInstanceKey = `${boardSpec.fen ?? "nofen"}|${boardSpec.targetSquare}|${boardSpec.sourceSquare ?? ""}|${boardSpec.pieces.length}`;

  const effectiveSource = boardSpec.sourceSquare ?? confirmedSource;
  const legalDests = useMemo(() => {
    if (revealed || !boardSpec.fen || confirmedSource == null || !effectiveSource) return new Set<string>();
    return getLegalDestinationsForSource(boardSpec.fen, effectiveSource);
  }, [boardSpec.fen, effectiveSource, confirmedSource, revealed]);

  function setHint(message: string) {
    setIllegalHint(message);
    if (hintTimerRef.current != null) window.clearTimeout(hintTimerRef.current);
    hintTimerRef.current = window.setTimeout(() => setIllegalHint(null), 1800);
  }

  function handlePickSquare(square: string, pieceOnSquare: string | undefined, sourceOverride?: string | null) {
    if (revealed) return;
    const primed = confirmedSource != null || sourceOverride != null;

    // Clicking a piece: select it, or complete a capture (second step).
    if (pieceOnSquare && !sourceOverride) {
      if (boardSpec.sourceSquare && square !== boardSpec.sourceSquare) {
        setHint("Click the highlighted piece for this move.");
        return;
      }
      if (boardSpec.fen) {
        const activePiece = boardSpec.sourceSquare ?? confirmedSource;
        const completingCapture =
          confirmedSource != null &&
          activePiece &&
          square !== activePiece &&
          isLegalDestinationForSource(boardSpec.fen, activePiece, square);
        if (completingCapture) {
          // fall through to destination handling
        } else {
          setConfirmedSource(square);
          setIllegalHint(null);
          return;
        }
      } else {
        setConfirmedSource(square);
        setIllegalHint(null);
        return;
      }
    }

    // Empty-square (or drag) destination: require piece click or drag first.
    if (!primed && !sourceOverride) {
      setHint("Click the piece to move, then click a highlighted square — or drag the piece.");
      return;
    }

    const activeSource = sourceOverride ?? (boardSpec.sourceSquare ?? confirmedSource);

    if (boardSpec.fen) {
      const legal = isLegalDestinationForSource(boardSpec.fen, activeSource ?? undefined, square);
      if (!legal) {
        setHint("Illegal square — choose a highlighted legal destination.");
        return;
      }
    }
    setIllegalHint(null);
    setLastMovedTo(square);
    window.setTimeout(() => setLastMovedTo(null), 220);
    onChooseSquare(square);
  }

  function handleDragStart(event: DragEvent<HTMLElement>, square: string, pieceOnSquare: string | undefined) {
    if (revealed || !pieceOnSquare) return;
    if (boardSpec.sourceSquare && square !== boardSpec.sourceSquare) {
      setHint("Drag the highlighted piece for this move.");
      return;
    }
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.dropEffect = "move";
    event.dataTransfer.setData("text/plain", square);
    setDragSource(square);
    setConfirmedSource(square);
    setIllegalHint(null);
  }

  function handleDrop(targetSquare: string) {
    if (!dragSource) return;
    handlePickSquare(targetSquare, undefined, dragSource);
    setDragSource(null);
  }

  const files = orientation === "white" ? ["a", "b", "c", "d", "e", "f", "g", "h"] : ["h", "g", "f", "e", "d", "c", "b", "a"];
  const ranks = orientation === "white" ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];
  const basePieceMap = boardSpec.isExactPosition
    ? new Map<string, string>(boardSpec.pieces.map((p) => [p.square, p.piece]))
    : applyLessonPosition(getFullBoardPieceMap(), boardSpec.pieces ?? []);
  const pieceMap =
    revealed && selectedSquare === boardSpec.targetSquare && boardSpec.sourceSquare
      ? applyDisplayedMove(basePieceMap, boardSpec.sourceSquare, boardSpec.targetSquare)
      : basePieceMap;

  return (
    <div className={styles.boardLessonShell}>
      <p className={styles.boardInstruction}>{boardSpec.instruction}</p>
      {boardSpec.fen ? (
        <p className={styles.legalModeNote}>Click the piece, then a highlighted square — or drag the piece. Only legal moves count.</p>
      ) : null}
      {illegalHint ? <p className={styles.illegalHint}>{illegalHint}</p> : null}
      <div className={styles.boardGrid}>
        {ranks.flatMap((rank) =>
          files.map((file) => {
            const square = `${file}${rank}`;
            const piece = pieceMap.get(square);
            const boardFileIndex = file.charCodeAt(0) - "a".charCodeAt(0);
            // Standard board: a1 is dark; d1 (queen) light; e1 (king) dark — use file index 0–7 + rank 1–8.
            const isDark = (boardFileIndex + rank) % 2 === 1;
            const isSelected = selectedSquare === square;
            const isSource = confirmedSource != null && (boardSpec.sourceSquare ?? confirmedSource) === square;
            const isCorrect = revealed && boardSpec.targetSquare === square;
            const isWrong = revealed && isSelected && boardSpec.targetSquare !== square;
            const isLegalHint = !revealed && legalDests.has(square);

            return (
              <button
                key={square}
                type="button"
                aria-label={`Square ${square}`}
                className={`${styles.boardSquare} ${isDark ? styles.boardSquareDark : styles.boardSquareLight} ${isSelected ? styles.boardSquareSelected : ""} ${isSource ? styles.boardSquareSource : ""} ${isCorrect ? styles.boardSquareCorrect : ""} ${isWrong ? styles.boardSquareWrong : ""} ${isLegalHint ? styles.boardSquareLegalHint : ""}`}
                onClick={() => handlePickSquare(square, piece)}
                onDragOver={(event) => {
                  if (!revealed && dragSource) {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "move";
                  }
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  handleDrop(square);
                }}
                draggable={false}
                disabled={revealed}
              >
                {piece ? (
                  failedPieceKeys[`${boardInstanceKey}:${square}:${piece}`] ? (
                    <span
                      aria-hidden
                      className={`${styles.boardPieceFallback} ${lastMovedTo === square ? styles.boardPieceArrive : ""}`}
                      draggable={!revealed}
                      onDragStart={(event) => handleDragStart(event, square, piece)}
                      onDragEnd={() => setDragSource(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePickSquare(square, piece);
                      }}
                    >
                      {getUnicodePieceGlyph(piece)}
                    </span>
                  ) : (
                    // Native img: reliable drag + click with square button; next/image complicates pointer events.
                    // eslint-disable-next-line @next/next/no-img-element -- board piece drag requires native img
                    <img
                      src={getNeoPieceSrc(piece)}
                      alt=""
                      width={56}
                      height={56}
                      draggable={!revealed}
                      className={`${styles.boardPieceImage} ${lastMovedTo === square ? styles.boardPieceArrive : ""}`}
                      onError={() =>
                        setFailedPieceKeys((current) => {
                          const next = { ...current };
                          next[`${boardInstanceKey}:${square}:${piece}`] = true;
                          return next;
                        })
                      }
                      onDragStart={(event) => handleDragStart(event, square, piece)}
                      onDragEnd={() => setDragSource(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePickSquare(square, piece);
                      }}
                    />
                  )
                ) : null}
                {(orientation === "white" ? file === "a" : file === "h") ? <span className={styles.boardRank}>{rank}</span> : null}
                {(orientation === "white" ? rank === 1 : rank === 8) ? <span className={styles.boardFile}>{file}</span> : null}
              </button>
            );
          }),
        )}
      </div>
    </div>
  );
}

function getFullBoardPieceMap() {
  return new Map<string, string>([
    ["a8", "r"],
    ["b8", "n"],
    ["c8", "b"],
    ["d8", "q"],
    ["e8", "k"],
    ["f8", "b"],
    ["g8", "n"],
    ["h8", "r"],
    ["a7", "p"],
    ["b7", "p"],
    ["c7", "p"],
    ["d7", "p"],
    ["e7", "p"],
    ["f7", "p"],
    ["g7", "p"],
    ["h7", "p"],
    ["a2", "P"],
    ["b2", "P"],
    ["c2", "P"],
    ["d2", "P"],
    ["e2", "P"],
    ["f2", "P"],
    ["g2", "P"],
    ["h2", "P"],
    ["a1", "R"],
    ["b1", "N"],
    ["c1", "B"],
    ["d1", "Q"],
    ["e1", "K"],
    ["f1", "B"],
    ["g1", "N"],
    ["h1", "R"],
  ]);
}

function applyLessonPosition(baseBoard: Map<string, string>, placements: Array<{ square: string; piece: string }>) {
  const board = new Map(baseBoard);
  for (const { square, piece } of placements) {
    moveOrPlacePiece(board, square, piece);
  }
  return board;
}

function applyDisplayedMove(board: Map<string, string>, sourceSquare: string, targetSquare: string) {
  const next = new Map(board);
  const movingPiece = next.get(sourceSquare);
  if (!movingPiece) return next;
  next.delete(sourceSquare);
  next.set(targetSquare, movingPiece);
  return next;
}

function moveOrPlacePiece(board: Map<string, string>, targetSquare: string, piece: string) {
  if (board.get(targetSquare) === piece) return;

  const sourceSquare = findBestSourceSquare(board, targetSquare, piece);
  if (sourceSquare) {
    board.delete(sourceSquare);
  }

  // Capture whatever currently occupies the target and place piece.
  board.set(targetSquare, piece);
}

function findBestSourceSquare(board: Map<string, string>, targetSquare: string, piece: string) {
  const sources = [...board.entries()]
    .filter((entry) => entry[1] === piece)
    .map((entry) => entry[0]);

  if (sources.length === 0) return null;
  if (sources.length === 1) return sources[0];

  for (const source of sources) {
    if (canPieceReach(board, source, targetSquare, piece)) return source;
  }

  return sources[0];
}

function canPieceReach(board: Map<string, string>, source: string, target: string, piece: string) {
  if (source === target) return true;
  const [sx, sy] = toCoords(source);
  const [tx, ty] = toCoords(target);
  const dx = tx - sx;
  const dy = ty - sy;
  const adx = Math.abs(dx);
  const ady = Math.abs(dy);
  const lower = piece.toLowerCase();

  if (lower === "n") return (adx === 1 && ady === 2) || (adx === 2 && ady === 1);
  if (lower === "k") return adx <= 1 && ady <= 1;
  if (lower === "p") {
    const dir = piece === "P" ? 1 : -1;
    if (dx === 0 && dy === dir && !board.has(target)) return true;
    if (dx === 0 && dy === dir * 2 && !board.has(target)) return true;
    return adx === 1 && dy === dir;
  }

  if (lower === "b" && adx === ady) return pathClear(board, sx, sy, tx, ty);
  if (lower === "r" && (adx === 0 || ady === 0)) return pathClear(board, sx, sy, tx, ty);
  if (lower === "q" && (adx === ady || adx === 0 || ady === 0)) return pathClear(board, sx, sy, tx, ty);
  return false;
}

function pathClear(board: Map<string, string>, sx: number, sy: number, tx: number, ty: number) {
  const stepX = Math.sign(tx - sx);
  const stepY = Math.sign(ty - sy);
  let x = sx + stepX;
  let y = sy + stepY;
  while (x !== tx || y !== ty) {
    if (board.has(fromCoords(x, y))) return false;
    x += stepX;
    y += stepY;
  }
  return true;
}

function toCoords(square: string): [number, number] {
  const file = square.charCodeAt(0) - "a".charCodeAt(0);
  const rank = Number(square[1]) - 1;
  return [file, rank];
}

function fromCoords(file: number, rank: number) {
  return `${String.fromCharCode("a".charCodeAt(0) + file)}${rank + 1}`;
}

function buildDashboard(
  profile: QuizProfile,
  repertoire: RepertoireResult,
  insights: ChessProfileResponse["insights"] | null,
  trainingProgress: TrainingProgress,
  questProgress?: SavedDashboard["questProgress"],
): SavedDashboard {
  const dash: SavedDashboard = {
    profile,
    repertoire,
    insights,
    savedAt: new Date().toISOString(),
    trainingProgress,
  };
  if (questProgress !== undefined) {
    dash.questProgress = questProgress ?? null;
  }
  return dash;
}

function getCourseLessonsForVariation(lessons: TrainingLesson[], variationId: string | null): TrainingLesson[] {
  if (!variationId) return lessons;
  const scoped = lessons.filter((lesson) => !lesson.variationId || lesson.variationId === variationId || lesson.variationId === "deviation");
  return scoped.length ? scoped : lessons;
}

function recommendVariation(variations: TrainingVariation[], profile: QuizProfile): TrainingVariation | null {
  if (!variations.length) return null;
  let best: { v: TrainingVariation; score: number } | null = null;
  for (const variation of variations) {
    let score = 0;
    if (profile.risk === "solid" && variation.risk === "low") score += 3;
    if (profile.risk === "balanced" && variation.risk === "medium") score += 2;
    if (profile.risk === "sharp" && variation.risk === "high") score += 3;
    if (profile.theory === "low" && variation.theoryLoad === "light") score += 3;
    if (profile.theory === "medium" && variation.theoryLoad === "medium") score += 2;
    if (profile.theory === "high" && variation.theoryLoad === "heavy") score += 3;
    if (profile.timeControl === "bullet" && (variation.theoryLoad === "light" || variation.style === "positional")) score += 2;
    if (profile.timeControl === "rapid" && variation.style === "balanced") score += 2;
    if (profile.timeControl === "classical" && variation.theoryLoad === "heavy") score += 2;
    if (profile.goal === "initiative" && variation.style === "tactical") score += 2;
    if (profile.goal === "counterplay" && variation.style === "balanced") score += 2;
    if (profile.goal === "clarity" && variation.style === "positional") score += 2;
    if (!best || score > best.score) best = { v: variation, score };
  }
  return best?.v ?? variations[0];
}

function buildRecommendationReasons(profile: QuizProfile, variation: TrainingVariation | null): string[] {
  if (!variation) return [];
  const reasons: string[] = [];
  reasons.push(`You told us you gravitate toward ${profile.risk} risk—that matches this ${variation.risk}-risk branch.`);
  reasons.push(`Your theory comfort (${profile.theory}) fits the ${variation.theoryLoad} load you’ll see here.`);
  reasons.push(`You usually play ${profile.timeControl}; this line’s tempo (${variation.tempo}) should feel familiar.`);
  reasons.push(`Your goal (${profile.goal}) pairs well with this ${variation.style} style of fight.`);
  return reasons.slice(0, 3);
}

function buildTrainingTracks(repertoire: RepertoireResult, plan: SubscriptionPlan) {
  const entries = [
    { id: "white", label: "White", opening: repertoire.white },
    { id: "black-e4", label: "Black vs 1.e4", opening: repertoire.blackE4 },
    { id: "black-d4", label: "Black vs 1.d4", opening: repertoire.blackD4 },
  ];

  return entries.map((entry) => {
    const track = getTrainingTrack(entry.opening.key);
    const lessons = filterLessonsForPlan(track.lessons, plan);
    return {
      ...entry,
      headline: track.headline,
      modules: track.modules,
      studies: track.studies,
      intro: track.intro,
      variations: track.variations,
      lessons,
      totalLessonsInLibrary: track.lessons.length,
    };
  });
}

function recordTrainingTelemetry(lessonId: string, wasCorrect: boolean) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(TRAINING_TELEMETRY_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, { attempts: number; correct: number; lastAt: string }>) : {};
    const current = parsed[lessonId] ?? { attempts: 0, correct: 0, lastAt: "" };
    parsed[lessonId] = {
      attempts: current.attempts + 1,
      correct: current.correct + (wasCorrect ? 1 : 0),
      lastAt: new Date().toISOString(),
    };
    window.localStorage.setItem(TRAINING_TELEMETRY_KEY, JSON.stringify(parsed));
  } catch {
    // non-blocking local analytics
  }
}

function recordUxEvent(event: string, meta: Record<string, string | number | boolean | null | undefined>) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(UX_TELEMETRY_KEY);
    const parsed = raw ? (JSON.parse(raw) as Array<Record<string, unknown>>) : [];
    parsed.push({
      event,
      at: new Date().toISOString(),
      ...meta,
    });
    window.localStorage.setItem(UX_TELEMETRY_KEY, JSON.stringify(parsed.slice(-300)));
  } catch {
    // non-blocking ux telemetry
  }
}

function getWeakLessonEntries(stats: Record<string, LessonStat>) {
  return Object.entries(stats)
    .map(([lessonId, s]) => ({
      lessonId,
      attempts: s.attempts,
      correct: s.correct,
      accuracy: s.attempts > 0 ? s.correct / s.attempts : 0,
    }))
    .filter((s) => s.attempts >= 2)
    .sort((a, b) => a.accuracy - b.accuracy || b.attempts - a.attempts);
}

function commitLessonAfterAttempt(
  dashboard: SavedDashboard,
  trackId: string,
  lessonId: string,
  wasCorrect: boolean,
): SavedDashboard {
  const normalizedTrack: "white" | "black-e4" | "black-d4" =
    trackId === "white" || trackId === "black-e4" || trackId === "black-d4" ? trackId : "white";
  const statsBefore = dashboard.trainingProgress.lessonStats[lessonId];
  const newlyCompleting = wasCorrect && !dashboard.trainingProgress.completedLessons.includes(lessonId);
  const trainingProgress = applyLessonAttempt(dashboard.trainingProgress, lessonId, wasCorrect);
  let next: SavedDashboard = { ...dashboard, trainingProgress, savedAt: new Date().toISOString() };
  next = applyQuestProgressAfterLesson(next, {
    trackId: normalizedTrack,
    lessonId,
    wasCorrect,
    statsBefore,
    newlyCompleting,
  });
  return next;
}

function applyLessonAttempt(progress: TrainingProgress, lessonId: string, wasCorrect: boolean): TrainingProgress {
  const today = new Date().toISOString().slice(0, 10);
  const current = progress.lessonStats[lessonId] ?? {
    attempts: 0,
    correct: 0,
    streak: 0,
    lastReviewed: null,
    dueAt: null,
    ease: 1,
  };

  const nextAttempts = current.attempts + 1;
  const nextCorrect = current.correct + (wasCorrect ? 1 : 0);
  const nextStreak = wasCorrect ? current.streak + 1 : 0;
  const nextEase = wasCorrect ? Math.min(2.5, current.ease + 0.15) : Math.max(0.9, current.ease - 0.2);
  const intervalDays = wasCorrect ? Math.min(21, Math.max(1, Math.round(nextStreak * nextEase))) : 0;
  const dueAt = addDays(today, intervalDays);

  const completedLessons = wasCorrect && !progress.completedLessons.includes(lessonId) ? [...progress.completedLessons, lessonId] : progress.completedLessons;
  const streak = progress.lastTrainingDate === today ? progress.streak : progress.streak + 1 || 1;

  return {
    completedLessons,
    xp: progress.xp + (wasCorrect ? 12 : 2),
    streak,
    lastTrainingDate: today,
    lessonStats: {
      ...progress.lessonStats,
      [lessonId]: {
        attempts: nextAttempts,
        correct: nextCorrect,
        streak: nextStreak,
        lastReviewed: today,
        dueAt,
        ease: nextEase,
      },
    },
  };
}

function addDays(dayString: string, days: number) {
  const date = new Date(dayString);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function countDueLessons(
  tracks: Array<{ lessons: TrainingLesson[] }>,
  lessonStats: Record<string, LessonStat>,
) {
  return tracks
    .flatMap((track) => track.lessons)
    .filter((lesson) => {
      const stats = lessonStats[lesson.id];
      if (!stats?.dueAt) return true;
      return new Date(stats.dueAt).getTime() <= Date.now();
    }).length;
}

function getTrackDueSummary(lessons: TrainingLesson[], lessonStats: Record<string, LessonStat>) {
  const dueCount = lessons.filter((lesson) => {
    const stats = lessonStats[lesson.id];
    if (!stats?.dueAt) return true;
    return new Date(stats.dueAt).getTime() <= Date.now();
  }).length;

  return dueCount === 1 ? "1 lesson ready to review" : `${dueCount} lessons ready to review`;
}

function getTrackCompletion(lessons: TrainingLesson[], completedLessons: string[]) {
  if (lessons.length === 0) return 0;
  const completed = lessons.filter((lesson) => completedLessons.includes(lesson.id)).length;
  return Math.round((completed / lessons.length) * 100);
}

function getNextDueIndex(lessons: TrainingLesson[], lessonStats: Record<string, LessonStat>, currentIndex: number) {
  if (lessons.length === 0) return 0;
  for (let offset = 1; offset <= lessons.length; offset++) {
    const idx = (currentIndex + offset) % lessons.length;
    const lesson = lessons[idx];
    const dueAt = lessonStats[lesson.id]?.dueAt;
    if (!dueAt || new Date(dueAt).getTime() <= Date.now()) {
      return idx;
    }
  }
  return (currentIndex + 1) % lessons.length;
}

function getFirstDueIndex(lessons: TrainingLesson[], lessonStats: Record<string, LessonStat>) {
  for (let idx = 0; idx < lessons.length; idx++) {
    const lesson = lessons[idx];
    const dueAt = lessonStats[lesson.id]?.dueAt;
    if (!dueAt || new Date(dueAt).getTime() <= Date.now()) return idx;
  }
  return 0;
}

function getGlobalReviewQueue(
  tracks: Array<{ id: string; label: string; lessons: TrainingLesson[] }>,
  lessonStats: Record<string, LessonStat>,
) {
  return tracks
    .flatMap((track) =>
      track.lessons.map((lesson) => {
        const dueAt = lessonStats[lesson.id]?.dueAt;
        const dueTs = dueAt ? new Date(dueAt).getTime() : 0;
        const isDue = !dueAt || dueTs <= Date.now();
        return { trackId: track.id, trackLabel: track.label, lesson, dueTs, isDue };
      }),
    )
    .filter((item) => item.isDue)
    .sort((a, b) => a.dueTs - b.dueTs);
}

function formatPlanLabel(plan: SubscriptionPlan) {
  if (plan === "free") return "Free";
  if (plan === "paid") return "Knightneo";
  return "Admin Unlock";
}

function getLessonChapter(lesson: TrainingLesson) {
  return lesson.chapter ?? (lesson.line?.steps?.length ? "Mainline" : "Core concepts");
}

function groupLessonsByChapter(lessons: TrainingLesson[]) {
  const groups: { name: string; items: Array<{ lesson: TrainingLesson; index: number }>; startIndex: number }[] = [];
  for (let i = 0; i < lessons.length; i++) {
    const lesson = lessons[i];
    const name = getLessonChapter(lesson);
    const prev = groups[groups.length - 1];
    if (!prev || prev.name !== name) {
      groups.push({ name, items: [{ lesson, index: i }], startIndex: i });
    } else {
      prev.items.push({ lesson, index: i });
    }
  }
  return groups;
}

function getChapterCopy(chapter: string) {
  return CHAPTER_COPY[chapter] ?? { subtitle: "Improve practical opening decisions in this phase.", estimate: "5-10 min" };
}

function buildChapterGroups(lessons: TrainingLesson[], completedLessons: string[]) {
  const groups: Array<{ name: string; total: number; completed: number; firstLessonIndex: number; unlocked: boolean }> = [];
  const byName = new Map<string, number>();

  lessons.forEach((lesson, index) => {
    const name = getLessonChapter(lesson);
    const existingIndex = byName.get(name);
    const isComplete = completedLessons.includes(lesson.id);
    if (existingIndex == null) {
      byName.set(name, groups.length);
      groups.push({
        name,
        total: 1,
        completed: isComplete ? 1 : 0,
        firstLessonIndex: index,
        unlocked: isChapterUnlocked(name, lessons, completedLessons),
      });
      return;
    }
    groups[existingIndex].total += 1;
    if (isComplete) groups[existingIndex].completed += 1;
  });

  return groups;
}

function getNextChapterLessonIndex(lessons: TrainingLesson[], completedLessons: string[]) {
  for (let idx = 0; idx < lessons.length; idx++) {
    const lesson = lessons[idx];
    if (completedLessons.includes(lesson.id)) continue;
    if (isChapterUnlocked(getLessonChapter(lesson), lessons, completedLessons)) return idx;
  }
  return null;
}

function getChapterFlowIndex(chapter: string) {
  const idx = CHAPTER_FLOW.findIndex((name) => name === chapter);
  return idx >= 0 ? idx : CHAPTER_FLOW.length;
}

function isChapterUnlocked(chapter: string, lessons: TrainingLesson[], completedLessons: string[]) {
  const currentIdx = getChapterFlowIndex(chapter);
  if (currentIdx <= 0) return true;

  for (const lesson of lessons) {
    const lessonChapterIdx = getChapterFlowIndex(getLessonChapter(lesson));
    if (lessonChapterIdx >= currentIdx) continue;
    if (!completedLessons.includes(lesson.id)) return false;
  }
  return true;
}

function formatComparisonLines(
  usage: Array<{ opening: string; games: number; scoreRate: number }>,
  scoring: Array<{ opening: string; games: number; scoreRate: number; averageOpponentRating: number | null }>,
) {
  if (usage.length === 0 && scoring.length === 0) {
    return ["Not enough recent public games in this bucket yet."];
  }

  const lines: string[] = [];
  const topUsage = usage[0];
  const topScoring = scoring[0];

  if (topUsage) {
    lines.push(`Most used: ${topUsage.opening} in ${topUsage.games} games with a ${(topUsage.scoreRate * 100).toFixed(1)}% score rate.`);
  }

  if (topScoring) {
    lines.push(
      `Best scoring: ${topScoring.opening} (${topScoring.games} games) with a ${(topScoring.scoreRate * 100).toFixed(1)}% score rate${topScoring.averageOpponentRating ? ` vs avg ${topScoring.averageOpponentRating}` : ""}.`,
    );
  }

  if (topUsage && topScoring && topUsage.opening !== topScoring.opening) {
    lines.push("Knightneo can use that gap to recommend something familiar but better-performing.");
  }

  return lines;
}
