import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getPlanForPriceId, getStripeClient } from "@/lib/billing";
import { getClerkIdForKnightneoUserId, updateSubscriptionByUserId } from "@/lib/account-store";
import { syncClerkPublicSubscriptionPlan } from "@/lib/clerk-subscription-sync";
import type { SubscriptionPlan } from "@/lib/subscription";

/**
 * Stripe must send: checkout.session.completed, customer.subscription.created|updated|deleted.
 * Local dev: `npm run stripe:listen`. Production: Dashboard webhook → /api/billing/webhook (see README).
 */
function isEntitlementActive(status: Stripe.Subscription.Status): boolean {
  return status === "active" || status === "trialing";
}

async function applySubscriptionPlan(knightneoUserId: string, clerkUserId: string | undefined, plan: SubscriptionPlan) {
  try {
    await updateSubscriptionByUserId(knightneoUserId, plan);
  } catch {
    // app-db.json may be read-only on serverless hosts; Clerk metadata is the source of truth there.
  }
  const clerkKey = clerkUserId ?? (await getClerkIdForKnightneoUserId(knightneoUserId));
  if (clerkKey) {
    try {
      await syncClerkPublicSubscriptionPlan(clerkKey, plan);
    } catch (error) {
      console.error("Clerk subscription metadata sync failed", error);
    }
  } else {
    console.error("Stripe webhook: no clerkUserId for Knightneo user; cannot sync Clerk metadata.", {
      knightneoUserId,
    });
  }
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Missing STRIPE_WEBHOOK_SECRET." }, { status: 500 });
  }

  const signature = (await headers()).get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature header." }, { status: 400 });
  }

  const payload = await request.text();
  let event: Stripe.Event;

  try {
    const stripe = getStripeClient();
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to verify webhook signature.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId ?? session.client_reference_id ?? undefined;
      const clerkUserId = session.metadata?.clerkUserId ?? undefined;
      const metaPlan = session.metadata?.plan;
      const paidMeta =
        metaPlan === "paid" || metaPlan === "starter" || metaPlan === "club" || metaPlan === "pro";
      const subscriptionOk = session.mode === "subscription" && session.payment_status === "paid";
      if (userId && (paidMeta || (subscriptionOk && !metaPlan))) {
        await applySubscriptionPlan(userId, clerkUserId, "paid");
      }
    }

    if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.created") {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;
      const clerkUserId = subscription.metadata?.clerkUserId ?? undefined;
      const priceId = subscription.items.data[0]?.price?.id;
      const plan = priceId ? getPlanForPriceId(priceId) : null;
      if (userId) {
        if (plan && isEntitlementActive(subscription.status)) {
          await applySubscriptionPlan(userId, clerkUserId, plan);
        } else {
          await applySubscriptionPlan(userId, clerkUserId, "free");
        }
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;
      const clerkUserId = subscription.metadata?.clerkUserId ?? undefined;
      if (userId) {
        await applySubscriptionPlan(userId, clerkUserId, "free");
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook handling failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
