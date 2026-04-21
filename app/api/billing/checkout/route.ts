import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@clerk/nextjs/server";
import { getSessionAccount, getSessionCookieName } from "@/lib/account-store";
import type { SubscriptionPlan } from "@/lib/subscription";
import { resolveClerkKnightneoAccount } from "@/lib/clerk-account";
import {
  billingPriceEnvHint,
  billingProductIdMistakeHint,
  getPriceIdForPlan,
  getStripeClient,
  hasStripeSecretKey,
  isBillablePlan,
  type BillingInterval,
} from "@/lib/billing";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { plan?: SubscriptionPlan; interval?: BillingInterval };
    const plan = body.plan ?? "free";
    const interval: BillingInterval = body.interval === "year" ? "year" : "month";
    if (!isBillablePlan(plan)) {
      throw new Error("That plan does not require checkout.");
    }

    const { userId: clerkUserId } = await auth();
    let account = null as Awaited<ReturnType<typeof resolveClerkKnightneoAccount>>;

    if (clerkUserId) {
      account = await resolveClerkKnightneoAccount();
    } else {
      const cookieStore = await cookies();
      const sessionToken = cookieStore.get(getSessionCookieName())?.value;
      account = await getSessionAccount(sessionToken);
    }

    if (!account?.user) {
      return NextResponse.json({ error: "Please sign in before starting checkout." }, { status: 401 });
    }

    const priceId = getPriceIdForPlan(plan, interval);
    if (!priceId) {
      const secretHint = hasStripeSecretKey()
        ? "STRIPE_SECRET_KEY is set."
        : "STRIPE_SECRET_KEY is missing—add your Stripe secret key (sk_test_… or sk_live_…).";
      const priceHint = billingProductIdMistakeHint(interval) ?? billingPriceEnvHint(interval);
      return NextResponse.json(
        {
          error: `No Stripe price ID for ${interval}ly billing. ${priceHint} ${secretHint}`,
        },
        { status: 500 },
      );
    }

    const stripe = getStripeClient();
    const origin = request.nextUrl.origin;
    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/quiz?billing=success`,
      cancel_url: `${origin}/quiz?billing=cancel`,
      customer_email: account.user.email,
      client_reference_id: account.user.id,
      metadata: {
        userId: account.user.id,
        plan,
        ...(clerkUserId ? { clerkUserId } : {}),
      },
      subscription_data: {
        metadata: {
          userId: account.user.id,
          plan,
          ...(clerkUserId ? { clerkUserId } : {}),
        },
      },
    });

    return NextResponse.json({ url: checkout.url }, { status: 200 });
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Unable to start checkout.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
