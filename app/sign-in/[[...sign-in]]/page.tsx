import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        width: "100%",
        background: "#f7f4ee",
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
        <p style={{ fontSize: "12px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#737373", marginBottom: "12px" }}>
          Knightora Account
        </p>

        <h1 style={{ fontSize: "48px", fontWeight: 600, color: "#171717", margin: "0 0 16px 0", lineHeight: 1.1 }}>
          Sign in to Knightora
        </h1>

        <p style={{ color: "#525252", fontSize: "18px", margin: "0 0 32px 0" }}>
          Save your repertoire, track progress, and train smarter.
        </p>

        <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
          <SignIn
            path="/sign-in"
            routing="path"
            signUpUrl="/sign-up"
            fallbackRedirectUrl="/"
            oauthFlow="redirect"
            appearance={{
              elements: {
                rootBox: "mx-auto",
                card: "mx-auto",
              },
              variables: {
                colorPrimary: "#2f2f2f",
                borderRadius: "14px",
              },
            }}
          />
        </div>
      </div>
    </main>
  );
}