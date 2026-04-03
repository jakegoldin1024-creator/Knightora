const openingCatalog = {
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
      tags: ["open", "initiative", "medium", "sharp", "blitz", "improving"],
      summary: "Quick central tension and straightforward development into active positions.",
      why: "A strong fit for players who want direct play and do not mind entering tactical middlegames.",
      study: ["Know the main response to ...Nf6.", "Practice early d4 breaks.", "Review common tactical motifs on e-file."],
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
      tags: ["open", "counterplay", "high", "sharp", "blitz", "advanced"],
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
      tags: ["open", "clarity", "low", "balanced", "blitz", "beginner"],
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

const ratingMap = {
  beginner: "beginner",
  developing: "developing",
  improving: "improving",
  advanced: "advanced",
};

const form = document.querySelector("#knightneo-form");
const resultsPanel = document.querySelector("#results");
const recommendationsNode = document.querySelector("#recommendations");
const summaryNode = document.querySelector("#results-summary");
const studyPlanNode = document.querySelector("#study-plan");

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const profile = {
    rating: formData.get("rating"),
    positionType: formData.get("positionType"),
    theory: formData.get("theory"),
    risk: formData.get("risk"),
    timeControl: formData.get("timeControl"),
    goal: formData.get("goal"),
    username: String(formData.get("username") || "").trim(),
  };

  const repertoire = {
    white: rankOpenings(openingCatalog.white, profile)[0],
    blackE4: rankOpenings(openingCatalog.blackE4, profile)[0],
    blackD4: rankOpenings(openingCatalog.blackD4, profile)[0],
  };

  renderResults(profile, repertoire);
});

function rankOpenings(openings, profile) {
  return openings
    .map((opening) => ({
      ...opening,
      score: calculateScore(opening, profile),
    }))
    .sort((left, right) => right.score - left.score);
}

function calculateScore(opening, profile) {
  let score = 0;

  if (opening.tags.includes(profile.positionType)) score += 3;
  if (profile.positionType === "mixed" && opening.tags.includes("balanced")) score += 2;
  if (opening.tags.includes(profile.goal)) score += 3;
  if (opening.tags.includes(profile.theory)) score += 3;
  if (opening.tags.includes(profile.timeControl)) score += 2;
  if (opening.tags.includes(profile.risk)) score += 3;
  if (opening.tags.includes(ratingMap[profile.rating])) score += 2;

  if (profile.theory === "low" && opening.tags.includes("high")) score -= 4;
  if (profile.risk === "solid" && opening.tags.includes("sharp")) score -= 4;
  if (profile.risk === "sharp" && opening.tags.includes("solid")) score -= 1;
  if (profile.timeControl === "bullet" && opening.tags.includes("classical")) score -= 2;

  return score;
}

function renderResults(profile, repertoire) {
  resultsPanel.classList.remove("hidden");

  const nameText = profile.username
    ? ` For now, the recommendation is based on your quiz answers and the placeholder Chess.com username "${escapeHtml(profile.username)}".`
    : " This first recommendation is based on your quiz answers alone.";

  summaryNode.innerHTML = `
    <p>
      You profile as a <strong>${describeStyle(profile)}</strong> player who wants
      <strong>${describeGoal(profile.goal)}</strong>.${nameText}
    </p>
    <p>
      In the full product, this is where Knightneo would compare your self-image with your actual
      game history and adjust your repertoire based on real opening usage, win rate, and recurring middlegame patterns.
    </p>
  `;

  recommendationsNode.innerHTML = `
    ${buildCard("White", repertoire.white, "piece-tag")}
    ${buildCard("Black vs 1.e4", repertoire.blackE4, "piece-tag piece-tag-dark")}
    ${buildCard("Black vs 1.d4", repertoire.blackD4, "piece-tag piece-tag-dark")}
  `;

  studyPlanNode.innerHTML = `
    <h3>What to build next</h3>
    <p>
      Your first version of Knightneo should feel opinionated: one clear repertoire, one reason it fits, and one study path.
      Avoid turning this into a giant opening encyclopedia too early.
    </p>
    <ul>
      <li>Connect live Chess.com data and measure actual opening frequency and performance.</li>
      <li>Add a confidence score that combines quiz fit with real game evidence.</li>
      <li>Store user profiles so recommendations improve as more games are analyzed.</li>
    </ul>
  `;

  resultsPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function buildCard(label, opening, tagClassName) {
  return `
    <article class="result-card">
      <span class="${tagClassName}">${label}</span>
      <h3>${opening.name}</h3>
      <p>${opening.summary}</p>
      <p><strong>Why it fits:</strong> ${opening.why}</p>
      <ul>
        ${opening.study.map((item) => `<li>${item}</li>`).join("")}
      </ul>
    </article>
  `;
}

function describeStyle(profile) {
  const descriptors = {
    open: "dynamic",
    mixed: "flexible",
    closed: "strategic",
  };

  const riskDescriptors = {
    sharp: "attack-minded",
    balanced: "balanced",
    solid: "stability-first",
  };

  return `${descriptors[profile.positionType]} and ${riskDescriptors[profile.risk]}`;
}

function describeGoal(goal) {
  if (goal === "initiative") return "early initiative";
  if (goal === "clarity") return "clear, repeatable plans";
  return "counterplay and active chances";
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
