import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CoachPage } from "@/components/coach-page";

export const metadata: Metadata = {
  title: "Coach",
  description: "Knightneo study coach—training direction and curated resources.",
};

export default async function CoachRoute() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }
  return <CoachPage />;
}
