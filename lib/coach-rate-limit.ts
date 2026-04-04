/** Simple per-user sliding window (best-effort in serverless; use Redis for strict global limits). */
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 40;

const hits = new Map<string, number[]>();

export function checkCoachRateLimit(userId: string): boolean {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  const prev = hits.get(userId) ?? [];
  const kept = prev.filter((t) => t > windowStart);
  if (kept.length >= MAX_REQUESTS) {
    hits.set(userId, kept);
    return false;
  }
  kept.push(now);
  hits.set(userId, kept);
  return true;
}
