type BranchId = "foundation" | "main" | "tournament" | "master";

export type TrainingTrackIntroVoice = {
  whyThisOpening: string;
  history: string;
  viability: string;
};

export type BranchVoicePatch = Partial<{
  summary: string;
  sampleLine: string;
  middlegamePlans: string[];
  commonMistakes: string[];
  timeControlFit: string;
}>;

export type OpeningTrainingVoice = {
  intro: TrainingTrackIntroVoice;
  branches: Partial<Record<BranchId, BranchVoicePatch>>;
};

/** Richer, opener-specific copy for intros and variation cards (merged onto generated defaults). */
export const OPENING_TRAINING_VOICE: Record<string, OpeningTrainingVoice> = {
  italian: {
    intro: {
      whyThisOpening:
        "You get a classical 1.e4 e5 battle where the Italian bishop eyes f7 and you can keep the game principled—great if you want initiative without drowning in Najdorf-level theory.",
      history:
        "From Greco’s gambits to today’s quiet d3 systems, the same threads repeat: fight for d5, keep e4 supported, and time Re1 / kingside pressure once Black’s structure declares itself.",
      viability:
        "Engines still respect these structures, and online you’re rarely blown off the board in ten moves when your move-order spine is solid.",
    },
    branches: {
      foundation: {
        summary: "Quiet Italian with d3/c3—low burn, high clarity.",
        sampleLine: "1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5 4.c3 Nf6 5.d3 d6 with slow Re1 ideas.",
        middlegamePlans: ["Finish development before pawn breaks", "Eye f2–f4 once the king is safe", "Use the Italian bishop to restrain …d5 timing"],
      },
      main: {
        summary: "The practical club backbone: c3, d3, Nbd2, Re1, and familiar attacking schemes.",
        sampleLine: "Classical slow build where you improve every piece before opening the center.",
        middlegamePlans: ["Contest d5 without overcommitting pawns", "Prepare f4 or d4 when pieces are ready", "Watch …Ng4 and …d5 break timing"],
      },
      tournament: {
        summary: "Sharper Italian branches where move order punishes sloppy Black play.",
        sampleLine: "Lines where White gains tempi on the kingside or seizes the center earlier.",
        middlegamePlans: ["Calculate one forcing line past the tabiya", "Know when to cash in with d4", "Keep king safety parity in open e-file games"],
      },
      master: {
        summary: "Heavy-prep Italian—exact orders, rare sidelines, and engine-checked pawn breaks.",
        sampleLine: "Prepared gambits and modern Italian tries where one tempo decides the file.",
        middlegamePlans: ["Hold transpositions into your best structures", "Prep surprise on move 8–12", "Balance risk vs. surprise value"],
      },
    },
  },
  london: {
    intro: {
      whyThisOpening:
        "You’re choosing a system: similar pawn shapes, familiar plans, and fewer “I forgot my line” moments—perfect if you want reps, not a second job.",
      history:
        "London-style setups have fueled generations of club champions because the ideas transfer: fianchettoed bishop, compact center, kingside pressure when Black misplaces a knight.",
      viability:
        "It scales from rapid to classical; the ceiling is your middlegame skill, not whether you memorized a rare seventh-move sideline.",
    },
    branches: {
      foundation: {
        summary: "Pure London shell—Bf4, e3, c3, Nf3, slow h3 if needed.",
        middlegamePlans: ["Complete the triangle before chasing tactics", "Meet …c5 with clarity on the d-file", "Don’t rush e4 until development wins"],
      },
      main: {
        summary: "Standard London versus …d5 / …e6 setups with typical Bd3 and e4 breaks.",
        middlegamePlans: ["Fight for e4–e5 space", "Use the London bishop to limit …c5", "Know your plan vs …Qb6"],
      },
      tournament: {
        summary: "Aggressive London tries—early h4 ideas, sharp e4 pushes, punishing loose development.",
        middlegamePlans: ["Pick one forcing sequence you trust", "Calculate checks on the long diagonal", "Don’t overpress without development lead"],
      },
      master: {
        summary: "Deep London prep with antidotes to …c5, …Qb6, and early …Nc6 systems.",
        middlegamePlans: ["Prep exact move orders vs your feared lines", "Use transpositions to steer Black into your files", "Keep a backup quiet plan if theory dries up"],
      },
    },
  },
  qg: {
    intro: {
      whyThisOpening:
        "You’re playing for structure: minority attacks, IQP battles, and long-term pressure—chess that rewards patience and pattern memory.",
      history:
        "Queen’s Gambit ideas shaped modern chess; the plans outlive fashion because pawns and files don’t lie.",
      viability:
        "Still a mainline path to serious chess—if you enjoy grinding slightly better positions, this is your sandbox.",
    },
    branches: {
      foundation: {
        summary: "Solid QG setups with clear development and simple central tension.",
        middlegamePlans: ["Learn one tabiya deeply", "Practice minority attack motifs", "Don’t panic in hanging-pawn middlegames"],
      },
      main: {
        summary: "Classical QG structures with Exchange, main Slav transpositions, and central clarity.",
        middlegamePlans: ["Choose breaks based on piece placement", "Fight for the c-file when relevant", "Know when to simplify into a better endgame"],
      },
      tournament: {
        summary: "Sharper QG tries—early tension, gambit ideas, and forcing IQP play.",
        middlegamePlans: ["Calculate one pawn break fully", "Use open files before Black stabilizes", "Watch back-rank and weak-color complexes"],
      },
      master: {
        summary: "High-depth QG prep with novelties on moves 10–15 and exact endgame targets.",
        middlegamePlans: ["Map critical deviations by opponent style", "Prep endgames that arise from your lines", "Balance risk in preparation cycles"],
      },
    },
  },
  scotch: {
    intro: {
      whyThisOpening:
        "You open the center early, clarify the structure fast, and steer into open tactics—great if you’d rather calculate than maneuver forever.",
      history:
        "The Scotch resurfaced when players wanted concrete play after 1.e4 e5; the e-file and d-pawn tension still decide most games.",
      viability:
        "Practical at club level: fewer murky closed positions, more chances to punish slow development.",
    },
    branches: {
      foundation: {
        summary: "Scotch with sane development—avoid the wildest gambits until you’re ready.",
        middlegamePlans: ["Castle before grabbing material", "Use open files for rooks", "Keep knight outposts in mind on d5/f5"],
      },
      main: {
        summary: "Main Scotch battles after d4 with principled piece play.",
        middlegamePlans: ["Know your line vs …Nf6", "Fight for e5 and d4 squares", "Watch …Bc5 pins and …Qh4 ideas"],
      },
      tournament: {
        summary: "Forcing Scotch lines with sharp tactics and early queen sorties.",
        middlegamePlans: ["Calculate one line two moves past the tabiya", "Keep king safety in open positions", "Use checks to buy time when down in development"],
      },
      master: {
        summary: "Engine-checked Scotch prep with rare sidelines and move-order traps.",
        middlegamePlans: ["Hold forcing sequences in memory", "Prep surprises in secondary lines", "Know when to bail into a dry endgame"],
      },
    },
  },
  caro: {
    intro: {
      whyThisOpening:
        "You’re building a wall with …c6 that keeps the center flexible—solid, sober, and forgiving when White tries to blast you off the board.",
      history:
        "Caro structures have anchored black repertoires for a century; the bishop on f5 or g4 and the …c5 break are your recurring stories.",
      viability:
        "Excellent if you want fewer early disasters and more positions where understanding beats memorized traps.",
    },
    branches: {
      foundation: {
        summary: "Classical or Exchange Caro with clear development goals.",
        middlegamePlans: ["Time …c5 when the center invites it", "Fight the light-squared bishop issue early", "Castle to safety before pawn storms"],
      },
      main: {
        summary: "Mainline Advance and Two Knights ideas with concrete pawn plans.",
        middlegamePlans: ["Know when …c5 is correct vs premature", "Challenge White’s chain with …f6 ideas when thematic", "Use the semi-open files you create"],
      },
      tournament: {
        summary: "Sharper Caro tries—early breaks, tactical …e5 pushes, punishing loose White development.",
        middlegamePlans: ["Calculate forcing …c5 lines", "Watch for Nd5 jumps", "Keep king cover on the queenside"],
      },
      master: {
        summary: "Deep Caro prep with rare seventh-move options and endgame-specific choices.",
        middlegamePlans: ["Prep vs 3.Nc3 and 3.e5 separately", "Map transpositions into your best IQP structures", "Know your pawn-break triggers cold"],
      },
    },
  },
  sicilian: {
    intro: {
      whyThisOpening:
        "You’re signing up for imbalance: asymmetric pawn structures, rich tactics, and real winning chances when you’re willing to work.",
      history:
        "The Sicilian is the proving ground of modern prep—from Najdorf skirmishes to Anti-Sicilian headaches, the fight starts on move 2.",
      viability:
        "Still the default counter to 1.e4 at every level; the payoff is skill growth, not comfort.",
    },
    branches: {
      foundation: {
        summary: "One reliable Sicilian branch you can play on autopilot early on.",
        middlegamePlans: ["Choose a single system first (Dragon, Sveshnikov, etc.)", "Learn anti-Sicilian responses at a surface level", "Prioritize king safety in open Sicilians"],
      },
      main: {
        summary: "Representative mainline Sicilian with typical queenside expansion and central tension.",
        middlegamePlans: ["Know your …d5 or …e5 break timing", "Fight for the half-open c-file", "Calculate sacs around your king honestly"],
      },
      tournament: {
        summary: "Sharp Sicilian where one tempo on the queenside decides the attack race.",
        middlegamePlans: ["Prep forcing lines you enjoy repeating", "Watch White’s Nd5 and Bb5+ ideas", "Keep a defensive resource in your back pocket"],
      },
      master: {
        summary: "Maximum-depth Sicilian prep with novelties and multi-branch trees.",
        middlegamePlans: ["Maintain parallel files vs 2.c3 and 3.Bb5+", "Study model attacks in your exact variation", "Refresh prep after every bad loss in the line"],
      },
    },
  },
  french: {
    intro: {
      whyThisOpening:
        "You accept a cramped-looking pawn chain in exchange for counterpunching plans—structure-first chess with real teeth when you know the breaks.",
      history:
        "Winawer and Classical structures still decide thousands of games; the fight over …c5 and …f6 never gets old.",
      viability:
        "A lifetime defense: you can grow from club lines to deep theory without changing your identity.",
    },
    branches: {
      foundation: {
        summary: "Solid French setups with clear …c5 and king safety goals.",
        middlegamePlans: ["Learn one main system deeply first", "Fight the bad bishop problem with plans, not hope", "Castle before opening the center rashly"],
      },
      main: {
        summary: "Classical French tension with typical …c5 and piece trades that shape the fight.",
        middlegamePlans: ["Time …f6 when it helps, not when it weakens you", "Use queenside space if White overextends", "Know your plan vs the space-gaining e5 push"],
      },
      tournament: {
        summary: "Sharp French lines—early …Qb6, tactical …c5 breaks, and kingside counterplay.",
        middlegamePlans: ["Calculate …c5 sacrifices one line deep", "Watch f2/f7 weak points", "Keep rook lifts in mind"],
      },
      master: {
        summary: "Deep French prep with poisoned pawn ideas and engine-checked move orders.",
        middlegamePlans: ["Prep vs Exchange, Tarrasch, and Advance separately", "Know endgames you’re aiming for", "Refresh traps in your pet lines quarterly"],
      },
    },
  },
  scandinavian: {
    intro: {
      whyThisOpening:
        "You get out of the book fast, develop quickly, and steer into positions you can explain to a friend—minimal memorization, maximum board time.",
      history:
        "The Scandinavian has always been the pragmatist’s choice after 1.e4: clarity over glamour.",
      viability:
        "Especially strong in faster time controls where development lead matters more than subtle nuance.",
    },
    branches: {
      foundation: {
        summary: "Main queen retreat lines with simple development and safe king.",
        middlegamePlans: ["Complete development before chasing the queen", "Aim …c6 / …e6 structures you understand", "Avoid random queen hops that lose tempos"],
      },
      main: {
        summary: "Practical Scandinavian with healthy central breaks and piece coordination.",
        middlegamePlans: ["Fight for e5 and d5 influence", "Use semi-open files from early exchanges", "Castle to the side that matches your structure"],
      },
      tournament: {
        summary: "Trappy Scandinavian ideas that punish greedy captures and slow development.",
        middlegamePlans: ["Know one trap deeply—not ten shallowly", "Calculate checks after …Q moves", "Transition to endgames you’ve practiced"],
      },
      master: {
        summary: "Engine-sharpened Scandinavian orders with rare retreats and transpositions.",
        middlegamePlans: ["Prep vs 3.Nc3 and 3.d4 separately", "Know when to trade queens for initiative", "Keep a backup line vs annoying sidelines"],
      },
    },
  },
  qgd: {
    intro: {
      whyThisOpening:
        "You’re choosing a classical wall against 1.d4—sound pawn structure, clear plans, and positions that reward patience more than tricks.",
      history:
        "Orthodox and Exchange QGD ideas still appear at every elite event; the hanging pawns and minority attack are textbook chess.",
      viability:
        "If you want a defense you can grow old with, the QGD is a dependable spine.",
    },
    branches: {
      foundation: {
        summary: "Solid QGD development with …e6, …Nf6, and clear break ideas.",
        middlegamePlans: ["Know your …c5 timing", "Fight for e5 without locking your bishop in", "Castle where your structure tells you to"],
      },
      main: {
        summary: "Main QGD tabiyas with central tension and minority-attack motifs when relevant.",
        middlegamePlans: ["Challenge White’s center with thematic breaks", "Use the c-file when it opens", "Simplify when you’re structurally worse"],
      },
      tournament: {
        summary: "Sharper QGD tries—early …c5, piece sacrifices, and forcing central breaks.",
        middlegamePlans: ["Calculate one central break fully", "Watch weak dark squares", "Keep rooks coordinated on open files"],
      },
      master: {
        summary: "Deep QGD prep with Exchange-specific endgames and Anti-Moscow sidelines mapped.",
        middlegamePlans: ["Prep move-order nuances vs 5.Bg5 systems", "Study model games in your exact pawn structure", "Know target endgames cold"],
      },
    },
  },
  slav: {
    intro: {
      whyThisOpening:
        "You keep the c6 pawn flexible so the light-squared bishop isn’t trapped—solid like a Slav, but a bit more oxygen than some QGD lines.",
      history:
        "Slav structures appear in world-title games because Black fights for …c5 and piece activity without collapsing.",
      viability:
        "A workhorse at rapid and classical; you’ll recognize the middlegames faster than in hyper-sharp gambits.",
    },
    branches: {
      foundation: {
        summary: "Mainline Slav development with a clear bishop plan.",
        middlegamePlans: ["Solve the Bc8 problem on your terms", "Prepare …c5 when the center allows", "Castle before pawn storms on the wing"],
      },
      main: {
        summary: "Classical Slav battles with central tension and typical breaks.",
        middlegamePlans: ["Contest d5 and c4 squares", "Use the semi-open b-file when it appears", "Know when to trade into a tenable endgame"],
      },
      tournament: {
        summary: "Sharper Slav lines with early …c5 and tactical central play.",
        middlegamePlans: ["Calculate …c5 tactics two moves deep", "Watch knight jumps to b5/c6", "Keep king safety when lines open"],
      },
      master: {
        summary: "Deep Slav prep including Chebanenko and Anti-Slav tries you actually face online.",
        middlegamePlans: ["Map deviations after 4.e3 and 4.Nc3", "Prep endgames from your tabiya", "Refresh engine updates quarterly"],
      },
    },
  },
  kid: {
    intro: {
      whyThisOpening:
        "You castle kingside, tuck your pieces, and dream of …e5 or …f5—high risk, high reward, and unforgettable when it works.",
      history:
        "The KID built legends on the kingside attack; modern prep is sharp, but the human story is always the same pawn storm.",
      viability:
        "Best when you enjoy calculation and accept that some lines are a coin flip if you’re underprepared.",
    },
    branches: {
      foundation: {
        summary: "Solid KID setups—complete development before committing the attack.",
        middlegamePlans: ["Know your …e5 vs …f5 choice in your line", "Don’t move the f-pawn without a reason", "Keep the g7 bishop sacred until the attack needs it"],
      },
      main: {
        summary: "Classical KID mainlines with typical queenside expansion vs kingside storm races.",
        middlegamePlans: ["Track both wings—don’t tunnel vision", "Use …c5 and …e5 breaks as counterplay", "Calculate sacs on f3/f2 carefully"],
      },
      tournament: {
        summary: "Sharp KID where one slow move lets White seize the center forever.",
        middlegamePlans: ["Prep forcing sequences you enjoy", "Know when to sacrifice vs when to defend", "Keep a defensive king move in mind"],
      },
      master: {
        summary: "Engine-heavy KID trees with Bayonet and Gligoric subtleties memorized.",
        middlegamePlans: ["Maintain parallel files vs Saemisch and Four Pawns", "Study model attacks in your exact pawn skeleton", "Refresh after every loss in the tabiya"],
      },
    },
  },
  nimzo: {
    intro: {
      whyThisOpening:
        "You invite doubled pawns or give the bishop pair to mess with White’s structure—rich strategy for players who like long-term imbalances.",
      history:
        "The Nimzo has been a repertoire pillar because flexibility beats rigidity: you steer the pawn skeleton before the middlegame begins.",
      viability:
        "Still a top-tier answer to 1.d4 when you’re willing to study plans, not just moves.",
    },
    branches: {
      foundation: {
        summary: "Solid Nimzo setups with clear development and central restraint.",
        middlegamePlans: ["Understand what you’re buying with doubled pawns", "Fight for e4/d5 blocks", "Castle to match your central tension"],
      },
      main: {
        summary: "Classical Nimzo tabiyas with …Bb4 pressure and typical …c5 ideas.",
        middlegamePlans: ["Know your plan vs 4.Qc2 and 4.e3", "Use the bishop pair tradeoff consciously", "Prepare …Ne4 and …f5 ideas when thematic"],
      },
      tournament: {
        summary: "Sharp Nimzo tries—early …c5, tactical hits on c3, and forcing piece play.",
        middlegamePlans: ["Calculate …c5 and …Qa5 ideas", "Watch weak dark squares after trades", "Keep rooks ready to seize open files"],
      },
      master: {
        summary: "Deep Nimzo prep with Hübner variations and rare fourth-move branches mapped.",
        middlegamePlans: ["Prep vs Leningrad and Samisch separately", "Study endgames from your IQP structures", "Track engine shifts in your pet line"],
      },
    },
  },
};
