/**
 * Main lines (~14 plies): free-tier full-line drills.
 * Premium lines: extra theory for paid plans.
 * All sequences validated with chess.js at build time.
 */

export const MAIN_LINE_MOVES: Record<string, string[]> = {
  italian: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "c3", "Nf6", "d3", "d6", "O-O", "O-O", "Re1", "Bd7"],
  london: ["d4", "d5", "Bf4", "Nf6", "e3", "e6", "c3", "c5", "Nd2", "Nc6", "Ngf3", "Bd6", "dxc5", "Bxc5"],
  qg: ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "Bg5", "dxc4", "e4", "h6", "Bxf6", "Qxf6", "e5", "Nd7"],
  scotch: ["e4", "e5", "Nf3", "Nc6", "d4", "exd4", "Nxd4", "Nf6", "Nc3", "Bb4", "Nxc6", "bxc6", "e5", "Nd5"],
  caro: ["e4", "c6", "d4", "d5", "Nc3", "dxe4", "Nxe4", "Nf6", "Nxf6+", "gxf6", "Nf3", "Bg4", "h3", "Bxf3"],
  sicilian: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "a6", "Be3", "e5", "Nb3", "Be6"],
  french: ["e4", "e6", "d4", "d5", "Nc3", "Nf6", "Bg5", "Bb4", "e5", "h6", "Bxf6", "Qxf6", "Nf3", "O-O"],
  scandinavian: ["e4", "d5", "exd5", "Qxd5", "Nc3", "Qa5", "d4", "Nf6", "Nf3", "Bg4", "Be2", "e6", "O-O", "Nc6"],
  qgd: ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "Bg5", "Be7", "e3", "O-O", "Nf3", "h6", "Bh4", "b6"],
  slav: ["d4", "d5", "c4", "c6", "Nc3", "Nf6", "Nf3", "dxc4", "a4", "Bf5", "Ne5", "e6", "f3", "Bb4"],
  kid: ["d4", "Nf6", "c4", "g6", "Nc3", "Bg7", "e4", "d6", "Nf3", "O-O", "Be2", "e5", "O-O", "Nc6"],
  nimzo: ["d4", "Nf6", "c4", "e6", "Nc3", "Bb4", "Qc2", "O-O", "a3", "Bxc3+", "Qxc3", "b6", "Nf3", "Bb7"],
};

/** One short teaching line per ply (aligned with MAIN_LINE_MOVES) for the default White / QG / London drills. */
export const MAIN_LINE_STEP_HINTS: Partial<Record<string, string[]>> = {
  italian: [
    "Seize central space and open diagonals for the queen and light-squared bishop.",
    "Black mirrors with a classical e5 pawn structure.",
    "Develop the king’s knight toward the center, attacking e5.",
    "Defend e5 by developing the queen’s knight.",
    "The Italian bishop targets the soft f7 square.",
    "Black develops the other bishop actively on the long diagonal.",
    "c3 prepares d2–d3 without blocking the bishop, a quiet Italian tabiya.",
    "Black develops the king’s knight and eyes e4.",
    "d3 solidifies the center before kingside action — the ‘slow’ Italian idea.",
    "Black shores up the center so the position stays balanced.",
    "Castle to safety; both sides finish development.",
    "Black castles — the middlegame plans can start.",
    "Re1 eyes the semi-open e-file and supports future central breaks.",
    "Black develops the queen’s bishop, often aiming at e8 or the queenside.",
  ],
  london: [
    "Claim space with the queen pawn — the London starts from a solid d4.",
    "Black challenges the center symmetrically.",
    "Bf4 avoids an early e3 wall so the bishop stays outside the pawn chain.",
    "Nf6 is natural development and pressure on d4/e4.",
    "e3 builds the classic London pyramid: pawns on d4/e3/c3.",
    "e6 keeps the center flexible and supports ...c5 ideas.",
    "c3 is the London backbone — it stabilizes d4 and prepares Nd2.",
    "The ...c5 break is the main practical try against the London structure.",
    "Nbd2 is the thematic knight route behind the pawn chain.",
    "Nc6 develops with pressure on d4.",
    "Ngf3 finishes development while keeping the center compact.",
    "Bd6 asks for a bishop trade — a common London decision point.",
    "dxc5 opens the position; White often accepts an IQP-style structure.",
    "Bxc5 recaptures toward the center with the bishop pair or simplified structure in mind.",
  ],
  qg: [
    "d4 starts the fight for the center.",
    "Black holds d5 and keeps a solid pawn front.",
    "c4 is the Queen’s Gambit offer — pressure without locking the center yet.",
    "e6 supports d5 and prepares flexible development.",
    "Nc3 develops with central control.",
    "Nf6 is the main defense — development and pressure on e4.",
    "Bg5 is a classic QGD/QGA hybrid idea: pin or pressure before committing.",
    "dxc4 accepts the gambit; White must show how to regain the pawn with tempo.",
    "e4 seizes space and often threatens to trap the c4 pawn.",
    "h6 asks the bishop to declare itself before ...g5 ideas appear.",
    "Bxf6 damages Black’s structure but gives the two bishops away — a common trade.",
    "Qxf6 recaptures with the queen, eyeing the center files.",
    "e5 gains space and cramps Black’s knight on d7.",
    "Nd7 is a typical blockade knight against the advanced e-pawn.",
  ],
};

/** Extra line for Starter+ (Evans-style Italian, similar extras for others). */
export const STARTER_EXTRA_LINE_MOVES: Partial<Record<string, string[]>> = {
  italian: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "b4", "Bxb4", "c3", "Ba5"],
  london: ["d4", "d5", "Bf4", "Nf6", "e3", "e6", "c3", "Bd6", "Bxd6", "Qxd6", "Nf3", "O-O", "Nbd2", "c5"],
  qg: ["d4", "d5", "c4", "e6", "Nc3", "Be7", "cxd5", "exd5", "Bf4", "Nf6", "e3", "O-O", "Bd3", "c6"],
  scotch: ["e4", "e5", "Nf3", "Nc6", "d4", "exd4", "Nxd4", "Bc5", "Be3", "Qf6", "c3", "Nge7", "Bc4", "O-O"],
  caro: ["e4", "c6", "d4", "d5", "Nc3", "dxe4", "Nxe4", "Bf5", "Ng3", "Bg6", "h4", "h6", "Nf3", "Nd7"],
  sicilian: ["e4", "c5", "Nf3", "e6", "d4", "cxd4", "Nxd4", "Nc6", "Nc3", "Qc7", "Be2", "a6", "O-O", "Nf6"],
  french: ["e4", "e6", "d4", "d5", "Nd2", "Nf6", "e5", "Nfd7", "c3", "c5", "f4", "Nc6", "Ndf3", "Qb6"],
  scandinavian: ["e4", "d5", "exd5", "Qxd5", "Nc3", "Qd8", "d4", "Nf6", "Nf3", "Bg4", "Be2", "e6", "h3", "Bh5"],
  qgd: ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "Bg5", "Nbd7", "e3", "c6", "Nf3", "Qa5", "Bd3", "dxc4"],
  slav: ["d4", "d5", "c4", "c6", "Nf3", "Nf6", "Nc3", "dxc4", "a4", "Bf5", "e3", "e6", "Bxc4", "Bb4"],
  kid: ["d4", "Nf6", "c4", "g6", "Nc3", "Bg7", "e4", "d6", "Nf3", "O-O", "Be2", "Nc6", "O-O", "Bf5"],
  nimzo: ["d4", "Nf6", "c4", "e6", "Nc3", "Bb4", "Qc2", "d6", "a3", "Bxc3+", "Qxc3", "Nc6", "Nf3", "e5"],
};

/** Club tier: longer continuation drills. */
export const CLUB_EXTRA_LINE_MOVES: Partial<Record<string, string[]>> = {
  italian: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "c3", "Nf6", "d4", "exd4", "cxd4", "Bb4+", "Bd2", "Bxd2+"],
  london: ["d4", "d5", "Bf4", "Nf6", "e3", "e6", "Nf3", "c5", "c3", "Nc6", "Nbd2", "Bd6", "dxc5", "Bxc5"],
  qg: ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "Nf3", "Be7", "Bg5", "h6", "Bh4", "O-O", "e3", "Ne4"],
};

/** Pro tier: maximum-depth single line per family (subset of openings). */
export const PRO_EXTRA_LINE_MOVES: Partial<Record<string, string[]>> = {
  italian: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "c3", "Nf6", "d4", "exd4", "cxd4", "Bb4+", "Nc3", "Nxe4", "O-O", "Bxc3"],
  london: ["d4", "d5", "Bf4", "Nf6", "e3", "e6", "Nf3", "c5", "c3", "Nc6", "Nbd2", "Bd6", "Bxd6", "Qxd6", "dxc5", "Qxc5"],
  qg: ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "Bg5", "Be7", "e3", "O-O", "Nf3", "h6", "Bh4", "b6", "cxd5", "exd5"],
  sicilian: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "g6", "Be3", "Bg7", "f3", "O-O", "Qd2", "Nc6", "O-O-O"],
  french: ["e4", "e6", "d4", "d5", "Nc3", "Nf6", "Bg5", "Be7", "e5", "Nfd7", "Bxe7", "Qxe7", "f4", "O-O", "Nf3", "c5", "dxc5"],
  kid: ["d4", "Nf6", "c4", "g6", "Nc3", "Bg7", "e4", "d6", "f3", "O-O", "Be3", "e5", "d5", "Nh5", "Qd2", "f5", "O-O-O"],
};

/** One opponent-deviation branch plus a plan you can remember after the drill. */
export type DeviationBranch = {
  title: string;
  moves: string[];
  /** Practical plan: what to play for after this line */
  plan: string;
  /** Optional per-ply teaching hints aligned with `moves`. */
  hints?: string[];
};

/**
 * Opponent-deviation branches (2–3 per opening where possible):
 * "What to play when they veer away from your main line."
 * All sequences validated with chess.js at build time.
 */
export const DEVIATION_LINE_MOVES: Partial<Record<string, DeviationBranch[]>> = {
  italian: [
    {
      title: "Vs Two Knights (3...Nf6)",
      moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6", "d3", "Bc5", "O-O", "d6"],
      plan: "Keep a slow Italian structure: finish development (Re1, h3 if needed), then fight for d4 or f4 breaks once the center is secure.",
    },
    {
      title: "Vs Early ...h6 (delaying ...Nf6)",
      moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "c3", "h6", "d4", "exd4"],
      plan: "Open the center when ready: recapture on d4, develop Nbd2/f1, and use open lines against a slightly slower Black setup.",
    },
    {
      title: "Vs 4...d6 (slow Giuoco)",
      moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "c3", "d6", "d4", "exd4", "cxd4", "Bb4+"],
      plan: "Neutralize the check, castle, then play for central space (d5 ideas) and piece activity toward the kingside or open e-file.",
    },
  ],
  london: [
    {
      title: "Vs ...Bf5 before locking the pawn chain",
      moves: ["d4", "d5", "Bf4", "Nf6", "e3", "Bf5", "c3", "e6", "Nf3", "Bd6", "Bxd6", "Qxd6"],
      plan: "Trade dark-squared bishops when offered, keep a solid pawn triangle (c3-d4-e3), and improve knights before expanding with e4 or c4.",
    },
    {
      title: "Vs early ...c5 challenge",
      moves: ["d4", "d5", "Bf4", "Nf6", "e3", "c5", "c3", "cxd4", "exd4", "Nc6", "Nf3", "Bg4"],
      plan: "Accept the tension: develop Nbd2, control e5, and aim for a timely dxc5 or e4 break once pieces are coordinated.",
    },
    {
      title: "Vs ...g6 / Bg7 setups",
      moves: ["d4", "d5", "Bf4", "Nf6", "e3", "g6", "Nf3", "Bg7", "c3", "O-O", "Nbd2", "c5"],
      plan: "Stay flexible: finish development, keep the bishop pair or good trades on g7, and meet ...c5 with solid recaptures toward the center.",
    },
  ],
  qg: [
    {
      title: "Vs ...dxc4 (QGA)",
      moves: ["d4", "d5", "c4", "dxc4", "e4", "Nc6", "Nf3", "e5", "Bxc4", "Bb4+", "Bd2", "Bxd2+"],
      plan: "Regain the pawn with tempo if possible, castle quickly, and use the extra central space from e4-e5 to develop before Black consolidates.",
    },
    {
      title: "Vs ...c6 (Slav-style transposition)",
      moves: ["d4", "d5", "c4", "c6", "Nc3", "Nf6", "e3", "e6", "Nf3", "Nbd7", "Bd3", "dxc4", "Bxc4", "b5"],
      plan: "Regain and stabilize: develop the bishop actively, castle, and meet ...b5 with Bd3 or a4 ideas while keeping central control.",
    },
    {
      title: "Vs solid ...e6 / ...Be7 (QGD shell)",
      moves: ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "Bg5", "dxc4", "e4", "h6", "Bxf6", "Qxf6"],
      plan: "Build a big center with e4, castle, then decide between queenside play or f3/g4 plans depending on how Black develops the c8 bishop.",
    },
  ],
  scotch: [
    {
      title: "Vs 4...Bc5 (classical hit)",
      moves: ["e4", "e5", "Nf3", "Nc6", "d4", "exd4", "Nxd4", "Bc5", "Be3", "Qf6"],
      plan: "Keep development flowing: protect the knight, castle, and use open files for rooks; watch tactics on e5 and the long diagonal.",
    },
    {
      title: "Vs 4...Nf6 (Four Knights flavor)",
      moves: ["e4", "e5", "Nf3", "Nc6", "d4", "exd4", "Nxd4", "Nf6", "Nc3", "Bb4", "Nxc6", "bxc6"],
      plan: "Accept the doubled pawns as a target: develop with Bg5 or Bf4 ideas, castle, and pressure the semi-open b-file and weak dark squares.",
    },
    {
      title: "Vs 5...Bc5 instead of main Nf6",
      moves: ["e4", "e5", "Nf3", "Nc6", "d4", "exd4", "Nxd4", "Bc5", "Nb3", "Bb6", "Nc3", "Nf6"],
      plan: "Retreat the knight with tempo, finish development, and meet ...Bb6 with a2-a4 ideas or central breaks once the king is safe.",
    },
  ],
  caro: [
    {
      title: "Vs Classical ...Bf5",
      moves: ["e4", "c6", "d4", "d5", "Nc3", "dxe4", "Nxe4", "Bf5", "Ng3", "Bg6", "h4", "h6"],
      plan: "Challenge the bishop pair: h4-h5 ideas, Nf3-e5 routes, and a solid pawn center; castle short and aim at the slightly weakened kingside.",
    },
    {
      title: "Vs Advance ...c5 break",
      moves: ["e4", "c6", "d4", "d5", "e5", "Bf5", "Nc3", "e6", "Nge2", "c5", "dxc5", "Nc6"],
      plan: "Keep the space edge: recapture toward the center, develop with Ng3/f4 ideas, and use the advanced chain to restrict Black’s breaks.",
    },
    {
      title: "Vs Exchange ...dxe4 capture",
      moves: ["e4", "c6", "d4", "d5", "exd5", "cxd5", "Bd3", "Nc6", "c3", "Qc7", "Ne2", "Bg4"],
      plan: "A quieter structure: castle, fight for e4/e5 squares, and use the half-open e-file for rooks without overcommitting on the wing.",
    },
  ],
  sicilian: [
    {
      title: "Vs Alapin (2.c3)",
      moves: ["e4", "c5", "c3", "Nf6", "e5", "Nd5", "d4", "cxd4", "Nf3", "Nc6", "cxd4", "d6"],
      plan: "Build a big d4-e5 pawn duo when possible, develop pieces toward d5 pressure, and keep the king safe before launching middlegame tactics.",
    },
    {
      title: "Vs 2...e6 (transposing to French-type)",
      moves: ["e4", "c5", "Nf3", "e6", "d4", "cxd4", "Nxd4", "Nc6", "Nc3", "Qc7", "Be2", "a6"],
      plan: "Stay flexible: small center breaks with f4/f5 ideas depending on setup, castle, and use the semi-open d-file after trades.",
    },
    {
      title: "Vs 2...Nc6 (Closed Sicilian style)",
      moves: ["e4", "c5", "Nc3", "Nc6", "f4", "g6", "Nf3", "Bg7", "Bc4", "e6", "O-O", "Nge7"],
      plan: "Kingside space with f4/f5: develop the dark-squared bishop, castle, and open the f-file only when the attack is justified.",
    },
  ],
  french: [
    {
      title: "Vs Exchange Variation",
      moves: ["e4", "e6", "d4", "d5", "exd5", "exd5", "Bd3", "Nc6", "c3", "Bd6", "Ne2", "Nge7"],
      plan: "Symmetric but playable: fight for e5 control, castle, connect rooks on the e-file, and probe weak squares after minor-piece trades.",
    },
    {
      title: "Vs Winawer-style ...Bb4",
      moves: ["e4", "e6", "d4", "d5", "Nc3", "Bb4", "e5", "c5", "a3", "Bxc3+", "bxc3", "Ne7"],
      plan: "Accept the doubled pawns for a bind: use the a- and b-files, fight for d4, and aim long-term pressure against a cramped Black king.",
    },
    {
      title: "Vs Classical ...Nf6 main",
      moves: ["e4", "e6", "d4", "d5", "Nc3", "Nf6", "Bg5", "Be7", "e5", "Nfd7", "Bxe7", "Qxe7"],
      plan: "Space first: improve the worst piece (often the queen’s knight), castle, then open lines with f4 or c4 depending on Black’s setup.",
    },
  ],
  scandinavian: [
    {
      title: "Vs 3...Qd8",
      moves: ["e4", "d5", "exd5", "Qxd5", "Nc3", "Qd8", "d4", "Nf6", "Nf3", "Bg4", "Be2", "e6"],
      plan: "Solid development: fight the pin with h3 or Nbd2, castle, and use the extra center pawn to restrict Black’s counterplay.",
    },
    {
      title: "Vs 3...Qa5 (main)",
      moves: ["e4", "d5", "exd5", "Qxd5", "Nc3", "Qa5", "d4", "Nf6", "Nf3", "Bg4", "Be2", "e6"],
      plan: "Gain time with tempo moves, develop toward e5, and keep the queen active on safer squares while completing kingside development.",
    },
    {
      title: "Vs early ...c6 (solid)",
      moves: ["e4", "d5", "exd5", "Qxd5", "Nc3", "Qd8", "d4", "Nf6", "Nf3", "c6", "Bc4", "Bf5"],
      plan: "A slower game: castle, improve rooks to central files, and target backward pawns or weak light squares after trades.",
    },
  ],
  qgd: [
    {
      title: "Vs Exchange QGD",
      moves: ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "cxd5", "exd5", "Bg5", "Be7", "e3", "O-O"],
      plan: "Symmetric structure: minority attack ideas on the queenside, piece trades to clarify weaknesses, and rooks on the c- and e-files.",
    },
    {
      title: "Vs ...Be7 / ...h6 (mainline ideas)",
      moves: ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "Bg5", "Be7", "e3", "O-O", "Nf3", "h6", "Bh4", "b6"],
      plan: "Keep tension: develop Bd3, castle, then choose between queenside expansion or central breaks once Black commits the bishop.",
    },
    {
      title: "Vs ...Nbd7 early",
      moves: ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "Bg5", "Nbd7", "e3", "c6", "Nf3", "Qa5", "Bd3", "dxc4"],
      plan: "Regain the pawn with development: castle, connect rooks, and use the half-open d-file against a slightly cramped black queen.",
    },
  ],
  slav: [
    {
      title: "Vs 3.Nf3 (slow Slav move order)",
      moves: ["d4", "d5", "c4", "c6", "Nf3", "Nf6", "Nc3", "dxc4", "a4", "Bf5", "Ne5", "e6"],
      plan: "Fight for e5: develop e3/Bxc4 schemes, castle, and use the extra space to restrict ...c5 until you are fully coordinated.",
    },
    {
      title: "Vs ...Bf5 Slav (piece outside chain)",
      moves: ["d4", "d5", "c4", "c6", "Nc3", "Nf6", "Nf3", "dxc4", "a4", "Bf5", "e3", "e6", "Bxc4", "Bb4"],
      plan: "Solid development: neutralize the pin, castle, and meet ...Bb4 with Bd2 or Qb3 lines while keeping central control.",
    },
    {
      title: "Vs ...e6 Meran-style tension",
      moves: ["d4", "d5", "c4", "c6", "Nc3", "Nf6", "e3", "e6", "Nf3", "Nbd7", "Bd3", "dxc4", "Bxc4", "b5"],
      plan: "Don’t rush: stabilize the bishop, consider a4 against ...b5, and aim for central e4 breaks after king safety.",
    },
  ],
  kid: [
    {
      title: "Vs Fianchetto / early ...g6",
      moves: ["d4", "Nf6", "c4", "g6", "Nf3", "Bg7", "g3", "O-O", "Bg2", "d6", "O-O", "Nc6"],
      plan: "Symmetrical fianchetto fight: contest e5, use rooks on central files, and time e4 or d5 breaks when Black’s king is less flexible.",
    },
    {
      title: "Vs ...e5 central strike",
      moves: ["d4", "Nf6", "c4", "g6", "Nc3", "Bg7", "e4", "d6", "Nf3", "O-O", "Be2", "e5", "O-O", "Nc6"],
      plan: "Typical KID tension: stabilize the center, consider d5 closes, and prepare f4 or queenside play depending on where Black commits.",
    },
    {
      title: "Vs Saemisch-style with e4 and f3",
      moves: ["d4", "Nf6", "c4", "g6", "Nc3", "Bg7", "e4", "d6", "f3", "O-O", "Be3", "e5", "d5", "Nh5"],
      plan: "Closed center: use the clamp on d5, improve the queen, and attack on the wing where Black’s pieces are least coordinated.",
    },
  ],
  nimzo: [
    {
      title: "Vs Rubinstein (4.e3)",
      moves: ["d4", "Nf6", "c4", "e6", "Nc3", "Bb4", "e3", "O-O", "Bd3", "d5", "Nf3", "c5", "O-O", "Nc6"],
      plan: "Solid center: meet ...c5 with cxd5 ideas, develop rooks to open files, and trade pieces when it clarifies pawn structure.",
    },
    {
      title: "Vs 4.Qc2 (classical)",
      moves: ["d4", "Nf6", "c4", "e6", "Nc3", "Bb4", "Qc2", "O-O", "a3", "Bxc3+", "Qxc3", "b6", "Nf3", "Bb7"],
      plan: "After the bishop trade, use the queen on c3 for central control, castle, and pressure long diagonals against a fianchettoed bishop.",
    },
    {
      title: "Vs 4.f3 / Samisch ideas",
      moves: ["d4", "Nf6", "c4", "e6", "Nc3", "Bb4", "f3", "d6", "e4", "e5", "d5", "Nh5", "Qd2", "f5"],
      plan: "Space edge with e4-e5: keep the king safe, use the half-open f-file carefully, and time g4 ideas only when tactics support them.",
    },
  ],
};
