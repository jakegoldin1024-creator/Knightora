import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getSessionCookieName, loginUser } from "@/lib/account-store";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };

    const result = await loginUser(body.email ?? "", body.password ?? "");
    const cookieStore = await cookies();
    cookieStore.set(getSessionCookieName(), result.sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });

    return NextResponse.json({ user: result.user, dashboard: result.dashboard }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to sign in.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
