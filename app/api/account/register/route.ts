import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getSessionCookieName, registerUser, type SubscriptionPlan } from "@/lib/account-store";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      password?: string;
      subscriptionPlan?: SubscriptionPlan;
    };

    const result = await registerUser({
      name: body.name ?? "",
      email: body.email ?? "",
      password: body.password ?? "",
      subscriptionPlan: body.subscriptionPlan ?? "free",
    });

    const cookieStore = await cookies();
    cookieStore.set(getSessionCookieName(), result.sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });

    return NextResponse.json({ user: result.user, dashboard: result.dashboard }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create account.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
