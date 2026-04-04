"use client";

import { SiteNav } from "@/components/site-nav";
import { CoachChat } from "@/components/coach-chat";
import styles from "./coach-page.module.css";

export function CoachPage() {
  return (
    <>
      <SiteNav active="coach" />
      <main className={styles.shell}>
        <section className={styles.hero}>
          <h1 className={styles.title}>Study coach</h1>
          <p className={styles.lede}>
            Talk through what you’re working on—openings, endgames, habits—and get pointed at Knightneo training paths plus a few hand-picked study
            videos when they help.
          </p>
        </section>
        <section className={styles.panel}>
          <CoachChat />
        </section>
      </main>
    </>
  );
}
