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

/** Treat .env.example placeholders and obvious typos as unset so checkout shows a config error, not a Stripe 400. */
function isPlaceholderStripePriceId(value: string): boolean {
  const v = value.trim().toLowerCase();
  if (!v.startsWith("price_")) return true;
  if (v.includes("replace_me") || v.includes("replace-me")) return true;
  if (/changeme|your_price|example|not_set|todo|xxx/.test(v)) return true;
  return false;
}

function firstPriceFromKeys(keys: readonly string[]): string | null {
  for (const key of keys) {
    const v = readTrimmedEnv(key);
    if (v && !isPlaceholderStripePriceId(v)) return v;
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
    if (v && !isPlaceholderStripePriceId(v)) ids.add(v);
  }
  return [...ids];
}

export function billingPriceEnvHint(interval: BillingInterval): string {
  const keys = interval === "year" ? STRIPE_YEARLY_PRICE_ENV_KEYS : STRIPE_MONTHLY_PRICE_ENV_KEYS;
  const primary = interval === "year" ? "STRIPE_PRICE_PAID_YEARLY" : "STRIPE_PRICE_PAID_MONTHLY";
  return `Set ${primary} (or another supported key) in Vercel or .env.local to a real Price ID (starts with price_). Supported keys: ${keys.join(", ")}.`;
}

/**
 * If the user pasted a Stripe Product ID (prod_…) into a price env var, explain the fix.
 * Checkout line items require Price IDs (price_…), found under each product’s Pricing section.
 */
export function billingProductIdMistakeHint(interval: BillingInterval): string | null {
  const keys = interval === "year" ? STRIPE_YEARLY_PRICE_ENV_KEYS : STRIPE_MONTHLY_PRICE_ENV_KEYS;
  for (const key of keys) {
    const v = readTrimmedEnv(key);
    if (v?.startsWith("prod_")) {
      return `${key} is set to a Product ID (${v}). Use the recurring Price ID (price_…) for that product instead: Stripe Dashboard → Products → Knightneo ${interval}ly subscription → Pricing → copy the Price ID.`;
    }
  }
  return null;
}

export function hasStripeSecretKey(): boolean {
  return readTrimmedEnv("STRIPE_SECRET_KEY") != null;
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
