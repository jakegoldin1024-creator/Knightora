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
            <h1 className={styles.title}>Prep that shows up in your games.</h1>
            <p className={styles.onboardingNotice}>Sign in once—your quiz, lines, and streaks follow you.</p>
            <p className={styles.lede}>
              You’re not reading PDFs—you’re tapping real positions, walking main ideas, and (with a sub) leaning on Stockfish and full-game coaching
              when it counts.
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
              <Link className={styles.btnAlt} href="/coach">
                Study coach
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
                <li>Main-line spine free—go deeper with a subscription</li>
                <li>Onboarding (style + study time + quick puzzle check) → suggested openings → branch tabiyas on the board → drills</li>
                <li>Daily quests on the dashboard (UTC day) — tactics, repertoire, reviews, Chess.com-informed prompts when linked</li>
                <li>
                  <strong>Study coach</strong> (sign in): chat about chess on <Link href="/coach">/coach</Link>. Separate from PGN analysis.
                </li>
                <li>Subscribers: PGN / URL analysis + written coach-style notes on /analysis</li>
              </ul>
            </aside>
          </div>
        </section>

        <section className={styles.howItWorks} aria-labelledby="how-heading">
          <div className={styles.panel}>
            <p className={styles.eyebrow}>How it works</p>
            <h2 id="how-heading" className={styles.sectionTitle}>
              How you’ll go from “I don’t know what to play” to a line you trust
            </h2>
            <ol className={styles.steps}>
              <li>
                <strong>Onboarding</strong>
                <span>Rating band, study-time commitment, a short puzzle diagnostic, time control, risk, and goals—so suggestions and daily quests fit your real games.</span>
              </li>
              <li>
                <strong>Three suggested systems</strong>
                <span>White plus Black vs 1.e4 and vs 1.d4, ranked for your profile—not a generic list.</span>
              </li>
              <li>
                <strong>Why each line works</strong>
                <span>Short rationale, study angles, and evidence you can trust before you commit.</span>
              </li>
              <li>
                <strong>Pick one opening to hone</strong>
                <span>Intro, primer with mini-boards for each branch, you choose the line, then chapter drills on the board.</span>
              </li>
              <li>
                <strong>Daily quests (dashboard)</strong>
                <span>After onboarding, UTC-day quests blend tactics, repertoire wins, reviews, and Chess.com-flavored goals—optional light-day mode when you need a smaller plate.</span>
              </li>
              <li>
                <strong>Optional: AI Study coach</strong>
                <span>
                  After sign-in, open <Link href="/coach">Study coach</Link> for conversational help—different from the PGN game coach on /analysis.
                </span>
              </li>
              <li>
                <strong>Optional: full-game analysis</strong>
                <span>Paste a PGN or link; subscribed users get move-by-move feedback and coach-style notes (heuristic engine, not live Stockfish).</span>
              </li>
            </ol>
          </div>
        </section>

        <section className={styles.featuresRow} aria-label="Product areas">
          <ul className={styles.featureLinks}>
            <li>
              <Link href="/quiz">Quiz &amp; training</Link>
              <span>Build the dashboard and work through your chosen line.</span>
            </li>
            <li>
              <Link href="/analysis">Game analysis</Link>
              <span>Upload or link a game; see key moments and practical alternatives.</span>
            </li>
            <li>
              <Link href="/coach">Study coach</Link>
              <span>Talk chess with an AI coach (sign in). For reviewed games, use analysis instead.</span>
            </li>
            <li>
              <Link href="/pricing">Pricing</Link>
              <span>Main lines free; subscription unlocks branches, Stockfish on lessons, and analysis.</span>
            </li>
          </ul>
        </section>

        <section className={styles.sections}>
          <article className={styles.panel}>
            <h3>Choose</h3>
            <p className={styles.pillarBody}>
              The quiz narrows thousands of lines to three coherent repertoires. You see <em>why</em> each opening fits—structure,
              theory load, and tempo—before you invest study time.
            </p>
          </article>
          <article className={styles.panel}>
            <h3>Drill</h3>
            <p className={styles.pillarBody}>
              Lessons live on a real board: squares, move order, and main ideas—not PDFs. Free users get the main spine; paid
              unlocks deviations, deeper branches, and engine support where it helps most.
            </p>
          </article>
          <article className={styles.panel}>
            <h3>Improve</h3>
            <p className={styles.pillarBody}>
              Streaks, chapters, and review hooks keep prep honest. When you subscribe, tie real games back to prep with PGN or
              Chess.com / Lichess links.
            </p>
          </article>
        </section>

        <section className={styles.faq} aria-labelledby="faq-heading">
          <div className={styles.panel}>
            <p className={styles.eyebrow}>FAQ</p>
            <h2 id="faq-heading" className={styles.sectionTitle}>
              Quick answers
            </h2>
            <dl className={styles.faqList}>
              <dt>Do I need an account?</dt>
              <dd>
                Sign in with Clerk (email or Google) so your quiz results, chosen lines, and progress sync. You can browse the
                landing page without an account.
              </dd>
              <dt>What is free vs paid?</dt>
              <dd>
                Main-line training and the quiz are free. A subscription adds extra branches, Stockfish on lesson positions, and
                full-game analysis with coach-style summaries.
              </dd>
              <dt>How does Stockfish show up?</dt>
              <dd>
                On supported lesson screens, subscribed users can run analysis in the browser to check critical positions—without
                leaving the drill.
              </dd>
              <dt>What do I paste for game analysis?</dt>
              <dd>
                A complete PGN, or a public Chess.com or Lichess game URL. Analysis requires an active subscription; parsing and
                privacy stay on Knightneo’s servers.
              </dd>
              <dt>Is my data sold?</dt>
              <dd>
                Knightneo uses your account to save progress and billing. We do not sell personal data; use the product as
                described in our policies on the Clerk and payment providers you choose at checkout.
              </dd>
            </dl>
          </div>
        </section>

        <LandingSignInCard />
      </main>
    </>
  );
}
