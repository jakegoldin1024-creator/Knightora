import { SignUp } from "@clerk/nextjs";
import { clerkAuthAppearance } from "@/lib/clerk-auth-appearance";
import styles from "@/app/auth-shell.module.css";

export default function Page() {
  return (
    <main className={styles.shell}>
      <div className={styles.inner}>
        <p className={styles.eyebrow}>Knightneo account</p>
        <h1 className={styles.title}>Create your account</h1>
        <p className={styles.lede}>Save your repertoire, track progress, and train on any device.</p>
        <div className={styles.embed}>
          <SignUp
            path="/sign-up"
            routing="path"
            signInUrl="/sign-in"
            fallbackRedirectUrl="/"
            oauthFlow="redirect"
            appearance={clerkAuthAppearance}
          />
        </div>
      </div>
    </main>
  );
}
