/**
 * Internal QA: quiz “Admin unlock” + `PUT /api/subscription` with `subscriptionPlan: "admin"`.
 * Flip to `true` to restore; existing accounts that already have `admin` in Clerk/DB keep it until changed.
 */
export const ADMIN_UNLOCK_ENABLED = false;
