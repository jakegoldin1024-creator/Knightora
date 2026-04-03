import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getSessionAccount, getSessionCookieName } from "@/lib/account-store";
import { isPaidPlan } from "@/lib/subscription";
import { resolveClerkKnightneoAccount } from "@/lib/clerk-account";
import { analyzeGamePgn, type AnalysisLevel } from "@/lib/game-analysis";
import { importGameFromInput } from "@/lib/game-import";
import { buildCoachSummary } from "@/lib/coach-prompt";

export async function POST(request: NextRequest) {
  try {
    const account = await resolveAccount();
    const plan = account?.user.subscriptionPlan ?? "free";
    if (!isPaidPlan(plan)) {
      return NextResponse.json(
        { error: "Full-game analysis is included with a Knightneo subscription ($9.99/mo or $99.99/yr)." },
        { status: 403 },
      );
    }

    const body = (await request.json()) as {
      pgn?: string;
      url?: string;
      level?: AnalysisLevel;
    };
    const level = parseLevel(body.level);
    const imported = await importGameFromInput({ pgn: body.pgn, url: body.url });
    const report = analyzeGamePgn({
      pgn: imported.pgn,
      source: imported.source,
      level,
    });
    const coach = await buildCoachSummary(report);
    return NextResponse.json({ report, coach }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to analyze this game.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

async function resolveAccount() {
  const clerkAccount = await resolveClerkKnightneoAccount();
  if (clerkAccount) return clerkAccount;
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(getSessionCookieName())?.value;
  return getSessionAccount(sessionToken);
}

function parseLevel(value: string | undefined): AnalysisLevel {
  if (value === "beginner" || value === "developing" || value === "improving" || value === "advanced") return value;
  return "developing";
}

