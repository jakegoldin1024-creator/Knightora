export type Opening = {
  name: string;
  key: string;
  tags: string[];
  summary: string;
  why: string;
  study: string[];
};

export const openingCatalog: Record<"white" | "blackE4" | "blackD4", Opening[]> = {
  white: [
    {
      name: "Italian Game",
      key: "italian",
      tags: ["open", "initiative", "medium", "balanced", "rapid", "beginner"],
      summary: "Active piece play and fast development without the workload of the sharpest theory.",
      why: "A flexible opening that teaches core attacking ideas while still being practical for most improving players.",
      study: ["Learn the main setup: c3, d3, Re1.", "Focus on piece activity over memorizing sidelines.", "Study 3 attacking model games."],
    },
    {
      name: "London System",
      key: "london",
      tags: ["closed", "clarity", "low", "solid", "rapid", "developing"],
      summary: "A low-maintenance system with repeatable setups and clear middlegame plans.",
      why: "Ideal if you want to spend less time memorizing and more time reaching familiar positions.",
      study: ["Memorize your first 6 moves.", "Practice typical kingside attacks.", "Review common ...c5 and ...Qb6 ideas."],
    },
    {
      name: "Queen's Gambit",
      key: "qg",
      tags: ["closed", "clarity", "medium", "solid", "classical", "advanced"],
      summary: "Strategic pressure with long-term structure and central control.",
      why: "Great for players who enjoy strategic buildup and want an opening with a long shelf life.",
      study: ["Understand the isolated queen pawn structures.", "Study minority attack themes.", "Review model games from classical play."],
    },
    {
      name: "Scotch Game",
      key: "scotch",
      tags: ["open", "initiative", "medium", "sharp", "bullet", "improving"],
      summary: "Quick central tension and straightforward development into active positions.",
      why: "A strong fit for players who want direct play and do not mind entering tactical middlegames.",
      study: ["Know the main response to ...Nf6.", "Practice early d4 breaks.", "Review common tactical motifs on the e-file."],
    },
  ],
  blackE4: [
    {
      name: "Caro-Kann Defense",
      key: "caro",
      tags: ["closed", "clarity", "low", "solid", "rapid", "developing"],
      summary: "Solid structure, dependable plans, and less chaos than all-out counterattacking openings.",
      why: "This keeps positions manageable and rewards understanding over memory.",
      study: ["Start with the Classical and Exchange lines.", "Learn light-squared bishop timing.", "Review pawn break ideas with ...c5 and ...e5."],
    },
    {
      name: "Sicilian Defense",
      key: "sicilian",
      tags: ["open", "counterplay", "high", "sharp", "bullet", "advanced"],
      summary: "Dynamic imbalance and winning chances if you are happy learning sharper theory.",
      why: "Best for players who want active counterplay and are comfortable with more theoretical upkeep.",
      study: ["Choose one branch first, like the Najdorf or Accelerated Dragon.", "Study anti-Sicilian responses.", "Focus on recurring tactical patterns."],
    },
    {
      name: "French Defense",
      key: "french",
      tags: ["closed", "counterplay", "medium", "balanced", "rapid", "improving"],
      summary: "Counterpunching structure with clear pawn-chain plans and resilient positions.",
      why: "A good match if you like structure but still want chances to fight back hard.",
      study: ["Learn the Winawer or Classical as one main branch.", "Understand breaks with ...c5 and ...f6.", "Practice bad-bishop problem solving."],
    },
    {
      name: "Scandinavian Defense",
      key: "scandinavian",
      tags: ["open", "clarity", "low", "balanced", "bullet", "beginner"],
      summary: "Simple development and direct plans, especially useful if you value quick practical positions.",
      why: "It limits study burden and gets you playing recognizable structures fast.",
      study: ["Learn one queen retreat setup.", "Practice development speed.", "Study common traps after 1.e4 d5 2.exd5 Qxd5."],
    },
  ],
  blackD4: [
    {
      name: "Queen's Gambit Declined",
      key: "qgd",
      tags: ["closed", "clarity", "medium", "solid", "classical", "advanced"],
      summary: "Reliable development and strong structure with plans that scale as you improve.",
      why: "A strong anchor defense for players who value consistency and strategic understanding.",
      study: ["Learn Orthodox setup basics.", "Understand c5 breaks.", "Review hanging pawn structures."],
    },
    {
      name: "Slav Defense",
      key: "slav",
      tags: ["closed", "clarity", "medium", "solid", "rapid", "improving"],
      summary: "Sound development with active counterplay and straightforward piece coordination.",
      why: "This fits players who want something dependable but slightly more active than the pure QGD structures.",
      study: ["Start with the mainline Slav.", "Learn how to develop the light-squared bishop.", "Practice typical ...c5 breaks."],
    },
    {
      name: "King's Indian Defense",
      key: "kid",
      tags: ["closed", "counterplay", "high", "sharp", "classical", "advanced"],
      summary: "Ambitious kingside attacking chances with rich plans and significant theoretical depth.",
      why: "A strong choice if you enjoy sharp play and are willing to study recurring attacking patterns deeply.",
      study: ["Learn main pawn structures first.", "Study thematic ...e5 and ...f5 plans.", "Review classic attacking model games."],
    },
    {
      name: "Nimzo-Indian Defense",
      key: "nimzo",
      tags: ["mixed", "clarity", "high", "balanced", "classical", "advanced"],
      summary: "Flexible piece pressure with rich strategic ideas and long-term positional rewards.",
      why: "Great for players who want a high-quality repertoire cornerstone and do not mind some study load.",
      study: ["Start with one response to 4.Qc2 and 4.e3.", "Understand doubled pawns versus bishop pair tradeoffs.", "Review central tension plans."],
    },
  ],
};
