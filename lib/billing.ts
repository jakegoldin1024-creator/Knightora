import Stripe from "stripe";
import type { SubscriptionPlan } from "@/lib/subscription";

const BILLABLE_PLANS: SubscriptionPlan[] = ["paid"];

export type BillingInterval = "month" | "year";

/** Tried in order; first non-empty trimmed value wins. */
export const STRIPE_MONTHLY_PRICE_ENV_KEYS = [
  "STRIPE_PRICE_PAID_MONTHLY",
  "STRIPE_PRICE_STARTER",
  "STRIPE_PRICE_MONTHLY",
  "STRIPE_PRICE_ID",
  "STRIPE_MONTHLY_PRICE_ID",
  "STRIPE_SUBSCRIPTION_PRICE_ID",
  "STRIPE_SUBSCRIPTION_PRICE_MONTHLY",
  "NEXT_PUBLIC_STRIPE_PRICE_ID",
  "NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID",
  "NEXT_PUBLIC_STRIPE_SUBSCRIPTION_PRICE_ID",
] as const;

export const STRIPE_YEARLY_PRICE_ENV_KEYS = [
  "STRIPE_PRICE_PAID_YEARLY",
  "STRIPE_PRICE_YEARLY",
  "STRIPE_PRICE_PAID_ANNUAL",
  "STRIPE_PRICE_ANNUAL",
  "STRIPE_YEARLY_PRICE_ID",
  "STRIPE_SUBSCRIPTION_PRICE_YEARLY",
  "NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID",
  "NEXT_PUBLIC_STRIPE_PAID_YEARLY_PRICE_ID",
] as const;

const ALL_PRICE_ENV_KEYS = [...STRIPE_MONTHLY_PRICE_ENV_KEYS, ...STRIPE_YEARLY_PRICE_ENV_KEYS] as const;

function readTrimmedEnv(name: string): string | null {
  const raw = process.env[name];
  if (typeof raw !== "string") return null;
  const v = raw.trim();
  return v.length > 0 ? v : null;
}

function firstPriceFromKeys(keys: readonly string[]): string | null {
  for (const key of keys) {
    const v = readTrimmedEnv(key);
    if (v) return v;
  }
  return null;
}

export function isBillablePlan(plan: SubscriptionPlan) {
  return BILLABLE_PLANS.includes(plan);
}

export function getPriceIdForPlan(plan: SubscriptionPlan, interval: BillingInterval = "month"): string | null {
  if (plan !== "paid") return null;
  if (interval === "year") {
    return firstPriceFromKeys(STRIPE_YEARLY_PRICE_ENV_KEYS);
  }
  return firstPriceFromKeys(STRIPE_MONTHLY_PRICE_ENV_KEYS);
}

/** Unique price IDs from every known env key (webhook plan matching). */
export function listConfiguredPriceIds(): string[] {
  const ids = new Set<string>();
  for (const key of ALL_PRICE_ENV_KEYS) {
    const v = readTrimmedEnv(key);
    if (v) ids.add(v);
  }
  return [...ids];
}

export function billingPriceEnvHint(interval: BillingInterval): string {
  const keys = interval === "year" ? STRIPE_YEARLY_PRICE_ENV_KEYS : STRIPE_MONTHLY_PRICE_ENV_KEYS;
  return `Set one of these in Vercel (or .env.local): ${keys.join(", ")}.`;
}

export function getPlanForPriceId(priceId: string): SubscriptionPlan | null {
  if (!priceId) return null;
  if (listConfiguredPriceIds().includes(priceId.trim())) return "paid";
  return null;
}

export function getStripeClient() {
  const secretKey = readTrimmedEnv("STRIPE_SECRET_KEY");
  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY environment variable.");
  }

  return new Stripe(secretKey, { apiVersion: "2025-08-27.basil" });
}
