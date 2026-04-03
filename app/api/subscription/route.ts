import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSessionCookieName, updateSubscription, updateSubscriptionForClerk } from "@/lib/account-store";
import type { SubscriptionPlan } from "@/lib/subscription";
import { isBillablePlan } from "@/lib/billing";
import { resolveClerkKnightneoAccount } from "@/lib/clerk-account";
import { syncClerkPublicSubscriptionPlan } from "@/lib/clerk-subscription-sync";
import { ADMIN_UNLOCK_ENABLED } from "@/lib/admin-unlock";

export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as { subscriptionPlan?: SubscriptionPlan; adminCode?: string };
    const requestedPlan = body.subscriptionPlan ?? "free";

    // Paid plans must be changed through Stripe checkout + webhook.
    if (isBillablePlan(requestedPlan)) {
      throw new Error("Use billing checkout to upgrade to a paid plan.");
    }

    if (requestedPlan === "admin") {
      if (!ADMIN_UNLOCK_ENABLED) {
        throw new Error("Admin unlock is temporarily disabled.");
      }
      const priorBrandPrefix = ["KNIGHT", "ORA"].join("");
      const expectedCode =
        process.env.KNIGHTNEO_ADMIN_CODE ??
        process.env[`${priorBrandPrefix}_ADMIN_CODE`] ??
        process.env.ADMIN_CODE ??
        process.env.KNIGHTNEO_UNLOCK_CODE ??
        process.env[`${priorBrandPrefix}_UNLOCK_CODE`] ??
        null;
      if (!expectedCode) {
        throw new Error("Admin unlock is not configured. Set KNIGHTNEO_ADMIN_CODE on the server (legacy admin env keys are still read if set).");
      }
      if ((body.adminCode ?? "").trim() !== expectedCode.trim()) {
        throw new Error("Invalid admin code.");
      }
    }

    const { userId } = await auth();
    if (userId) {
      // Ensure a Knightneo user row exists for this Clerk account before plan updates.
      await resolveClerkKnightneoAccount();
      const user = await updateSubscriptionForClerk(userId, requestedPlan);
      try {
        await syncClerkPublicSubscriptionPlan(userId, requestedPlan);
      } catch {
        // Clerk sync is best-effort; file DB still updated above.
      }
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
