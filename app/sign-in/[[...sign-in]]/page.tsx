import { SignIn } from "@clerk/nextjs";
import { clerkAuthAppearance } from "@/lib/clerk-auth-appearance";
import styles from "@/app/auth-shell.module.css";

export default function Page() {
  return (
    <main className={styles.shell}>
      <div className={styles.inner}>
        <p className={styles.eyebrow}>Knightora account</p>
        <h1 className={styles.title}>Sign in to Knightora</h1>
        <p className={styles.lede}>Welcome back—sign in to sync your quiz, openings, and training.</p>
        <div className={styles.embed}>
          <SignIn
            path="/sign-in"
            routing="path"
            signUpUrl="/sign-up"
            fallbackRedirectUrl="/"
            oauthFlow="redirect"
            appearance={clerkAuthAppearance}
          />
        </div>
      </div>
    </main>
  );
}
