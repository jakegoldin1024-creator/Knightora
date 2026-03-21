import { NextRequest, NextResponse } from "next/server";
import { buildChessProfile } from "@/lib/chesscom";
import type { QuizProfile } from "@/lib/recommendations";

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("username")?.trim() ?? "";

  if (!username) {
    return NextResponse.json({ error: "A Chess.com username is required." }, { status: 400 });
  }

  const profile = parseQuizProfile(request.nextUrl.searchParams);

  try {
    const result = await buildChessProfile(username, profile);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to analyze that Chess.com profile.";
    const status = /could not find/i.test(message) ? 404 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}

function parseQuizProfile(searchParams: URLSearchParams): QuizProfile {
  return {
    rating: validateEnum(searchParams.get("rating"), ["beginner", "developing", "improving", "advanced"], "developing"),
    positionType: validateEnum(searchParams.get("positionType"), ["open", "mixed", "closed"], "mixed"),
    theory: validateEnum(searchParams.get("theory"), ["low", "medium", "high"], "medium"),
    risk: validateEnum(searchParams.get("risk"), ["sharp", "balanced", "solid"], "balanced"),
    timeControl: validateEnum(searchParams.get("timeControl"), ["bullet", "rapid", "classical"], "rapid"),
    goal: validateEnum(searchParams.get("goal"), ["initiative", "clarity", "counterplay"], "clarity"),
    username: searchParams.get("username")?.trim() ?? "",
  };
}

function validateEnum<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}
