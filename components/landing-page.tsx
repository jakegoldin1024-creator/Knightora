import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { LandingSignInCard } from "@/components/landing-signin-card";
import styles from "./landing-page.module.css";

export function LandingPage() {
  return (
    <>
      <SiteNav active="home" />
      <main className={styles.shell}>
        <section className={styles.hero}>
          <div className={styles.panel}>
            <p className={styles.eyebrow}>Focused opening prep</p>
            <h1 className={styles.title}>Turn prep into pressure.</h1>
            <p className={styles.onboardingNotice}>Step 1: Sign in first to save your training path and unlock guided progress.</p>
            <p className={styles.lede}>
              Knightora helps you pick the right repertoire, rehearse full lines on a board, and improve from your own games. Full training and analysis
              unlock with one subscription ($9.99/mo or $99.99/yr) — see Pricing.
            </p>
            <div className={styles.actions}>
              <Link className={styles.btn} href="/sign-in">
                Sign in to start
              </Link>
              <Link className={styles.btnAlt} href="/quiz">
                Open quiz
              </Link>
              <Link className={styles.btnAlt} href="/analysis">
                Game analysis
              </Link>
              <Link className={styles.btnAlt} href="/pricing">
                Pricing & FAQ
              </Link>
            </div>
          </div>
          <aside className={styles.panel}>
            <p className={styles.eyebrow}>What you get</p>
            <ul className={styles.list}>
              <li>Personalized opening recommendations from your profile and games.</li>
              <li>Move-order drills with chapter flow and deviation handling.</li>
              <li>Full-game coaching summaries with practical move alternatives.</li>
              <li>Progress tracking and spaced review behavior for weak lessons.</li>
            </ul>
          </aside>
        </section>

        <section className={styles.sections}>
          <article className={styles.panel}>
            <h3>1) Choose</h3>
            <p>Identify a repertoire matched to your style and time control.</p>
          </article>
          <article className={styles.panel}>
            <h3>2) Drill</h3>
            <p>Practice full lines and side branches until the move order sticks.</p>
          </article>
          <article className={styles.panel}>
            <h3>3) Improve</h3>
            <p>Analyze real games and convert mistakes into targeted training.</p>
          </article>
        </section>

        <LandingSignInCard />
      </main>
    </>
  );
}
