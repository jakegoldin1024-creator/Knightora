import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getSessionCookieName, updateSubscription, type SubscriptionPlan } from "@/lib/account-store";

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(getSessionCookieName())?.value;
    const body = (await request.json()) as { subscriptionPlan?: SubscriptionPlan; adminCode?: string };

    if (body.subscriptionPlan === "admin") {
      const expectedCode = process.env.KNIGHTORA_ADMIN_CODE;
      if (!expectedCode) {
        throw new Error("Admin unlock is not configured on the server.");
      }
      if ((body.adminCode ?? "").trim() !== expectedCode.trim()) {
        throw new Error("Invalid admin code.");
      }
    }

    const user = await updateSubscription(sessionToken, body.subscriptionPlan ?? "free");
    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update subscription.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
