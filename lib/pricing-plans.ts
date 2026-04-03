import type { SubscriptionPlan } from "@/lib/subscription";

export type { SubscriptionPlan };

export type PlanDefinition = {
  id: SubscriptionPlan;
  name: string;
  price: string;
  description: string;
  features: string[];
  idealFor: string;
  cta: string;
};

export const PRICING_PLANS: PlanDefinition[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    description: "Browse marketing pages only. Training, analysis, and the full product require a subscription.",
    features: ["View Home and Pricing", "Sign in or create an account", "No opening training, drills, or game analysis"],
    idealFor: "Anyone evaluating whether Knightneo is a fit before subscribing.",
    cta: "View pricing",
  },
  {
    id: "paid",
    name: "Knightneo",
    price: "$9.99/mo or $99.99/yr",
    description: "Full access: repertoire quiz, all lesson tiers, deviations, game analysis, Stockfish on positions, and cloud sync.",
    features: [
      "Everything in the product: quiz, training paths, board drills",
      "Full-game PGN/URL coach analysis",
      "Stockfish analysis on lesson positions",
      "Extra line depth (starter/club/pro-style drills) in one tier",
      "Account-backed dashboard sync across devices",
    ],
    idealFor: "Players who want one simple subscription for the whole platform.",
    cta: "Subscribe",
  },
  {
    id: "admin",
    name: "Admin Unlock",
    price: "$0",
    description: "Internal testing and demo mode unlocked by admin code.",
    features: ["All paid capabilities", "For QA and demos", "Not a public purchase tier"],
    idealFor: "Internal use only.",
    cta: "Internal only",
  },
];
