import Stripe from "stripe";
import type { SubscriptionPlan } from "@/lib/account-store";

const BILLABLE_PLANS: SubscriptionPlan[] = ["starter", "club", "pro"];

export function isBillablePlan(plan: SubscriptionPlan) {
  return BILLABLE_PLANS.includes(plan);
}

export function getPriceIdForPlan(plan: SubscriptionPlan): string | null {
  if (plan === "starter") return process.env.STRIPE_PRICE_STARTER ?? null;
  if (plan === "club") return process.env.STRIPE_PRICE_CLUB ?? null;
  if (plan === "pro") return process.env.STRIPE_PRICE_PRO ?? null;
  return null;
}

export function getPlanForPriceId(priceId: string): SubscriptionPlan | null {
  if (priceId === process.env.STRIPE_PRICE_STARTER) return "starter";
  if (priceId === process.env.STRIPE_PRICE_CLUB) return "club";
  if (priceId === process.env.STRIPE_PRICE_PRO) return "pro";
  return null;
}

export function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY environment variable.");
  }

  return new Stripe(secretKey, { apiVersion: "2025-08-27.basil" });
}
