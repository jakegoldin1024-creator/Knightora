import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getSessionAccount, getSessionCookieName, type SubscriptionPlan } from "@/lib/account-store";
import { getPriceIdForPlan, getStripeClient, isBillablePlan } from "@/lib/billing";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { plan?: SubscriptionPlan };
    const plan = body.plan ?? "free";
    if (!isBillablePlan(plan)) {
      throw new Error("That plan does not require checkout.");
    }

    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(getSessionCookieName())?.value;
    const account = await getSessionAccount(sessionToken);
    if (!account?.user) {
      return NextResponse.json({ error: "Please sign in before starting checkout." }, { status: 401 });
    }

    const priceId = getPriceIdForPlan(plan);
    if (!priceId) {
      return NextResponse.json({ error: `No Stripe price is configured for ${plan}.` }, { status: 500 });
    }

    const stripe = getStripeClient();
    const origin = request.nextUrl.origin;
    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/?billing=success`,
      cancel_url: `${origin}/?billing=cancel`,
      customer_email: account.user.email,
      metadata: {
        userId: account.user.id,
        plan,
      },
      subscription_data: {
        metadata: {
          userId: account.user.id,
          plan,
        },
      },
    });

    return NextResponse.json({ url: checkout.url }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to start checkout.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
