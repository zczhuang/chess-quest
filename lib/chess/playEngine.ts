'use client';

// Turns a BotDef into an actual move. Combines Stockfish (weakened via skill /
// Elo limit / short search) with random-blunder injection so the easy bots play
// at a genuinely beginner level. Also exposes a full-strength hint.

import { Chess } from 'chess.js';
import { getEngine } from './engine';
import { randomMove } from './game';
import type { BotDef } from './bots';

/** Decide the bot's move for the current position. Returns UCI (e.g. 'e2e4'). */
export async function botMove(fen: string, bot: BotDef): Promise<string> {
  const game = new Chess(fen);

  // Blunder die: sometimes just play a random legal move (the great equalizer).
  if (Math.random() < bot.engine.randomChance) {
    const rm = randomMove(game);
    if (rm) return rm;
  }

  try {
    const { skill, depth, moveTimeMs, elo } = bot.engine;
    const result = await getEngine().go({
      fen,
      skill,
      depth,
      moveTimeMs: moveTimeMs ?? (depth ? undefined : 300),
      elo,
    });
    if (result.bestMove && result.bestMove !== '(none)') return result.bestMove;
  } catch {
    // engine failed (worker/wasm issue) — fall back to a legal move so the game continues
  }
  return randomMove(game) ?? '';
}

/** Full-strength best move for the side to move (used by the Hint button). */
export async function bestHint(fen: string): Promise<string | null> {
  try {
    const result = await getEngine().go({ fen, skill: 20, moveTimeMs: 500, multiPv: 1 });
    return result.bestMove || null;
  } catch {
    return null;
  }
}

/** A quick centipawn eval of the position (white POV), for the game-review bar. */
export async function evalPosition(fen: string, moveTimeMs = 250): Promise<number> {
  try {
    const game = new Chess(fen);
    const result = await getEngine().go({ fen, skill: 20, moveTimeMs });
    const line = result.lines[0];
    if (!line) return 0;
    let cp = line.score.mate != null ? (line.score.mate > 0 ? 10000 : -10000) : line.score.cp ?? 0;
    // Engine score is from side-to-move POV; normalize to white POV.
    if (game.turn() === 'b') cp = -cp;
    return cp;
  } catch {
    return 0;
  }
}
