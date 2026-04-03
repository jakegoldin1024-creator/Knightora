import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { PRICING_PLANS } from "@/lib/pricing-plans";
import styles from "./pricing-page.module.css";

const PUBLIC_PLAN_IDS = new Set(["free", "paid"]);

export function PricingPage() {
  const plans = PRICING_PLANS.filter((plan) => PUBLIC_PLAN_IDS.has(plan.id));

  return (
    <>
      <SiteNav active="pricing" />
      <main className={styles.shell}>
        <section className={styles.hero}>
          <h1>One subscription. Everything in Knightneo.</h1>
          <p>
            Free is for browsing only. The full product — quiz, training, drills, game analysis, and Stockfish — unlocks with a single paid plan at
            $9.99/month or $99.99/year.
          </p>
          <div className={styles.ctaRow}>
            <Link href="/quiz" className={styles.btn}>
              Go to Quiz & subscribe
            </Link>
            <Link href="/sign-up" className={styles.btnAlt}>
              Create account
            </Link>
          </div>
        </section>

        <section className={styles.grid}>
          {plans.map((plan) => (
            <article className={styles.card} key={plan.id}>
              <h3>{plan.name}</h3>
              <p className={styles.price}>{plan.price}</p>
              <p className={styles.desc}>{plan.description}</p>
              <ul className={styles.list}>
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <p className={styles.ideal}>
                <strong>Best for:</strong> {plan.idealFor}
              </p>
            </article>
          ))}
        </section>

        <section className={styles.matrix}>
          <h3>Feature comparison</h3>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Capability</th>
                <th>Free</th>
                <th>Knightneo (paid)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Marketing pages (Home, Pricing)</td>
                <td>Yes</td>
                <td>Yes</td>
              </tr>
              <tr>
                <td>Style quiz, repertoire, board training, all lesson tiers</td>
                <td>No</td>
                <td>Yes</td>
              </tr>
              <tr>
                <td>Full-game PGN / URL coach analysis</td>
                <td>No</td>
                <td>Yes</td>
              </tr>
              <tr>
                <td>Stockfish on lesson positions</td>
                <td>No</td>
                <td>Yes</td>
              </tr>
              <tr>
                <td>Cloud sync & saved dashboard (signed in)</td>
                <td>No</td>
                <td>Yes</td>
              </tr>
            </tbody>
          </table>
        </section>
      </main>
    </>
  );
}
