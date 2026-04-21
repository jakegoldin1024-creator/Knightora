import { NextRequest, NextResponse } from "next/server";
import type { DailyPuzzle } from "@/data/daily-puzzles";
import { fetchLichessPuzzleBatch } from "@/lib/lichess-puzzles";

/**
 * GET /api/puzzles/batch?count=5
 * Server-side Lichess puzzle fetch (avoids browser CORS; keeps a stable DTO).
 */
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("count");
  const count = Math.min(12, Math.max(1, Number(raw) || 5));

  try {
    const puzzles = await fetchLichessPuzzleBatch(count);
    return NextResponse.json({ puzzles }, { status: 200 });
  } catch {
    return NextResponse.json({ puzzles: [] as DailyPuzzle[], error: "lichess_unavailable" }, { status: 200 });
  }
}
