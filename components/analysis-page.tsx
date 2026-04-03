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
          <p className={styles.lede}>
            Bring a full game here when you’re ready to zoom out—no jumping out of your lesson flow. Subscribers get practical notes, not just engine
            noise.
          </p>
        </section>
        <GameAnalysisPanel selectedPlan={plan} />
      </main>
    </>
  );
}
