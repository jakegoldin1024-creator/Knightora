import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        width: "100%",
        background: "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "720px",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <p style={{ fontSize: "12px", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--muted)", marginBottom: "12px" }}>
          Knightora Account
        </p>

        <h1 style={{ fontSize: "48px", fontWeight: 600, color: "var(--text)", margin: "0 0 16px 0", lineHeight: 1.1 }}>
          Sign up for Knightora
        </h1>

        <p style={{ color: "var(--muted)", fontSize: "18px", margin: "0 0 32px 0" }}>
          Create your account to save your repertoire and unlock your training.
        </p>

        <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
          <SignUp
            path="/sign-up"
            routing="path"
            signInUrl="/sign-in"
            fallbackRedirectUrl="/"
            oauthFlow="redirect"
            appearance={{
              elements: {
                rootBox: "mx-auto",
                card: "mx-auto",
              },
              variables: {
                colorPrimary: "#ff6b5c",
                colorBackground: "#151722",
                colorText: "#f2f0f8",
                colorTextSecondary: "#9a95ab",
                colorInputBackground: "#1c1f2a",
                colorNeutral: "#2a2e3d",
                borderRadius: "14px",
              },
            }}
          />
        </div>
      </div>
    </main>
  );
}