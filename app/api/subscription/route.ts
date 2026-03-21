import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  getSessionCookieName,
  updateSubscription,
  updateSubscriptionForClerk,
  type SubscriptionPlan,
} from "@/lib/account-store";
import { isBillablePlan } from "@/lib/billing";

export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as { subscriptionPlan?: SubscriptionPlan; adminCode?: string };
    const requestedPlan = body.subscriptionPlan ?? "free";

    // Paid plans must be changed through Stripe checkout + webhook.
    if (isBillablePlan(requestedPlan)) {
      throw new Error("Use billing checkout to upgrade to a paid plan.");
    }

    if (requestedPlan === "admin") {
      const expectedCode = process.env.KNIGHTORA_ADMIN_CODE;
      if (!expectedCode) {
        throw new Error("Admin unlock is not configured on the server.");
      }
      if ((body.adminCode ?? "").trim() !== expectedCode.trim()) {
        throw new Error("Invalid admin code.");
      }
    }

    const { userId } = await auth();
    if (userId) {
      const user = await updateSubscriptionForClerk(userId, requestedPlan);
      return NextResponse.json({ user }, { status: 200 });
    }

    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(getSessionCookieName())?.value;
    const user = await updateSubscription(sessionToken, requestedPlan);
    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update subscription.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
