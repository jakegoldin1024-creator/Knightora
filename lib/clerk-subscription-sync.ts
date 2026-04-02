import { clerkClient } from "@clerk/nextjs/server";
import type { SubscriptionPlan } from "@/lib/subscription";

const META_KEY = "subscriptionPlan";

/** Parse subscription tier from Clerk publicMetadata (Stripe webhook / admin sync). */
export function parseSubscriptionFromMetadata(value: unknown): SubscriptionPlan | null {
  if (value === "paid" || value === "admin" || value === "free") return value;
  return null;
}

/** Pick the higher entitlement (admin beats paid beats free). */
export function mergeSubscriptionPlans(a: SubscriptionPlan, b: SubscriptionPlan): SubscriptionPlan {
  const rank = (p: SubscriptionPlan) => (p === "admin" ? 3 : p === "paid" ? 2 : 1);
  return rank(a) >= rank(b) ? a : b;
}

export function mergeFilePlanWithClerkMetadata(
  filePlan: SubscriptionPlan,
  clerkPublicMetadata: Record<string, unknown> | undefined,
): SubscriptionPlan {
  const fromMeta = parseSubscriptionFromMetadata(clerkPublicMetadata?.[META_KEY]);
  if (!fromMeta) return filePlan;
  return mergeSubscriptionPlans(filePlan, fromMeta);
}

/** Persists plan on Clerk so Vercel works without writable app-db.json. */
export async function syncClerkPublicSubscriptionPlan(clerkUserId: string, plan: SubscriptionPlan) {
  const client = await clerkClient();
  const user = await client.users.getUser(clerkUserId);
  const prev = (user.publicMetadata ?? {}) as Record<string, unknown>;
  await client.users.updateUser(clerkUserId, {
    publicMetadata: {
      ...prev,
      [META_KEY]: plan,
    },
  });
}
