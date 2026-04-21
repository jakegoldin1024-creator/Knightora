import { createOpenAI } from "@ai-sdk/openai";
import { auth } from "@clerk/nextjs/server";
import { convertToModelMessages, safeValidateUIMessages, stepCountIs, streamText, type ToolSet } from "ai";
import { NextResponse } from "next/server";
import { KNIGHTNEO_COACH_SYSTEM } from "@/lib/knightneo-coach-system";
import { anonymousCoachClientKey, checkCoachRateLimit } from "@/lib/coach-rate-limit";
import { coachTools } from "@/lib/coach-tools";

const coachToolSet = coachTools as ToolSet;

export const maxDuration = 60;

export async function POST(req: Request) {
  const { userId } = await auth();
  const rateKey = userId ? `u:${userId}` : anonymousCoachClientKey(req);
  const rateClient = userId ? "signed" : "anonymous";

  if (!checkCoachRateLimit(rateKey, rateClient)) {
    const msg = userId
      ? "Too many requests. Try again in a minute."
      : "Too many messages for anonymous use. Sign in for a higher limit, or try again in a minute.";
    return NextResponse.json({ error: msg }, { status: 429 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Coach is not configured (missing OPENAI_API_KEY)." }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const messagesUnknown = (body as { messages?: unknown }).messages;
  if (!Array.isArray(messagesUnknown)) {
    return NextResponse.json({ error: "Expected messages array" }, { status: 400 });
  }

  // Tool schemas omitted: passing typed `coachTools` into validation hits index-signature friction; structure is still validated.
  const validated = await safeValidateUIMessages({
    messages: messagesUnknown,
  });

  if (!validated.success) {
    return NextResponse.json({ error: validated.error.message }, { status: 400 });
  }

  const openai = createOpenAI({ apiKey });
  const modelId = process.env.OPENAI_COACH_CHAT_MODEL ?? "gpt-4o-mini";

  const modelMessages = await convertToModelMessages(validated.data, {
    tools: coachToolSet,
  });

  const result = streamText({
    model: openai(modelId),
    system: KNIGHTNEO_COACH_SYSTEM,
    messages: modelMessages,
    tools: coachToolSet,
    temperature: 0.35,
    stopWhen: stepCountIs(10),
  });

  return result.toUIMessageStreamResponse();
}
