"use client";

import { useEffect, useState } from "react";
import { SiteNav } from "@/components/site-nav";
import { GameAnalysisPanel } from "@/components/game-analysis-panel";
import { type SubscriptionPlan } from "@/lib/subscription";
import styles from "./analysis-page.module.css";

export function AnalysisPage() {
  const [plan, setPlan] = useState<SubscriptionPlan>("free");

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch("/api/account/me");
        const payload = (await response.json()) as { user: { subscriptionPlan: SubscriptionPlan } | null };
        if (payload.user?.subscriptionPlan) {
          setPlan(payload.user.subscriptionPlan);
        }
      } catch {
        // keep free fallback
      }
    }
    void load();
  }, []);

  return (
    <>
      <SiteNav active="analysis" />
      <main className={styles.shell}>
        <section className={styles.hero}>
          <p className={styles.lede}>Analyze your games in a dedicated workspace without interrupting your lesson and variation flow.</p>
        </section>
        <GameAnalysisPanel selectedPlan={plan} />
      </main>
    </>
  );
}
