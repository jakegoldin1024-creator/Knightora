"use client";

import { UserButton, useAuth, useClerk } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { filterLessonsForPlan, getTrainingTrack, type TrainingLesson } from "@/data/training";
import { buildFenFromKnightoraPlacements, inferSideToMoveFromSource } from "@/lib/board-fen";
import { getLegalDestinationsForSource, isLegalDestinationForSource } from "@/lib/move-legality";
import { analyzeFenWithStockfish, type StockfishEval } from "@/lib/stockfish-client";
import type { ChessProfileResponse } from "@/lib/chesscom";
import {
  describeGoal,
  describeStyle,
  getRepertoire,
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

type SubscriptionPlan = "free" | "starter" | "club" | "pro" | "admin";

type LessonStat = {
  attempts: number;
  correct: number;
  streak: number;
  lastReviewed: string | null;
  dueAt: string | null;
  ease: number;
};

type TrainingProgress = {
  completedLessons: string[];
  xp: number;
  streak: number;
  lastTrainingDate: string | null;
  lessonStats: Record<string, LessonStat>;
};

type SavedDashboard = {
  profile: QuizProfile;
  repertoire: RepertoireResult;
  insights: ChessProfileResponse["insights"] | null;
  savedAt: string;
  trainingProgress: TrainingProgress;
};

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
};

const STORAGE_KEY = "knightora-dashboard-v2";

const initialProfile: QuizProfile = {
  rating: "developing",
  positionType: "mixed",
  theory: "medium",
  risk: "balanced",
  timeControl: "rapid",
  goal: "clarity",
  username: "",
};

const initialTrainingProgress: TrainingProgress = {
  completedLessons: [],
  xp: 0,
  streak: 0,
  lastTrainingDate: null,
  lessonStats: {},
};

const plans: Array<{
  id: SubscriptionPlan;
  name: string;
  price: string;
  description: string;
  features: string[];
}> = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    description: "Use the core quiz, recommendations, and training dashboard for free.",
    features: ["Quiz-based repertoire recommendations", "Local dashboard + training progress", "Optional Chess.com analysis"],
  },
  {
    id: "starter",
    name: "Starter Supporter",
    price: "$8/mo",
    description: "Cloud saves + deeper line drills (more move orders).",
    features: [
      "Everything in Free",
      "Account-backed cloud dashboard saves (use across devices)",
      "Extra branch line drills per opening (more move orders)",
      "Early access to new training packs as they ship",
    ],
  },
  {
    id: "club",
    name: "Club Supporter",
    price: "$16/mo",
    description: "Best tier: Stockfish analysis + maximum training depth.",
    features: [
      "Everything in Starter Supporter",
      "Stockfish analysis on lesson positions (eval + best line)",
      "Heavier continuation drills (longer lines)",
      "Priority roadmap voting + faster content expansion",
    ],
  },
  {
    id: "pro",
    name: "Pro Supporter",
    price: "$29/mo",
    description: "Everything unlocked, fastest roadmap access, and highest training depth.",
    features: [
      "Everything in Club Supporter",
      "Deepest line library and premium study packs",
      "Early access to major training UX features",
      "Highest-priority support and roadmap influence",
    ],
  },
  {
    id: "admin",
    name: "Admin Unlock",
    price: "$0",
    description: "Internal testing and demo mode unlocked by admin code.",
    features: ["All current capabilities", "Great for QA and demos", "Not a public purchase tier"],
  },
];

export function QuizExperience() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const { signOut } = useClerk();

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

  const [hydrated, setHydrated] = useState(false);
  const [trainingSession, setTrainingSession] = useState<TrainingSessionState>({
    trackId: "white",
    lessonIndex: 0,
    selectedChoice: null,
    revealed: false,
    lineStepIndex: 0,
  });

  const fallbackRepertoire = getRepertoire(profile);
  const activeDashboard = savedDashboard;
  const selectedPlan = accountUser?.subscriptionPlan ?? guestSubscriptionPlan;
  const trainingTracks = activeDashboard
    ? buildTrainingTracks(activeDashboard.repertoire, selectedPlan)
    : [];
  const activeTrack = trainingTracks.find((track) => track.id === trainingSession.trackId) ?? trainingTracks[0] ?? null;
  const activeLesson = activeTrack?.lessons[trainingSession.lessonIndex] ?? null;
  const progress = activeDashboard?.trainingProgress ?? initialTrainingProgress;
  const latestDashboardRef = useRef<SavedDashboard | null>(null);
  const canUsePremiumReview = selectedPlan === "starter" || selectedPlan === "club" || selectedPlan === "admin";
  const canUsePremiumStudies = selectedPlan === "club" || selectedPlan === "admin";

  function clearLineAdvanceTimer() {
    if (lineAdvanceTimeoutRef.current != null) {
      window.clearTimeout(lineAdvanceTimeoutRef.current);
      lineAdvanceTimeoutRef.current = null;
    }
  }

  useEffect(() => {
    setHydrated(true);

    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as SavedDashboard;
        setSavedDashboard(parsed);
        setProfile(parsed.profile);
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
    if (!latestDashboardRef.current || !accountUser) return;
    void persistDashboard(latestDashboardRef.current);
  }, [accountUser, activeDashboard?.savedAt]);

  useEffect(() => {
    if (!activeTrack) return;
    setTrainingSession((current) => {
      const maxIdx = Math.max(0, activeTrack.lessons.length - 1);
      const safeIndex = Math.min(current.lessonIndex, maxIdx);
      if (current.trackId === activeTrack.id && current.lessonIndex === safeIndex && current.lessonIndex < activeTrack.lessons.length) {
        return current;
      }

      return {
        trackId: activeTrack.id,
        lessonIndex: safeIndex,
        selectedChoice: null,
        revealed: false,
        lineStepIndex: 0,
      };
    });
  }, [activeTrack]);

  useEffect(() => {
    setTrainingSession((current) => ({ ...current, lineStepIndex: 0 }));
  }, [activeLesson?.id]);

  useEffect(() => {
    return () => {
      clearLineAdvanceTimer();
    };
  }, []);

  // For full-line lessons: auto-advance through the opponent's moves so the user only plays their own side.
  useEffect(() => {
    if (!activeLesson?.line?.steps?.length || !activeTrack) return;
    const desiredSide = activeTrack.id === "white" ? "w" : "b";

    const step = activeLesson.line.steps[trainingSession.lineStepIndex];
    const side = sideToMoveFromFen(step?.fen);
    if (!side) return;
    if (side === desiredSide) return;

    // Skip opponent ply (or multiple if needed) without requiring clicks.
    setTrainingSession((current) => {
      let idx = current.lineStepIndex;
      while (idx < activeLesson.line!.steps.length) {
        const s = sideToMoveFromFen(activeLesson.line!.steps[idx]?.fen);
        if (!s || s === desiredSide) break;
        idx += 1;
      }
      if (idx === current.lineStepIndex) return current;
      return { ...current, lineStepIndex: idx, selectedChoice: null, revealed: false };
    });
  }, [activeLesson?.id, activeLesson?.line, activeTrack, trainingSession.lineStepIndex]);

  async function loadAccount() {
    const response = await fetch("/api/account/me");
    const payload = (await response.json()) as { user: AccountUser | null; dashboard: SavedDashboard | null };

    if (!payload.user) return;

    setAccountUser(payload.user);
    setGuestSubscriptionPlan(payload.user!.subscriptionPlan);

    if (payload.dashboard) {
      setSavedDashboard(payload.dashboard);
      setProfile(payload.dashboard.profile);
    }
  }

  function updateField<Key extends keyof QuizProfile>(key: Key, value: QuizProfile[Key]) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAnalysisError(null);

    if (!profile.username?.trim()) {
      const dashboard = buildDashboard(profile, fallbackRepertoire, null, progress);
      setSavedDashboard(dashboard);
      return;
    }

    const query = new URLSearchParams({
      username: profile.username.trim(),
      rating: profile.rating,
      positionType: profile.positionType,
      theory: profile.theory,
      risk: profile.risk,
      timeControl: profile.timeControl,
      goal: profile.goal,
    });

    setIsPending(true);

    try {
      const response = await fetch(`/api/chess-profile?${query.toString()}`);
      const payload = (await response.json()) as ChessProfileResponse | { error?: string };

      if (!response.ok) {
        throw new Error(payload && "error" in payload ? payload.error : "Unable to analyze that username.");
      }

      const resolved = payload as ChessProfileResponse;
      setSavedDashboard(buildDashboard(profile, resolved.repertoire, resolved.insights, progress));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "We could not analyze that Chess.com account, so Knightora fell back to quiz-only recommendations.";
      setAnalysisError(message);
      setSavedDashboard(buildDashboard(profile, fallbackRepertoire, null, progress));
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
      setSavedDashboard(payload.dashboard);
    }
  }

  async function choosePlan(plan: SubscriptionPlan, adminCode?: string) {
    setGuestSubscriptionPlan(plan);

    if (!accountUser) return false;

    const response = await fetch("/api/subscription", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscriptionPlan: plan, adminCode }),
    });

    const payload = (await response.json()) as { user?: AccountUser; error?: string };
    if (!response.ok || !payload.user) {
      setAccountError(payload.error ?? "Unable to update subscription.");
      return false;
    }

    setAccountUser(payload.user);
    return true;
  }

  async function startCheckout(plan: SubscriptionPlan) {
    if (!accountUser) {
      setAccountError("Please create an account or sign in before checkout.");
      return;
    }

    const response = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });

    const payload = (await response.json()) as { url?: string; error?: string };
    if (!response.ok || !payload.url) {
      setAccountError(payload.error ?? "Unable to start billing checkout.");
      return;
    }

    window.location.href = payload.url;
  }

  function canUseStockfish(plan: SubscriptionPlan) {
    return plan === "club" || plan === "admin";
  }

  async function runStockfishAnalysis(fen: string) {
    if (!canUseStockfish(selectedPlan)) {
      setEngineStatus("Upgrade to Club Supporter to use Stockfish analysis.");
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
      setEngineStatus(msg);
    }
  }

  async function applyAdminCode() {
    if (!accountUser) {
      setAdminCodeMessage("Sign in first to apply an admin code.");
      return;
    }

    if (!adminCodeInput.trim()) {
      setAdminCodeMessage("Enter your admin code first.");
      return;
    }

    const unlocked = await choosePlan("admin", adminCodeInput.trim());
    if (!unlocked) {
      setAdminCodeMessage("That admin code is not valid.");
      return;
    }
    setAdminCodeInput("");
    setAdminCodeMessage("Admin unlock enabled for this account.");
  }

  function beginTrack(trackId: string) {
    clearLineAdvanceTimer();
    setTrainingSession({
      trackId,
      lessonIndex: 0,
      selectedChoice: null,
      revealed: false,
      lineStepIndex: 0,
    });
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
        lineAdvanceTimeoutRef.current = window.setTimeout(() => {
          setTrainingSession((current) => ({
            ...current,
            // Advance to next ply; an effect auto-skips opponent ply.
            lineStepIndex: current.lineStepIndex + 1,
            selectedChoice: null,
            revealed: false,
          }));
        }, 280);
        return;
      }

      const nextProgress = applyLessonAttempt(activeDashboard.trainingProgress, activeLesson.id, isCorrect);
      const nextDashboard = {
        ...activeDashboard,
        trainingProgress: nextProgress,
        savedAt: new Date().toISOString(),
      };
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
      const nextProgress = applyLessonAttempt(activeDashboard.trainingProgress, activeLesson.id, isCorrect);
      const nextDashboard = {
        ...activeDashboard,
        trainingProgress: nextProgress,
        savedAt: new Date().toISOString(),
      };
      setSavedDashboard(nextDashboard);
      setTrainingSession((current) => ({
        ...current,
        selectedChoice: answer,
        revealed: true,
      }));
      return;
    }

    const isCorrect = answer === activeLesson.answer;
    const nextProgress = applyLessonAttempt(activeDashboard.trainingProgress, activeLesson.id, isCorrect);
    const nextDashboard = {
      ...activeDashboard,
      trainingProgress: nextProgress,
      savedAt: new Date().toISOString(),
    };

    setSavedDashboard(nextDashboard);
    setTrainingSession((current) => ({
      ...current,
      selectedChoice: answer,
      revealed: true,
    }));
  }

  function resetCurrentLesson() {
    clearLineAdvanceTimer();
    setTrainingSession((current) => ({
      ...current,
      selectedChoice: null,
      revealed: false,
    }));
  }

  function advanceLesson() {
    if (!activeTrack) return;
    clearLineAdvanceTimer();
    setTrainingSession((current) => ({
      trackId: current.trackId,
      lessonIndex: Math.min(current.lessonIndex + 1, activeTrack.lessons.length - 1),
      selectedChoice: null,
      revealed: false,
      lineStepIndex: 0,
    }));
  }

  function restartCurrentLineDrill() {
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
    const idx = activeTrack.lessons.findIndex((l) => l.id === lessonId);
    if (idx < 0) return;
    clearLineAdvanceTimer();
    setTrainingSession({
      trackId: activeTrack.id,
      lessonIndex: idx,
      selectedChoice: null,
      revealed: false,
      lineStepIndex: 0,
    });
  }

  function jumpToLessonIndex(lessonIndex: number) {
    if (!activeTrack) return;
    if (lessonIndex < 0 || lessonIndex >= activeTrack.lessons.length) return;
    clearLineAdvanceTimer();
    setTrainingSession({
      trackId: activeTrack.id,
      lessonIndex,
      selectedChoice: null,
      revealed: false,
      lineStepIndex: 0,
    });
  }

  if (!hydrated) {
    return (
      <div className={styles.pageShell}>
        <main>
          <section className={styles.panel}>
            <div className={styles.sectionHeading}>
              <p className={styles.eyebrow}>Knightora</p>
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
            <span className={styles.brandName}>Knightora</span>
          </div>
          <div className={styles.topbarLinks}>
            <a href="#plans" className={styles.ghostLink}>
              Plans
            </a>
            <a href="#quiz" className={styles.ghostLink}>
              Quiz
            </a>
            {activeDashboard ? (
              <a href="#dashboard" className={styles.ghostLink}>
                Dashboard
              </a>
            ) : null}
            {isLoaded && isSignedIn ? <UserButton /> : null}
          </div>
        </nav>

        <div className={styles.heroGrid}>
          <section className={styles.heroCopy}>
            <p className={styles.eyebrow}>Focused opening repertoires for serious improvers</p>
            <h1>Learn the right openings, then train them on the board.</h1>
            <p className={styles.lede}>
              Knightora helps players choose a small repertoire, save it to an account, and train it through guided board-based opening study instead of endless tabs and random theory.
            </p>
            <div className={styles.heroActions}>
              <a href="#plans" className={`${styles.button} ${styles.buttonPrimary}`}>
                See plans and value
              </a>
              <a href="#quiz" className={`${styles.button} ${styles.buttonSecondary}`}>
                Build my repertoire
              </a>
            </div>
            <ul className={styles.signalList}>
              <li>Free core experience available now</li>
              <li>Account-based saved dashboards</li>
              <li>Guided opening training with review scheduling</li>
            </ul>
          </section>

          <aside className={styles.heroCard}>
            <p className={styles.cardLabel}>Knightora loop</p>
            <div className={styles.recommendationPreview}>
              <div>
                <span className={styles.pieceTag}>1</span>
                <h3>Choose</h3>
                <p>Find a repertoire that fits style, results, and actual game habits.</p>
              </div>
              <div>
                <span className={`${styles.pieceTag} ${styles.pieceTagDark}`}>2</span>
                <h3>Save</h3>
                <p>Keep it in an account-backed dashboard with progress and plan selection.</p>
              </div>
              <div>
                <span className={`${styles.pieceTag} ${styles.pieceTagDark}`}>3</span>
                <h3>Train</h3>
                <p>Review moves and setups on the board, then bring weak lessons back automatically.</p>
              </div>
            </div>
          </aside>
        </div>
      </header>

      <main>
        <section id="plans" className={styles.panel}>
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>Plans and value</p>
            <h2>Start free, then support if you find it useful.</h2>
            <p>Supporter tiers fund more lessons, deeper lines, and better training tools. Paid tiers upgrade via Stripe checkout.</p>
          </div>
          <div className={styles.pricingGrid}>
            {plans
              .filter((plan) => plan.id !== "admin" || selectedPlan === "admin")
              .map((plan) => (
              <article
                key={plan.id}
                className={`${styles.pricingCard} ${selectedPlan === plan.id ? styles.pricingCardActive : ""}`}
              >
                <p className={styles.metricLabel}>{plan.name}</p>
                <h3>{plan.price}</h3>
                <p>{plan.description}</p>
                <ul>
                  {plan.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                <button
                  type="button"
                  className={`${styles.button} ${styles.buttonSecondary}`}
                  onClick={() => void (plan.id === "starter" || plan.id === "club" || plan.id === "pro" ? startCheckout(plan.id) : choosePlan(plan.id))}
                >
                  {selectedPlan === plan.id
                    ? "Selected plan"
                    : plan.id === "starter" || plan.id === "club" || plan.id === "pro"
                      ? "Checkout"
                      : "Use this plan"}
                </button>
              </article>
            ))}
          </div>
          <div className={styles.adminUnlockPanel}>
            <h3>Admin unlock (internal/testing)</h3>
            <p>Paste your admin code here after signing in. This is separate from paid plans.</p>
            <div className={styles.adminUnlockRow}>
              <input
                type="password"
                value={adminCodeInput}
                onChange={(event) => setAdminCodeInput(event.target.value)}
                placeholder="Enter admin code"
              />
              <button type="button" className={`${styles.button} ${styles.buttonSecondary}`} onClick={() => void applyAdminCode()}>
                Apply code
              </button>
            </div>
            {adminCodeMessage ? <p className={styles.adminUnlockMessage}>{adminCodeMessage}</p> : null}
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>Account</p>
            <h2>Save dashboards across devices with a real account.</h2>
            <p className={styles.lede}>
              Sign in with Clerk — email, Google, GitHub, or other providers you enable in the Clerk dashboard.
            </p>
          </div>
          <div className={styles.accountGrid}>
            <article className={styles.accountCard}>
              <p className={styles.metricLabel}>Sign in</p>
              {!isLoaded ? (
                <p>Loading sign-in…</p>
              ) : !isSignedIn ? (
                <>
                  <h3>Use one click sign-in</h3>
                  <p>Knightora uses Clerk so you don&apos;t manage another password here. After you sign in, your repertoire can sync to the server when you save.</p>
                  <div className={styles.heroActions} style={{ marginTop: 16 }}>
                    <Link href="/sign-in" className={`${styles.button} ${styles.buttonPrimary}`}>
                      Sign in
                    </Link>
                    <Link href="/sign-up" className={`${styles.button} ${styles.buttonSecondary}`}>
                      Create account
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <h3>You&apos;re signed in</h3>
                  <p>Use the profile button in the top bar to manage your Clerk account or sign out.</p>
                  <div style={{ marginTop: 12 }}>
                    <UserButton />
                  </div>
                </>
              )}
              {accountError ? <p className={styles.accountError}>{accountError}</p> : null}
            </article>

            <article className={styles.accountCard}>
              <p className={styles.metricLabel}>Current account status</p>
              {!isLoaded ? (
                <p>Loading…</p>
              ) : isSignedIn ? (
                accountUser ? (
                  <>
                    <h3>{accountUser.name}</h3>
                    <p>{accountUser.email}</p>
                    <p>Plan: {formatPlanLabel(accountUser.subscriptionPlan)}</p>
                    <label className={styles.fieldLabel}>
                      Admin access code
                      <input
                        type="password"
                        value={adminCodeInput}
                        onChange={(event) => setAdminCodeInput(event.target.value)}
                        placeholder="Enter admin code"
                      />
                    </label>
                    <button type="button" className={`${styles.button} ${styles.buttonSecondary}`} onClick={() => void applyAdminCode()}>
                      Apply admin code
                    </button>
                    {adminCodeMessage ? <p>{adminCodeMessage}</p> : null}
                    <button type="button" className={`${styles.button} ${styles.buttonSecondary}`} onClick={() => void handleLogout()}>
                      Sign out
                    </button>
                  </>
                ) : (
                  <p>Loading your Knightora profile…</p>
                )
              ) : (
                <>
                  <h3>Not signed in yet</h3>
                  <p>Sign in above to keep your repertoire and training progress backed by the server instead of only this browser.</p>
                </>
              )}
            </article>
          </div>
        </section>

        <section id="howItWorks" className={styles.panel}>
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>How Knightora works</p>
            <h2>A compact repertoire, guided studies, and review that sticks.</h2>
          </div>
          <div className={styles.stepsGrid}>
            <article>
              <span>01</span>
              <h3>Take the style quiz</h3>
              <p>Describe how you think you play so Knightora starts with a focused repertoire fit.</p>
            </article>
            <article>
              <span>02</span>
              <h3>Analyze actual games</h3>
              <p>Optionally add a Chess.com username so recommendations use real opening habits and performance.</p>
            </article>
            <article>
              <span>03</span>
              <h3>Train and review</h3>
              <p>Study each opening on the board, track weak spots, and bring missed lessons back automatically.</p>
            </article>
          </div>
        </section>

        <section id="quiz" className={styles.panel}>
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>Style quiz</p>
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
              <p>6. Optional Chess.com username</p>
              <label htmlFor="username" className={styles.assistiveLabel}>
                Knightora will blend recent public games into the recommendation and training path.
              </label>
              <input id="username" type="text" placeholder="e.g. hikaru" value={profile.username ?? ""} onChange={(event) => updateField("username", event.target.value)} />
            </div>

            <button type="submit" className={`${styles.button} ${styles.buttonPrimary} ${styles.buttonWide}`}>
              {isPending ? "Analyzing games..." : "Build my repertoire"}
            </button>
          </form>
        </section>

        {activeDashboard ? (
          <section id="dashboard" className={styles.panel}>
            <div className={styles.sectionHeading}>
              <p className={styles.eyebrow}>Dashboard</p>
              <h2>Your saved repertoire, studies, and review queue</h2>
            </div>

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

            <div className={styles.resultsSummary}>
              <p>
                You profile as a <strong>{describeStyle(activeDashboard.profile)}</strong> player who wants <strong>{describeGoal(activeDashboard.profile.goal)}</strong>.
                {activeDashboard.insights ? (
                  <> Knightora also analyzed <strong>{activeDashboard.insights.gamesAnalyzed}</strong> recent public games from <strong>{activeDashboard.insights.username}</strong>.</>
                ) : (
                  <> Your current dashboard is using the saved quiz-based repertoire.</>
                )}
              </p>
              <p>
                {accountUser
                  ? "This dashboard is now backed by your account and can follow you across devices once deployed."
                  : "Sign in to move this browser dashboard into an account-backed save."}
              </p>
            </div>

            {isPending ? (
              <div className={styles.statusCard}>
                <p className={styles.statusTitle}>Analyzing Chess.com games</p>
                <p>Knightora is comparing your real opening habits against the quiz profile.</p>
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

            <div className={styles.recommendationGrid}>
              <ResultCard label="White" opening={activeDashboard.repertoire.white} dark={false} />
              <ResultCard label="Black vs 1.e4" opening={activeDashboard.repertoire.blackE4} dark />
              <ResultCard label="Black vs 1.d4" opening={activeDashboard.repertoire.blackD4} dark />
            </div>

            <section className={styles.trainingPanel}>
              <div className={styles.trainingHeader}>
                <div>
                  <p className={styles.eyebrow}>Guided training</p>
                  <h3>Board-based opening reps with automatic review</h3>
                  <p className={styles.trainingIntro}>
                    Knightora includes full-line drills (10–17 half-moves per line) built from real move order, plus idea questions and review cards. Free users get the main line and full library for each opening; higher tiers unlock extra branch lines and deeper theory.
                  </p>
                </div>
                <div className={styles.trainingStats}>
                  <span>{progress.completedLessons.length} lessons done</span>
                  <span>{progress.xp} XP</span>
                  <span>{countDueLessons(trainingTracks, progress.lessonStats)} lessons due</span>
                </div>
              </div>

              <div className={styles.trackGrid}>
                {trainingTracks.map((track) => (
                  <button
                    key={track.id}
                    type="button"
                    className={`${styles.trackCard} ${activeTrack?.id === track.id ? styles.trackCardActive : ""}`}
                    onClick={() => beginTrack(track.id)}
                  >
                    <span className={styles.trackBadge}>{track.label}</span>
                    <span className={styles.trackCardTitle}>{track.opening.name}</span>
                    <span className={styles.trackCardBlurb}>{track.headline}</span>
                    <span className={styles.trackPlanHint}>
                      {track.lessons.length} lesson{track.lessons.length !== 1 ? "s" : ""} available on your plan
                      {"totalLessonsInLibrary" in track && track.totalLessonsInLibrary > track.lessons.length
                        ? ` · ${track.totalLessonsInLibrary - track.lessons.length} more on higher tiers`
                        : ""}
                    </span>
                    <span className={styles.progressRow}>
                      <span className={styles.progressBar}>
                        <span style={{ width: `${getTrackCompletion(track.lessons, progress.completedLessons)}%` }} />
                      </span>
                      <strong>{getTrackCompletion(track.lessons, progress.completedLessons)}%</strong>
                    </span>
                    <span className={styles.trackDueText}>{getTrackDueSummary(track.lessons, progress.lessonStats)}</span>
                  </button>
                ))}
              </div>

              {activeTrack && activeDashboard && canUsePremiumReview ? (
                <div className={styles.drillReview}>
                  <h4>Line review</h4>
                  <p className={styles.drillReviewIntro}>
                    Replay full multi-move lines you&apos;ve completed. Board taps only accept <strong>legal</strong> destinations for the piece that should move.
                  </p>
                  <ul className={styles.drillList}>
                    {activeTrack.lessons
                      .filter((l) => l.line?.steps?.length && progress.completedLessons.includes(l.id))
                      .map((l) => (
                        <li key={l.id}>
                          <button type="button" className={styles.drillJumpButton} onClick={() => jumpToLessonById(l.id)}>
                            {l.title}
                          </button>
                        </li>
                      ))}
                  </ul>
                  {!activeTrack.lessons.some((l) => l.line?.steps?.length && progress.completedLessons.includes(l.id)) ? (
                    <p className={styles.drillEmpty}>Finish a full line lesson once to unlock quick replays here.</p>
                  ) : null}
                </div>
              ) : null}

              {activeTrack && activeDashboard && !canUsePremiumReview ? (
                <div className={styles.drillReview}>
                  <h4>Line review</h4>
                  <p className={styles.drillReviewIntro}>Starter or higher unlocks saved replay drills and fast review jumps.</p>
                </div>
              ) : null}

              {activeTrack && canUsePremiumStudies ? (
                <div className={styles.studyShelf}>
                  <div className={styles.studyHeader}>
                    <h4>{activeTrack.opening.name} studies</h4>
                    <p>Short study notes to pair with the board drills.</p>
                  </div>
                  <div className={styles.studyGrid}>
                    {(activeTrack.studies ?? []).map((study) => (
                      <article key={study} className={styles.studyCard}>
                        <p>{study}</p>
                      </article>
                    ))}
                  </div>
                </div>
              ) : null}

              {activeTrack && !canUsePremiumStudies ? (
                <div className={styles.studyShelf}>
                  <div className={styles.studyHeader}>
                    <h4>{activeTrack.opening.name} studies</h4>
                    <p>Club Supporter unlocks extended study notes and model-game guidance.</p>
                  </div>
                </div>
              ) : null}

              {activeTrack && activeLesson ? (
                <div className={styles.lessonShell}>
                  <div className={styles.pathSection}>
                    <div className={styles.pathHeaderRow}>
                      <h4>{activeTrack.opening.name} learning path</h4>
                      <p>
                        Follow the path: complete a lesson to unlock the next checkpoint.
                      </p>
                    </div>
                    <div className={styles.pathRail}>
                      {activeTrack.lessons.map((lesson, index) => {
                        const isCompleted = progress.completedLessons.includes(lesson.id);
                        const isCurrent = index === trainingSession.lessonIndex;
                        const previousLessonId = index > 0 ? activeTrack.lessons[index - 1]?.id : null;
                        const isUnlocked = index === 0 || isCompleted || isCurrent || (previousLessonId ? progress.completedLessons.includes(previousLessonId) : false);
                        const isBoardLesson = Boolean(lesson.line?.steps?.length || lesson.board);
                        return (
                          <div key={lesson.id} className={styles.pathNodeWrap}>
                            {index > 0 ? (
                              <span
                                className={`${styles.pathConnector} ${progress.completedLessons.includes(activeTrack.lessons[index - 1]?.id ?? "") ? styles.pathConnectorDone : ""}`}
                              />
                            ) : null}
                            <button
                              type="button"
                              disabled={!isUnlocked}
                              onClick={() => jumpToLessonIndex(index)}
                              className={`${styles.pathNode} ${isCurrent ? styles.pathNodeCurrent : ""} ${isCompleted ? styles.pathNodeDone : ""} ${!isUnlocked ? styles.pathNodeLocked : ""}`}
                            >
                              <span className={styles.pathNodeOrb}>{isCompleted ? "✓" : index + 1}</span>
                              <span className={styles.pathNodeTitle}>{lesson.title}</span>
                              <span className={styles.pathNodeMeta}>{isBoardLesson ? "Board drill" : "Concept checkpoint"}</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className={styles.lessonMeta}>
                    <span className={styles.lessonTag}>{activeTrack.label}</span>
                    <span className={styles.lessonTagMuted}>
                      Lesson {trainingSession.lessonIndex + 1} of {activeTrack.lessons.length}
                    </span>
                  </div>
                  <h4>{activeLesson.title}</h4>
                  <p className={styles.lessonFocus}>Focus: {activeLesson.focus}</p>
                  <p className={styles.lessonPrompt}>{activeLesson.prompt}</p>

                  {activeLesson.line?.steps?.length ? (
                    <div className={styles.lineDrillRow}>
                      <p className={styles.lineStepBadge}>
                        Your move {Math.floor(trainingSession.lineStepIndex / 2) + 1} of {Math.ceil(activeLesson.line.steps.length / 2)} in this line
                      </p>
                      <p className={styles.lineCoachHint}>You only play your side; opponent replies auto-play.</p>
                      <button type="button" className={styles.drillRestartButton} onClick={restartCurrentLineDrill}>
                        Restart line
                      </button>
                    </div>
                  ) : null}

                  {getBoardInteractionSpec(activeLesson, trainingSession.lineStepIndex) ? (
                    <>
                      <BoardLessonView
                        key={`${activeLesson.id}-${trainingSession.lineStepIndex}`}
                        boardSpec={getBoardInteractionSpec(activeLesson, trainingSession.lineStepIndex)!}
                        selectedSquare={trainingSession.selectedChoice}
                        revealed={trainingSession.revealed}
                        orientation={activeTrack.id === "white" ? "white" : "black"}
                        onChooseSquare={chooseAnswer}
                      />
                      {getBoardInteractionSpec(activeLesson, trainingSession.lineStepIndex)?.fen ? (
                        <div className={styles.enginePanel}>
                          <div className={styles.engineRow}>
                            <button
                              type="button"
                              className={`${styles.button} ${styles.buttonSecondary}`}
                              onClick={() => void runStockfishAnalysis(getBoardInteractionSpec(activeLesson, trainingSession.lineStepIndex)!.fen!)}
                            >
                              Analyze with Stockfish
                            </button>
                            <p className={styles.engineStatus}>
                              {engineStatus ?? (canUseStockfish(selectedPlan) ? "Ready." : "Club unlocks analysis.")}
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
                                  <strong>Best line:</strong> {engineEval.pv.slice(0, 10).join(" ")}
                                </p>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <div className={styles.choiceGrid}>
                      {activeLesson.choices.map((choice) => {
                        const isCorrect = trainingSession.revealed && choice === activeLesson.answer;
                        const isWrong = trainingSession.revealed && trainingSession.selectedChoice === choice && choice !== activeLesson.answer;
                        return (
                          <button
                            key={choice}
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
                      className={`${styles.feedbackCard} ${
                        isLessonAnswerCorrect(activeLesson, trainingSession.selectedChoice, trainingSession.lineStepIndex)
                          ? styles.feedbackCardCorrect
                          : styles.feedbackCardWrong
                      }`}
                    >
                      <p className={styles.statusTitle}>
                        {isLessonAnswerCorrect(activeLesson, trainingSession.selectedChoice, trainingSession.lineStepIndex)
                          ? "Correct"
                          : "Needs review"}
                      </p>
                      <p>{activeLesson.explanation}</p>
                      {isLessonAnswerCorrect(activeLesson, trainingSession.selectedChoice, trainingSession.lineStepIndex) ? (
                        <button type="button" className={`${styles.button} ${styles.buttonPrimary}`} onClick={advanceLesson}>
                          {trainingSession.lessonIndex === activeTrack.lessons.length - 1 ? "Finish track" : "Next lesson"}
                        </button>
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
              ) : null}
            </section>

            <div className={styles.studyPlan}>
              <h3>What this unlocks next</h3>
              <p>
                Knightora now has account-backed dashboards, subscription plan selection, board-based drills, growing study content, and review scheduling that can bring weak lessons back automatically.
              </p>
              <ul>
                <li>Keep Stripe billing and supporter plan feature pages in sync as premium features ship.</li>
                <li>Expand the opening lesson library with deeper move-order branches and model-game studies.</li>
                <li>Generate review queues directly from a player&apos;s missed opening decisions over time.</li>
              </ul>
            </div>
          </section>
        ) : null}
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

function ResultCard({ label, opening, dark }: { label: string; opening: RankedOpening; dark: boolean }) {
  return (
    <article className={styles.resultCard}>
      <span className={`${styles.pieceTag} ${dark ? styles.pieceTagDark : ""}`}>{label}</span>
      <h3>{opening.name}</h3>
      <p>{opening.summary}</p>
      <p>
        <strong>Confidence:</strong> {opening.confidence}%
      </p>
      <p>
        <strong>Why it fits:</strong> {opening.why}
      </p>
      <ul>
        {opening.evidence.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <ul>
        {opening.study.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
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
      const fen = buildFenFromKnightoraPlacements(
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

function isLessonAnswerCorrect(lesson: TrainingLesson, selected: string | null, lineStepIndex: number) {
  if (selected == null) return false;
  if (lesson.line?.steps?.length) {
    const step = lesson.line.steps[lineStepIndex];
    return step ? selected === step.targetSquare : false;
  }
  if (lesson.board) return selected === lesson.board.targetSquare;
  return selected === lesson.answer;
}

function sideToMoveFromFen(fen: string | undefined) {
  if (!fen) return null;
  const parts = fen.split(" ");
  const side = parts[1];
  return side === "w" || side === "b" ? side : null;
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
  const [selectedSource, setSelectedSource] = useState<string | null>(boardSpec.sourceSquare ?? null);
  const [lastMovedTo, setLastMovedTo] = useState<string | null>(null);
  const [dragSource, setDragSource] = useState<string | null>(null);
  const hintTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (hintTimerRef.current != null) window.clearTimeout(hintTimerRef.current);
    };
  }, []);

  const legalDests = useMemo(() => {
    if (revealed || !boardSpec.fen || !selectedSource) return new Set<string>();
    return getLegalDestinationsForSource(boardSpec.fen, selectedSource);
  }, [boardSpec.fen, selectedSource, revealed]);

  function setHint(message: string) {
    setIllegalHint(message);
    if (hintTimerRef.current != null) window.clearTimeout(hintTimerRef.current);
    hintTimerRef.current = window.setTimeout(() => setIllegalHint(null), 1800);
  }

  function handlePickSquare(square: string, pieceOnSquare: string | undefined, sourceOverride?: string | null) {
    if (revealed) return;

    // First tap picks the moving piece, second tap picks destination.
    if (boardSpec.fen && pieceOnSquare && !sourceOverride) {
      if (boardSpec.sourceSquare && square !== boardSpec.sourceSquare) {
        setHint("Select the highlighted source piece first.");
        return;
      }
      setSelectedSource(square);
      setIllegalHint(null);
      return;
    }

    if (boardSpec.fen) {
      const moveSource = sourceOverride ?? selectedSource ?? boardSpec.sourceSquare;
      const legal = isLegalDestinationForSource(boardSpec.fen, moveSource, square);
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

  function handleDragStart(square: string, pieceOnSquare: string | undefined) {
    if (revealed || !pieceOnSquare) return;
    if (boardSpec.sourceSquare && square !== boardSpec.sourceSquare) {
      setHint("Drag the highlighted piece for this move.");
      return;
    }
    setDragSource(square);
    setSelectedSource(square);
    setIllegalHint(null);
  }

  function handleDrop(targetSquare: string) {
    if (!dragSource) return;
    handlePickSquare(targetSquare, undefined, dragSource);
    setDragSource(null);
  }

  const files = orientation === "white" ? ["a", "b", "c", "d", "e", "f", "g", "h"] : ["h", "g", "f", "e", "d", "c", "b", "a"];
  const ranks = orientation === "white" ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];
  const pieceMap = boardSpec.isExactPosition
    ? new Map<string, string>(boardSpec.pieces.map((p) => [p.square, p.piece]))
    : applyLessonPosition(getFullBoardPieceMap(), boardSpec.pieces ?? []);

  return (
    <div className={styles.boardLessonShell}>
      <p className={styles.boardInstruction}>{boardSpec.instruction}</p>
      {boardSpec.fen ? (
        <p className={styles.legalModeNote}>Legal-move mode: only chess-legal destination squares count.</p>
      ) : null}
      {illegalHint ? <p className={styles.illegalHint}>{illegalHint}</p> : null}
      <div className={styles.boardGrid}>
        {ranks.flatMap((rank) =>
          files.map((file, fileIndex) => {
            const square = `${file}${rank}`;
            const piece = pieceMap.get(square);
            const boardFileIndex = file.charCodeAt(0) - "a".charCodeAt(0);
            const isDark = (rank + boardFileIndex) % 2 === 0;
            const isSelected = selectedSquare === square;
            const isSource = (selectedSource ?? boardSpec.sourceSquare) === square;
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
                  if (!revealed && dragSource) event.preventDefault();
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  handleDrop(square);
                }}
                onDragEnd={() => setDragSource(null)}
                draggable={Boolean(piece) && !revealed}
                onDragStart={() => handleDragStart(square, piece)}
                disabled={revealed}
              >
                {piece ? (
                  <Image
                    src={getNeoPieceSrc(piece)}
                    alt={`Piece ${piece}`}
                    className={`${styles.boardPieceImage} ${lastMovedTo === square ? styles.boardPieceArrive : ""}`}
                    draggable={false}
                    width={56}
                    height={56}
                    unoptimized
                  />
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

function getNeoPieceSrc(piece: string) {
  const normalized = piece === piece.toUpperCase() ? `w${piece.toLowerCase()}` : `b${piece}`;
  return `/pieces/neo/${normalized}.png`;
}

function buildDashboard(
  profile: QuizProfile,
  repertoire: RepertoireResult,
  insights: ChessProfileResponse["insights"] | null,
  trainingProgress: TrainingProgress,
): SavedDashboard {
  return {
    profile,
    repertoire,
    insights,
    savedAt: new Date().toISOString(),
    trainingProgress,
  };
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
      lessons,
      totalLessonsInLibrary: track.lessons.length,
    };
  });
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

function formatPlanLabel(plan: SubscriptionPlan) {
  if (plan === "free") return "Free";
  if (plan === "starter") return "Starter";
  if (plan === "club") return "Club";
  if (plan === "pro") return "Pro";
  return "Admin Unlock";
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
    lines.push("Knightora can use that gap to recommend something familiar but better-performing.");
  }

  return lines;
}
