import { auth, currentUser } from "@clerk/nextjs/server";
import { syncClerkAccount } from "@/lib/account-store";

/** Loads Clerk session and syncs/creates the matching Knightora user row. */
export async function resolveClerkKnightoraAccount() {
  const { userId } = await auth();
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
