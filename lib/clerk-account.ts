import { auth, currentUser } from "@clerk/nextjs/server";
import { syncClerkAccount } from "@/lib/account-store";

/** Loads Clerk session and syncs/creates the matching Knightora user row. */
export async function resolveClerkKnightoraAccount() {
  let userId: string | null = null;
  try {
    ({ userId } = await auth());
  } catch {
    // Some API routes intentionally skip Clerk middleware matching.
    // In that case, treat Clerk auth as unavailable and fall back to app-session auth.
    return null;
  }
  if (!userId) return null;

  const clerkUser = await currentUser();
  return syncClerkAccount({
    clerkUserId: userId,
    email: clerkUser?.primaryEmailAddress?.emailAddress,
    firstName: clerkUser?.firstName,
    lastName: clerkUser?.lastName,
    username: clerkUser?.username,
  });
}
