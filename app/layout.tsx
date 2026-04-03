import { ClerkProvider } from "@clerk/nextjs";
import type { ReactNode } from "react";
import { clerkAuthAppearance } from "@/lib/clerk-auth-appearance";
import "./globals.css";
import "./immersive.css";
import "./clerk-neo.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen w-full antialiased">
        <ClerkProvider
          appearance={clerkAuthAppearance}
          signInUrl="/sign-in"
          signUpUrl="/sign-up"
          signInFallbackRedirectUrl="/quiz"
          signUpFallbackRedirectUrl="/quiz"
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
