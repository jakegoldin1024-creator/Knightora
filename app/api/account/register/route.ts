import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getSessionCookieName, registerUser } from "@/lib/account-store";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      password?: string;
    };

    const result = await registerUser({
      name: body.name ?? "",
      email: body.email ?? "",
      password: body.password ?? "",
      // Always start on free; paid/admin entitlements come from Stripe/admin flow only.
      subscriptionPlan: "free",
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
