"use client";

import Link from "next/link";
import { UserButton, useAuth } from "@clerk/nextjs";
import styles from "./site-nav.module.css";

export function SiteNav({ active }: { active: "home" | "pricing" | "quiz" | "analysis" | "coach" }) {
  const { isLoaded, isSignedIn } = useAuth();

  return (
    <nav className={styles.nav}>
      <div className={styles.navInner}>
        <Link className={styles.brand} href="/">
          <span className={styles.brandMark}>K</span>
          <span>Knightneo</span>
        </Link>
        <div className={styles.links}>
          <Link className={`${styles.link} ${active === "home" ? styles.linkActive : ""}`} href="/">
            Home
          </Link>
          <Link className={`${styles.link} ${active === "pricing" ? styles.linkActive : ""}`} href="/pricing">
            Pricing
          </Link>
          <Link className={`${styles.link} ${active === "quiz" ? styles.linkActive : ""}`} href="/quiz">
            Quiz
          </Link>
          <Link className={`${styles.link} ${active === "analysis" ? styles.linkActive : ""}`} href="/analysis">
            Analysis
          </Link>
          <Link className={`${styles.link} ${active === "coach" ? styles.linkActive : ""}`} href="/coach">
            Coach
          </Link>
          {isLoaded && isSignedIn ? (
            <UserButton />
          ) : (
            <Link className={styles.cta} href="/sign-in">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
