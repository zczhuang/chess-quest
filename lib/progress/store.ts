'use client';

// Local-first progress store. localStorage is the fast, offline-first primary;
// lib/progress/sync.ts mirrors it to Supabase (max-wins merge) so progress
// survives cache clears and follows the account across devices.
//
// ⛔ localStorage keys are a public contract — never rename or re-shape:
//   cq.v1:<playerId>   (this store)
//   cq.players         (local player profiles, signed-out mode)
//   cq.activePlayer    (selected player id)
// New state = additive field with a migration that reads the old shape first.

export interface LessonRec {
  stars: number; // 0-3, max-wins
  completed: boolean;
}

export interface PlayerState {
  xp: number;
  streak: { count: number; lastDay: string }; // lastDay 'YYYY-MM-DD' (local tz)
  lessons: Record<string, LessonRec>;
  puzzles: { rating: number; ratingAt: number; solved: number; attempts: number; rushBest: number };
  games: { wins: number; losses: number; draws: number; beaten: string[] };
  updatedAt: number;
}

export const STORE_PREFIX = 'cq.v1:';

export function emptyState(): PlayerState {
  return {
    xp: 0,
    streak: { count: 0, lastDay: '' },
    lessons: {},
    puzzles: { rating: 600, ratingAt: 0, solved: 0, attempts: 0, rushBest: 0 },
    games: { wins: 0, losses: 0, draws: 0, beaten: [] },
    updatedAt: 0,
  };
}

export function loadState(playerId: string): PlayerState {
  if (typeof window === 'undefined') return emptyState();
  try {
    const raw = localStorage.getItem(STORE_PREFIX + playerId);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw);
    // Additive-migration friendly: spread over empty defaults.
    const base = emptyState();
    return {
      ...base,
      ...parsed,
      streak: { ...base.streak, ...(parsed.streak || {}) },
      puzzles: { ...base.puzzles, ...(parsed.puzzles || {}) },
      games: { ...base.games, ...(parsed.games || {}) },
      lessons: parsed.lessons || {},
    };
  } catch {
    return emptyState();
  }
}

export function saveState(playerId: string, state: PlayerState) {
  if (typeof window === 'undefined') return;
  try {
    state.updatedAt = Date.now();
    localStorage.setItem(STORE_PREFIX + playerId, JSON.stringify(state));
  } catch {
    /* quota errors are non-fatal */
  }
}

export function todayKey(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** Bump the daily streak (call on any meaningful activity). Mutates state. */
export function touchStreak(state: PlayerState): boolean {
  const today = todayKey();
  if (state.streak.lastDay === today) return false;
  state.streak.count = state.streak.lastDay === yesterdayKey() ? state.streak.count + 1 : 1;
  state.streak.lastDay = today;
  return true;
}

/** XP needed to go from `level` to `level+1`. Level = crown level shown in the hub. */
export function xpForLevel(level: number): number {
  return 80 + level * 40;
}

export function levelFromXp(xp: number): { level: number; into: number; need: number } {
  let level = 0;
  let rest = xp;
  while (rest >= xpForLevel(level)) {
    rest -= xpForLevel(level);
    level++;
  }
  return { level, into: rest, need: xpForLevel(level) };
}
