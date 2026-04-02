/** Shared subscription tier — safe to import from client components. */
export type SubscriptionPlan = "free" | "paid" | "admin";

export function isPaidPlan(plan: SubscriptionPlan): boolean {
  return plan === "paid" || plan === "admin";
}
