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
        <h3 className={styles.signInTitle}>Welcome back</h3>
        <p className={styles.signInCopy}>One account keeps your quiz, openings, and streaks synced—phone, laptop, wherever you train.</p>
        <div className={styles.signInEmbed}>
          <SignIn
            routing="hash"
            signUpUrl="/sign-up"
            fallbackRedirectUrl="/"
            oauthFlow="redirect"
            appearance={{
              variables: {
                colorPrimary: "#ff6b5c",
                colorBackground: "#151722",
                colorText: "#f2f0f8",
                colorTextSecondary: "#9a95ab",
                colorInputBackground: "#1c1f2a",
                colorNeutral: "#2a2e3d",
                borderRadius: "12px",
              },
            }}
          />
        </div>
      </div>
    </section>
  );
}
