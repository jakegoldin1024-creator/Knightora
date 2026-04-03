import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionAccount, getSessionCookieName } from "@/lib/account-store";
import { resolveClerkKnightneoAccount } from "@/lib/clerk-account";

export async function GET() {
  const clerkAccount = await resolveClerkKnightneoAccount();
  if (clerkAccount) {
    return NextResponse.json(clerkAccount, { status: 200 });
  }

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(getSessionCookieName())?.value;
  const account = await getSessionAccount(sessionToken);

  if (!account) {
    return NextResponse.json({ user: null, dashboard: null }, { status: 200 });
  }

  return NextResponse.json(account, { status: 200 });
}
