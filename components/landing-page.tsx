import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { LandingSignInCard } from "@/components/landing-signin-card";
import { LandingHeroBoard } from "@/components/landing-hero-board";
import styles from "./landing-page.module.css";

export function LandingPage() {
  return (
    <>
      <SiteNav active="home" />
      <main className={styles.shell}>
        <section className={styles.hero}>
          <div className={styles.panel}>
            <p className={styles.eyebrow}>Opening prep</p>
            <h1 className={styles.title}>Turn prep into pressure.</h1>
            <p className={styles.onboardingNotice}>Step 1: Sign in so your lines and progress save.</p>
            <p className={styles.lede}>
              Board drills on real positions. One subscription unlocks every branch, Stockfish on lessons, and full-game analysis.
            </p>
            <div className={styles.actions}>
              <Link className={styles.btn} href="/sign-in">
                Sign in to start
              </Link>
              <Link className={styles.btnAlt} href="/quiz">
                Open quiz
              </Link>
              <Link className={styles.btnAlt} href="/analysis">
                Analysis
              </Link>
              <Link className={styles.btnAlt} href="/pricing">
                Pricing
              </Link>
            </div>
          </div>
          <div className={styles.heroBoardColumn}>
            <LandingHeroBoard />
            <aside className={styles.panelMuted}>
              <p className={styles.eyebrow}>On the board</p>
              <ul className={styles.listTight}>
                <li>Main-line drills free · deeper branches with sub</li>
                <li>Quiz → repertoire → chapter lessons</li>
                <li>PGN coach summaries when subscribed</li>
              </ul>
            </aside>
          </div>
        </section>

        <section className={styles.sections}>
          <article className={styles.panel}>
            <h3>Choose</h3>
            <p>Repertoire matched to how you play.</p>
          </article>
          <article className={styles.panel}>
            <h3>Drill</h3>
            <p>Move order on a real board—not walls of text.</p>
          </article>
          <article className={styles.panel}>
            <h3>Improve</h3>
            <p>Turn games into the next lesson.</p>
          </article>
        </section>

        <LandingSignInCard />
      </main>
    </>
  );
}
