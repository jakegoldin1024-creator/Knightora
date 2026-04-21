"use client";

import { SignInButton, useAuth } from "@clerk/nextjs";
import { SiteNav } from "@/components/site-nav";
import { CoachChat } from "@/components/coach-chat";
import styles from "./coach-page.module.css";

export function CoachPage() {
  const { isSignedIn, isLoaded } = useAuth();

  return (
    <>
      <SiteNav active="coach" />
      <main className={styles.shell}>
        <section className={styles.hero}>
          <h1 className={styles.title}>Chess coach chat</h1>
          <p className={styles.lede}>
            Ask anything about your chess—openings, plans, blunders, endgames, or how to study. Knightneo’s text coach answers here and can point you
            to in-app training and curated videos when they help.
          </p>
          {isLoaded && !isSignedIn ? (
            <p className={styles.guestBanner}>
              <span>You can chat without an account.</span>{" "}
              <SignInButton mode="modal">
                <button type="button" className={styles.signInLink}>
                  Sign in
                </button>
              </SignInButton>{" "}
              <span>to sync quiz progress and unlock a higher message limit.</span>
            </p>
          ) : null}
        </section>
        <section className={styles.panel}>
          <CoachChat />
        </section>
      </main>
    </>
  );
}
