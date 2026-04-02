import { Chess } from "chess.js";

export type ImportedGame = {
  source: "pgn" | "chesscom" | "lichess";
  pgn: string;
  event?: string;
  white?: string;
  black?: string;
  result?: string;
};

export async function importGameFromInput(input: { pgn?: string; url?: string }): Promise<ImportedGame> {
  const pgn = input.pgn?.trim();
  const url = input.url?.trim();

  if (pgn) {
    validatePgn(pgn);
    return { source: "pgn", pgn };
  }

  if (!url) {
    throw new Error("Provide either PGN text or a game URL.");
  }

  const parsed = new URL(url);
  if (/chess\.com$/i.test(parsed.hostname) || /\.chess\.com$/i.test(parsed.hostname)) {
    const game = await importFromChessCom(parsed);
    validatePgn(game.pgn);
    return game;
  }

  if (/lichess\.org$/i.test(parsed.hostname) || /\.lichess\.org$/i.test(parsed.hostname)) {
    const game = await importFromLichess(parsed);
    validatePgn(game.pgn);
    return game;
  }

  throw new Error("Unsupported URL. Use a Chess.com or Lichess game URL.");
}

function validatePgn(pgn: string) {
  const chess = new Chess();
  try {
    chess.loadPgn(pgn, { strict: false });
  } catch {
    throw new Error("Could not parse PGN. Please paste a full, valid game PGN.");
  }
  if (chess.history().length < 8) {
    throw new Error("Game is too short for meaningful analysis. Please provide at least 8 half-moves.");
  }
}

async function importFromChessCom(url: URL): Promise<ImportedGame> {
  const id = extractTrailingId(url.pathname);
  if (!id) {
    throw new Error("Could not read Chess.com game id from that URL.");
  }

  const response = await fetch(`https://api.chess.com/pub/game/${id}`, {
    headers: { "User-Agent": "Knightora/0.1 (game-analysis)" },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Unable to fetch this Chess.com game. Check that the game is public.");
  }

  const payload = (await response.json()) as {
    pgn?: string;
    white?: { username?: string };
    black?: { username?: string };
    end_time?: number;
  };
  if (!payload.pgn?.trim()) {
    throw new Error("Chess.com response did not include a PGN.");
  }

  return {
    source: "chesscom",
    pgn: payload.pgn.trim(),
    white: payload.white?.username,
    black: payload.black?.username,
  };
}

async function importFromLichess(url: URL): Promise<ImportedGame> {
  const id = extractLichessGameId(url.pathname);
  if (!id) {
    throw new Error("Could not read Lichess game id from that URL.");
  }

  const response = await fetch(`https://lichess.org/game/export/${id}?moves=true&tags=true&clocks=false&evals=false`, {
    headers: { Accept: "application/x-chess-pgn" },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Unable to fetch this Lichess game. Check that the game exists and is public.");
  }

  const pgn = (await response.text()).trim();
  if (!pgn) {
    throw new Error("Lichess export returned an empty PGN.");
  }

  return {
    source: "lichess",
    pgn,
  };
}

function extractTrailingId(pathname: string): string | null {
  const parts = pathname.split("/").filter(Boolean);
  const last = parts[parts.length - 1];
  if (!last) return null;
  return /^\d+$/.test(last) ? last : null;
}

function extractLichessGameId(pathname: string): string | null {
  const parts = pathname.split("/").filter(Boolean);
  const raw = parts.find((p) => /^[a-zA-Z0-9]{8,12}$/.test(p));
  return raw ?? null;
}

