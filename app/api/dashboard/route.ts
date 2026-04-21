import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  getSessionAccount,
  getSessionCookieName,
  saveDashboard,
  saveDashboardForClerk,
  type SavedDashboard,
} from "@/lib/account-store";
import { resolveClerkKnightneoAccount } from "@/lib/clerk-account";
import { normalizeSavedDashboard } from "@/lib/merge-dashboard";
import { auth } from "@clerk/nextjs/server";

function normalizeDashboardOrNull(dashboard: SavedDashboard | null): SavedDashboard | null {
  if (!dashboard) return null;
  return normalizeSavedDashboard(dashboard) ?? dashboard;
}

export async function GET() {
  const { userId } = await auth();
  if (userId) {
    const account = await resolveClerkKnightneoAccount();
    return NextResponse.json({ dashboard: normalizeDashboardOrNull(account?.dashboard ?? null) }, { status: 200 });
  }

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(getSessionCookieName())?.value;
  const account = await getSessionAccount(sessionToken);
  return NextResponse.json({ dashboard: normalizeDashboardOrNull(account?.dashboard ?? null) }, { status: 200 });
}

export async function PUT(request: NextRequest) {
  try {
    const raw = await request.json();
    const dashboard = normalizeSavedDashboard(raw);
    if (!dashboard) {
      return NextResponse.json({ error: "Invalid dashboard payload." }, { status: 400 });
    }
    const { userId } = await auth();

    if (userId) {
      const result = await saveDashboardForClerk(userId, dashboard);
      const normalized = normalizeSavedDashboard(result.dashboard);
      return NextResponse.json({ ...result, dashboard: normalized ?? result.dashboard }, { status: 200 });
    }

    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(getSessionCookieName())?.value;
    const result = await saveDashboard(sessionToken, dashboard);
    const normalized = normalizeSavedDashboard(result.dashboard);
    return NextResponse.json({ ...result, dashboard: normalized ?? result.dashboard }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save dashboard.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
