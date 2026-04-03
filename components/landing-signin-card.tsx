"use client";

import { SignIn, useAuth } from "@clerk/nextjs";
import styles from "./landing-page.module.css";

export function LandingSignInCard() {
  const { isLoaded, isSignedIn } = useAuth();
  if (isLoaded && isSignedIn) return null;

  return (
    <section className={styles.signInSection}>
      <div className={styles.panel}>
        <p className={styles.eyebrow}>Account</p>
        <h3 className={styles.signInTitle}>Sign in to Knightora</h3>
        <p className={styles.signInCopy}>Save your training path, streaks, and progress across devices.</p>
        <div className={styles.signInEmbed}>
          <SignIn
            routing="hash"
            signUpUrl="/sign-up"
            fallbackRedirectUrl="/"
            oauthFlow="redirect"
            appearance={{
              variables: {
                colorPrimary: "#1e1d1a",
                borderRadius: "12px",
              },
            }}
          />
        </div>
      </div>
    </section>
  );
}
