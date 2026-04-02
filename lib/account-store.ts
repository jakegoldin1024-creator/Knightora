import { pbkdf2Sync, randomBytes, timingSafeEqual, randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import type { QuizProfile, RepertoireResult } from "@/lib/recommendations";
import type { ChessProfileResponse } from "@/lib/chesscom";
import type { SubscriptionPlan } from "@/lib/subscription";

export type { SubscriptionPlan };

export type LessonStat = {
  attempts: number;
  correct: number;
  streak: number;
  lastReviewed: string | null;
  dueAt: string | null;
  ease: number;
};

export type TrainingProgress = {
  completedLessons: string[];
  xp: number;
  streak: number;
  lastTrainingDate: string | null;
  lessonStats: Record<string, LessonStat>;
};

export type SavedDashboard = {
  profile: QuizProfile;
  repertoire: RepertoireResult;
  insights: ChessProfileResponse["insights"] | null;
  savedAt: string;
  trainingProgress: TrainingProgress;
};

type StoredUser = {
  id: string;
  name: string;
  email: string;
  /** Set when the user signs in with Clerk (OAuth / magic link / etc.). */
  clerkId?: string;
  /** Legacy email+password accounts only. */
  passwordHash?: string;
  salt?: string;
  subscriptionPlan: SubscriptionPlan;
  dashboard: SavedDashboard | null;
  createdAt: string;
};

type SessionRecord = {
  token: string;
  userId: string;
  createdAt: string;
};

type AppDb = {
  users: StoredUser[];
  sessions: SessionRecord[];
};

const DB_PATH = path.join(process.cwd(), "data", "app-db.json");
const SESSION_COOKIE = "knightora_session";

export const DEFAULT_TRAINING_PROGRESS: TrainingProgress = {
  completedLessons: [],
  xp: 0,
  streak: 0,
  lastTrainingDate: null,
  lessonStats: {},
};

let writeQueue: Promise<void> = Promise.resolve();

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
  subscriptionPlan: SubscriptionPlan;
}) {
  const normalizedEmail = input.email.trim().toLowerCase();
  const name = input.name.trim();

  if (!normalizedEmail || !name || input.password.length < 6) {
    throw new Error("Name, email, and a password of at least 6 characters are required.");
  }

  const db = await readDb();
  if (db.users.some((user) => user.email === normalizedEmail)) {
    throw new Error("An account with that email already exists.");
  }

  const salt = randomBytes(16).toString("hex");
  const passwordHash = hashPassword(input.password, salt);
  const user: StoredUser = {
    id: randomUUID(),
    name,
    email: normalizedEmail,
    passwordHash,
    salt,
    subscriptionPlan: input.subscriptionPlan,
    dashboard: null,
    createdAt: new Date().toISOString(),
  };

  db.users.push(user);
  const session = createSession(db, user.id);
  await writeDb(db);

  return {
    sessionToken: session.token,
    user: publicUser(user),
    dashboard: user.dashboard,
  };
}

export async function loginUser(email: string, password: string) {
  const db = await readDb();
  const user = db.users.find((entry) => entry.email === email.trim().toLowerCase());

  if (!user?.passwordHash || !user.salt) {
    throw new Error("This email uses Clerk sign-in. Use Sign in with Google or email on the account card.");
  }

  if (!verifyPassword(password, user.salt, user.passwordHash)) {
    throw new Error("Invalid email or password.");
  }

  const session = createSession(db, user.id);
  await writeDb(db);

  return {
    sessionToken: session.token,
    user: publicUser(user),
    dashboard: user.dashboard,
  };
}

export async function logoutUser(sessionToken: string | undefined) {
  if (!sessionToken) return;
  const db = await readDb();
  db.sessions = db.sessions.filter((session) => session.token !== sessionToken);
  await writeDb(db);
}

export async function getSessionAccount(sessionToken: string | undefined) {
  if (!sessionToken) return null;

  const db = await readDb();
  const session = db.sessions.find((entry) => entry.token === sessionToken);
  if (!session) return null;

  const user = db.users.find((entry) => entry.id === session.userId);
  if (!user) return null;

  return {
    user: publicUser(user),
    dashboard: user.dashboard,
  };
}

export async function saveDashboard(sessionToken: string | undefined, dashboard: SavedDashboard) {
  const db = await readDb();
  const user = requireUserBySession(db, sessionToken);
  user.dashboard = dashboard;
  await writeDb(db);

  return {
    user: publicUser(user),
    dashboard: user.dashboard,
  };
}

export async function updateSubscription(sessionToken: string | undefined, subscriptionPlan: SubscriptionPlan) {
  const db = await readDb();
  const user = requireUserBySession(db, sessionToken);
  user.subscriptionPlan = subscriptionPlan;
  await writeDb(db);

  return publicUser(user);
}

export async function syncClerkAccount(input: {
  clerkUserId: string;
  email: string | null | undefined;
  firstName: string | null | undefined;
  lastName: string | null | undefined;
  username: string | null | undefined;
}) {
  const db = await readDb();
  const displayName =
    [input.firstName, input.lastName].filter(Boolean).join(" ").trim() ||
    input.username?.trim() ||
    input.email?.split("@")[0] ||
    "Player";
  const emailNorm = input.email?.trim().toLowerCase() ?? `${input.clerkUserId}@clerk.knightora`;

  let user = db.users.find((entry) => entry.clerkId === input.clerkUserId);
  if (user) {
    let changed = false;
    if (input.email && user.email !== emailNorm) {
      user.email = emailNorm;
      changed = true;
    }
    if (displayName && user.name !== displayName) {
      user.name = displayName;
      changed = true;
    }
    if (changed) await writeDb(db);
    return { user: publicUser(user), dashboard: user.dashboard };
  }

  if (input.email) {
    const existing = db.users.find((entry) => entry.email === emailNorm && !entry.clerkId);
    if (existing) {
      existing.clerkId = input.clerkUserId;
      if (displayName) existing.name = displayName;
      await writeDb(db);
      return { user: publicUser(existing), dashboard: existing.dashboard };
    }
  }

  const newUser: StoredUser = {
    id: randomUUID(),
    name: displayName,
    email: emailNorm,
    clerkId: input.clerkUserId,
    subscriptionPlan: "free",
    dashboard: null,
    createdAt: new Date().toISOString(),
  };
  db.users.push(newUser);
  await writeDb(db);
  return { user: publicUser(newUser), dashboard: null };
}

export async function saveDashboardForClerk(clerkUserId: string, dashboard: SavedDashboard) {
  const db = await readDb();
  const user = db.users.find((entry) => entry.clerkId === clerkUserId);
  if (!user) {
    throw new Error("You must be signed in to save this dashboard.");
  }
  user.dashboard = dashboard;
  await writeDb(db);
  return { user: publicUser(user), dashboard: user.dashboard };
}

export async function updateSubscriptionForClerk(clerkUserId: string, subscriptionPlan: SubscriptionPlan) {
  const db = await readDb();
  const user = db.users.find((entry) => entry.clerkId === clerkUserId);
  if (!user) {
    throw new Error("You must be signed in.");
  }
  user.subscriptionPlan = subscriptionPlan;
  await writeDb(db);
  return publicUser(user);
}

export async function updateSubscriptionByUserId(userId: string, subscriptionPlan: SubscriptionPlan) {
  const db = await readDb();
  const user = db.users.find((entry) => entry.id === userId);
  if (!user) {
    throw new Error("The account for this billing event could not be found.");
  }

  user.subscriptionPlan = subscriptionPlan;
  await writeDb(db);
  return publicUser(user);
}

/** Used by Stripe webhooks when `clerkUserId` is missing from subscription metadata (older checkouts). */
export async function getClerkIdForKnightoraUserId(knightoraUserId: string): Promise<string | undefined> {
  const db = await readDb();
  return db.users.find((entry) => entry.id === knightoraUserId)?.clerkId;
}

export function getSessionCookieName() {
  return SESSION_COOKIE;
}

function requireUserBySession(db: AppDb, sessionToken: string | undefined) {
  if (!sessionToken) {
    throw new Error("You must be signed in to save this dashboard.");
  }

  const session = db.sessions.find((entry) => entry.token === sessionToken);
  if (!session) {
    throw new Error("Your session expired. Please sign in again.");
  }

  const user = db.users.find((entry) => entry.id === session.userId);
  if (!user) {
    throw new Error("The account for this session could not be found.");
  }

  return user;
}

function publicUser(user: StoredUser) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    subscriptionPlan: normalizeStoredPlan(user.subscriptionPlan),
    createdAt: user.createdAt,
  };
}

function normalizeStoredPlan(plan: SubscriptionPlan): SubscriptionPlan {
  const raw = plan as string;
  if (raw === "starter" || raw === "club" || raw === "pro") return "paid";
  if (raw === "paid" || raw === "admin") return raw;
  return "free";
}

function createSession(db: AppDb, userId: string) {
  const session: SessionRecord = {
    token: randomUUID(),
    userId,
    createdAt: new Date().toISOString(),
  };

  db.sessions = db.sessions.filter((entry) => entry.userId !== userId);
  db.sessions.push(session);
  return session;
}

async function readDb(): Promise<AppDb> {
  try {
    const file = await fs.readFile(DB_PATH, "utf8");
    const db = JSON.parse(file) as AppDb;
    for (const user of db.users) {
      const raw = user.subscriptionPlan as string;
      if (raw === "starter" || raw === "club" || raw === "pro") {
        user.subscriptionPlan = "paid";
      }
    }
    return db;
  } catch {
    return { users: [], sessions: [] };
  }
}

async function writeDb(db: AppDb) {
  writeQueue = writeQueue.then(async () => {
    await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf8");
  });

  await writeQueue;
}

function hashPassword(password: string, salt: string) {
  return pbkdf2Sync(password, salt, 310000, 32, "sha256").toString("hex");
}

function verifyPassword(password: string, salt: string, expectedHash: string) {
  const actualHash = Buffer.from(hashPassword(password, salt), "hex");
  const expected = Buffer.from(expectedHash, "hex");

  if (actualHash.length !== expected.length) return false;
  return timingSafeEqual(actualHash, expected);
}
