import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionAccount, getSessionCookieName } from "@/lib/account-store";

export async function GET() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(getSessionCookieName())?.value;
  const account = await getSessionAccount(sessionToken);

  if (!account) {
    return NextResponse.json({ user: null, dashboard: null }, { status: 200 });
  }

  return NextResponse.json(account, { status: 200 });
}
