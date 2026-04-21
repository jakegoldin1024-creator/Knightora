import type { Metadata } from "next";
import { CoachPage } from "@/components/coach-page";

export const metadata: Metadata = {
  title: "Chess coach",
  description: "Talk chess with Knightneo’s text coach—openings, habits, and study direction. No sign-in required.",
};

export default function CoachRoute() {
  return <CoachPage />;
}
