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
  sicilian: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "g6", "Be3", "Bg7", "f3", "O-O", "Qd2", "Nc6", "O-O-O"],
  french: ["e4", "e6", "d4", "d5", "Nc3", "Nf6", "Bg5", "Be7", "e5", "Nfd7", "Bxe7", "Qxe7", "f4", "O-O", "Nf3", "c5", "dxc5"],
  kid: ["d4", "Nf6", "c4", "g6", "Nc3", "Bg7", "e4", "d6", "f3", "O-O", "Be3", "e5", "d5", "Nh5", "Qd2", "f5", "O-O-O"],
};
