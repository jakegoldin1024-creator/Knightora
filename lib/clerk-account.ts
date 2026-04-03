import { auth, currentUser } from "@clerk/nextjs/server";
import { syncClerkAccount } from "@/lib/account-store";
import { mergeFilePlanWithClerkMetadata } from "@/lib/clerk-subscription-sync";

/** Loads Clerk session and syncs/creates the matching Knightneo user row. */
export async function resolveClerkKnightneoAccount() {
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
  const account = await syncClerkAccount({
    clerkUserId: userId,
    email: clerkUser?.primaryEmailAddress?.emailAddress,
    firstName: clerkUser?.firstName,
    lastName: clerkUser?.lastName,
    username: clerkUser?.username,
  });

  const mergedPlan = mergeFilePlanWithClerkMetadata(
    account.user.subscriptionPlan,
    clerkUser?.publicMetadata as Record<string, unknown> | undefined,
  );

  if (mergedPlan === account.user.subscriptionPlan) return account;

  return {
    ...account,
    user: { ...account.user, subscriptionPlan: mergedPlan },
  };
}
