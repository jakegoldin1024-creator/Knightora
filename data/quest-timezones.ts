/** IANA zones supported in onboarding / API (extend as needed). */
export const QUEST_TIMEZONE_OPTIONS = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Australia/Sydney",
] as const;

export function parseQuestDayTimezone(raw: string | null): string | undefined {
  const t = raw?.trim();
  if (!t || t.toUpperCase() === "UTC") return undefined;
  return (QUEST_TIMEZONE_OPTIONS as readonly string[]).includes(t) ? t : undefined;
}
