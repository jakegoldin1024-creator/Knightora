import Stripe from "stripe";
import type { SubscriptionPlan } from "@/lib/subscription";

const BILLABLE_PLANS: SubscriptionPlan[] = ["paid"];

export type BillingInterval = "month" | "year";

export function isBillablePlan(plan: SubscriptionPlan) {
  return BILLABLE_PLANS.includes(plan);
}

export function getPriceIdForPlan(plan: SubscriptionPlan, interval: BillingInterval = "month"): string | null {
  if (plan !== "paid") return null;
  if (interval === "year") {
    return (
      process.env.STRIPE_PRICE_PAID_YEARLY ??
      process.env.STRIPE_PRICE_YEARLY ??
      process.env.STRIPE_PRICE_PAID_ANNUAL ??
      process.env.STRIPE_PRICE_ANNUAL ??
      process.env.STRIPE_YEARLY_PRICE_ID ??
      null
    );
  }
  return (
    process.env.STRIPE_PRICE_PAID_MONTHLY ??
    process.env.STRIPE_PRICE_STARTER ??
    process.env.STRIPE_PRICE_MONTHLY ??
    process.env.STRIPE_PRICE_ID ??
    process.env.STRIPE_MONTHLY_PRICE_ID ??
    null
  );
}

/** Every env var that can map to a subscription price (for webhook + checkout validation). */
export function listConfiguredPriceIds(): string[] {
  const keys = [
    "STRIPE_PRICE_PAID_MONTHLY",
    "STRIPE_PRICE_STARTER",
    "STRIPE_PRICE_MONTHLY",
    "STRIPE_PRICE_ID",
    "STRIPE_MONTHLY_PRICE_ID",
    "STRIPE_PRICE_PAID_YEARLY",
    "STRIPE_PRICE_YEARLY",
    "STRIPE_PRICE_PAID_ANNUAL",
    "STRIPE_PRICE_ANNUAL",
    "STRIPE_YEARLY_PRICE_ID",
  ] as const;
  return keys.map((k) => process.env[k]).filter((v): v is string => Boolean(v));
}

export function getPlanForPriceId(priceId: string): SubscriptionPlan | null {
  if (!priceId) return null;
  if (listConfiguredPriceIds().includes(priceId)) return "paid";
  return null;
}

export function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY environment variable.");
  }

  return new Stripe(secretKey, { apiVersion: "2025-08-27.basil" });
}
