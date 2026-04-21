import { createHash } from "node:crypto";

/** Simple per-client sliding window (best-effort in serverless; use Redis for strict global limits). */
const WINDOW_MS = 60_000;
const MAX_SIGNED_IN = 40;
const MAX_ANONYMOUS = 18;

const hits = new Map<string, number[]>();

export type CoachRateClient = "signed" | "anonymous";

export function checkCoachRateLimit(clientKey: string, client: CoachRateClient): boolean {
  const max = client === "signed" ? MAX_SIGNED_IN : MAX_ANONYMOUS;
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  const prev = hits.get(clientKey) ?? [];
  const kept = prev.filter((t) => t > windowStart);
  if (kept.length >= max) {
    hits.set(clientKey, kept);
    return false;
  }
  kept.push(now);
  hits.set(clientKey, kept);
  return true;
}

/**
 * Best-effort anonymous key (IP + UA). Signed-in users should use `u:${userId}` instead.
 */
export function anonymousCoachClientKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = fwd || req.headers.get("x-real-ip") || "unknown";
  const ua = req.headers.get("user-agent") || "";
  const h = createHash("sha256").update(`${ip}|${ua}`).digest("hex").slice(0, 24);
  return `a:${h}`;
}
