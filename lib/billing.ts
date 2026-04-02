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
    return process.env.STRIPE_PRICE_PAID_YEARLY ?? process.env.STRIPE_PRICE_YEARLY ?? null;
  }
  return process.env.STRIPE_PRICE_PAID_MONTHLY ?? process.env.STRIPE_PRICE_STARTER ?? null;
}

export function getPlanForPriceId(priceId: string): SubscriptionPlan | null {
  const month = process.env.STRIPE_PRICE_PAID_MONTHLY ?? process.env.STRIPE_PRICE_STARTER;
  const year = process.env.STRIPE_PRICE_PAID_YEARLY ?? process.env.STRIPE_PRICE_YEARLY;
  if (priceId && (priceId === month || priceId === year)) return "paid";
  return null;
}

export function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY environment variable.");
  }

  return new Stripe(secretKey, { apiVersion: "2025-08-27.basil" });
}
