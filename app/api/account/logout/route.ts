import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionCookieName, logoutUser } from "@/lib/account-store";

export async function POST() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(getSessionCookieName())?.value;
  await logoutUser(sessionToken);
  cookieStore.delete(getSessionCookieName());
  return NextResponse.json({ ok: true }, { status: 200 });
}
