'use client';

// Small helpers shared by Play / Puzzles / Learn on top of chess.js.

import { Chess, type Square as CjsSquare } from 'chess.js';
import type { PieceColor, Square } from './coords';

/** Legal destinations map for the side to move (Board's `dests` prop). */
export function legalDests(chess: Chess): Map<Square, Square[]> {
  const dests = new Map<Square, Square[]>();
  for (const move of chess.moves({ verbose: true })) {
    const list = dests.get(move.from) ?? [];
    list.push(move.to);
    dests.set(move.from, list);
  }
  return dests;
}

/** The king square of `color` if it is currently in check, else null. */
export function checkSquare(chess: Chess): Square | null {
  if (!chess.inCheck()) return null;
  const color = chess.turn();
  const board = chess.board();
  for (const row of board) {
    for (const sq of row) {
      if (sq && sq.type === 'k' && sq.color === color) return sq.square;
    }
  }
  return null;
}

export type GameEnd =
  | { over: false }
  | { over: true; result: 'checkmate' | 'stalemate' | 'draw'; winner?: PieceColor };

export type GameOver = Extract<GameEnd, { over: true }>;

export function gameEnd(chess: Chess): GameEnd {
  if (!chess.isGameOver()) return { over: false };
  if (chess.isCheckmate()) {
    return { over: true, result: 'checkmate', winner: chess.turn() === 'w' ? 'b' : 'w' };
  }
  if (chess.isStalemate()) return { over: true, result: 'stalemate' };
  return { over: true, result: 'draw' };
}

/** Apply a UCI move ('e2e4', 'e7e8q'). Returns the verbose move or null. */
export function applyUci(chess: Chess, uci: string) {
  try {
    return chess.move({
      from: uci.slice(0, 2) as CjsSquare,
      to: uci.slice(2, 4) as CjsSquare,
      promotion: (uci[4] as 'q' | 'r' | 'b' | 'n' | undefined) ?? undefined,
    });
  } catch {
    return null;
  }
}

/** Pick a uniformly random legal move (the kid-bot blunder generator). */
export function randomMove(chess: Chess): string | null {
  const moves = chess.moves({ verbose: true });
  if (!moves.length) return null;
  const m = moves[Math.floor(Math.random() * moves.length)];
  return m.from + m.to + (m.promotion ?? '');
}

/** Material count difference (positive = white ahead), for capture trays. */
const VALUES: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
export function capturedPieces(chess: Chess): { byWhite: string[]; byBlack: string[]; diff: number } {
  const counts: Record<string, number> = { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 };
  const remaining: Record<PieceColor, Record<string, number>> = {
    w: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
    b: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
  };
  for (const row of chess.board()) {
    for (const sq of row) {
      if (sq) remaining[sq.color][sq.type]++;
    }
  }
  const byWhite: string[] = []; // black pieces white captured
  const byBlack: string[] = [];
  let diff = 0;
  for (const t of ['q', 'r', 'b', 'n', 'p'] as const) {
    for (let i = 0; i < counts[t] - remaining.b[t]; i++) {
      byWhite.push(t);
      diff += VALUES[t];
    }
    for (let i = 0; i < counts[t] - remaining.w[t]; i++) {
      byBlack.push(t);
      diff -= VALUES[t];
    }
  }
  return { byWhite, byBlack, diff };
}
