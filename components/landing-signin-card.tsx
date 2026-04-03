"use client";

import { SignIn, useAuth } from "@clerk/nextjs";
import { clerkAuthAppearance } from "@/lib/clerk-auth-appearance";
import styles from "./landing-page.module.css";

export function LandingSignInCard() {
  const { isLoaded, isSignedIn } = useAuth();
  if (isLoaded && isSignedIn) return null;

  return (
    <section className={styles.signInSection}>
      <div className={styles.panel}>
        <p className={styles.eyebrow}>Account</p>
        <h3 className={styles.signInTitle}>Welcome back</h3>
        <p className={styles.signInCopy}>One account keeps your quiz, openings, and streaks synced—phone, laptop, wherever you train.</p>
        <div className={styles.signInEmbed}>
          <SignIn
            routing="hash"
            signUpUrl="/sign-up"
            fallbackRedirectUrl="/"
            oauthFlow="redirect"
            appearance={clerkAuthAppearance}
          />
        </div>
      </div>
    </section>
  );
}
