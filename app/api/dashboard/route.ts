import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getSessionAccount, getSessionCookieName, saveDashboard, type SavedDashboard } from "@/lib/account-store";

export async function GET() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(getSessionCookieName())?.value;
  const account = await getSessionAccount(sessionToken);
  return NextResponse.json({ dashboard: account?.dashboard ?? null }, { status: 200 });
}

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(getSessionCookieName())?.value;
    const dashboard = (await request.json()) as SavedDashboard;
    const result = await saveDashboard(sessionToken, dashboard);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save dashboard.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
