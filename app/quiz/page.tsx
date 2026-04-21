import { Suspense } from "react";
import { QuizExperience } from "@/components/quiz-experience";

export default function QuizRoute() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Loading…</div>}>
      <QuizExperience />
    </Suspense>
  );
}
