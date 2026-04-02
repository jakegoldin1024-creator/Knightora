import { clerkMiddleware } from "@clerk/nextjs/server";

/** Next.js 16+: `middleware` convention renamed to `proxy` (same matcher + Clerk behavior). */
export default clerkMiddleware();

export const config = {
  matcher: [
    // Pages + assets (exclude /api so we don’t match twice)
    "/((?!api|trpc|_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Clerk needs to run on API routes so `auth()` works in Route Handlers (checkout, account/me, etc.)
    "/(api|trpc)(.*)",
  ],
};
