'use client';

// Durable cloud mirror for per-player progress (pattern: mandarin-quest's
// progressSync). localStorage stays primary; this mirrors to the Supabase
// `progress` table, RLS-scoped to the signed-in account's own players.
// Best-effort and fail-silent: signed-out / demo players / network errors
// all leave the local game fully working.
//
// Sync is MAX-WINS (never replace a player's state wholesale in either
// direction). Puzzle rating is the one latest-wins field (it legitimately
// goes down), arbitrated by puzzles.ratingAt.

import { createClient } from '@/lib/supabase/client';
import type { PlayerState } from './store';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isSyncable = (playerId: string) => UUID_RE.test(playerId);

const XP_ROW = '__xp__';
const STREAK_ROW = '__streak__';
const PUZZLE_ROW = '__puzzle__';
const GAMES_ROW = '__games__';

let _sb: ReturnType<typeof createClient> | null = null;
function sb() {
  if (!_sb) _sb = createClient();
  return _sb;
}

async function signedIn(): Promise<boolean> {
  try {
    const { data } = await sb().auth.getSession();
    return !!data.session;
  } catch {
    return false;
  }
}

/** Pull cloud rows and merge into `state` (mutates, max-wins). Returns whether local changed. */
export async function pullAndMerge(playerId: string, state: PlayerState): Promise<boolean | null> {
  if (!isSyncable(playerId) || !(await signedIn())) return null;
  const { data: rows, error } = await sb()
    .from('progress')
    .select('item_id, completed, best_stars, data')
    .eq('player_id', playerId);
  if (error || !rows) return null;

  let changed = false;
  for (const row of rows as any[]) {
    const id = row.item_id as string;
    if (id === XP_ROW) {
      if ((row.best_stars || 0) > state.xp) {
        state.xp = row.best_stars || 0;
        changed = true;
      }
    } else if (id === STREAK_ROW) {
      const s = row.data || {};
      if ((s.lastDay || '') > state.streak.lastDay || ((s.lastDay || '') === state.streak.lastDay && (s.count || 0) > state.streak.count)) {
        state.streak = { count: s.count || 0, lastDay: s.lastDay || '' };
        changed = true;
      }
    } else if (id === PUZZLE_ROW) {
      const p = row.data || {};
      if ((p.solved || 0) > state.puzzles.solved) { state.puzzles.solved = p.solved; changed = true; }
      if ((p.attempts || 0) > state.puzzles.attempts) { state.puzzles.attempts = p.attempts; changed = true; }
      if ((p.rushBest || 0) > state.puzzles.rushBest) { state.puzzles.rushBest = p.rushBest; changed = true; }
      if ((p.ratingAt || 0) > state.puzzles.ratingAt && typeof p.rating === 'number') {
        state.puzzles.rating = p.rating;
        state.puzzles.ratingAt = p.ratingAt;
        changed = true;
      }
    } else if (id === GAMES_ROW) {
      const g = row.data || {};
      for (const k of ['wins', 'losses', 'draws'] as const) {
        if ((g[k] || 0) > state.games[k]) { state.games[k] = g[k]; changed = true; }
      }
      if (Array.isArray(g.beaten)) {
        const set = new Set(state.games.beaten);
        for (const b of g.beaten) if (!set.has(b)) { set.add(b); changed = true; }
        state.games.beaten = [...set];
      }
    } else if (id.startsWith('l:')) {
      const lessonId = id.slice(2);
      const local = state.lessons[lessonId] || { stars: 0, completed: false };
      const merged = {
        stars: Math.max(local.stars, row.best_stars || 0),
        completed: local.completed || !!row.completed,
      };
      if (merged.stars !== local.stars || merged.completed !== local.completed) {
        state.lessons[lessonId] = merged;
        changed = true;
      }
    }
  }
  return changed;
}

/** Push the full state up (upserts; cheap — a handful of rows + one per lesson). */
export async function pushState(playerId: string, state: PlayerState): Promise<void> {
  if (!isSyncable(playerId) || !(await signedIn())) return;
  const rows: any[] = [
    { player_id: playerId, item_id: XP_ROW, best_stars: state.xp, completed: false, data: null },
    { player_id: playerId, item_id: STREAK_ROW, best_stars: state.streak.count, completed: false, data: state.streak },
    { player_id: playerId, item_id: PUZZLE_ROW, best_stars: state.puzzles.solved, completed: false, data: state.puzzles },
    { player_id: playerId, item_id: GAMES_ROW, best_stars: state.games.wins, completed: false, data: state.games },
    ...Object.entries(state.lessons).map(([lessonId, rec]) => ({
      player_id: playerId,
      item_id: `l:${lessonId}`,
      best_stars: rec.stars,
      completed: rec.completed,
      data: null,
    })),
  ].map((r) => ({ ...r, updated_at: new Date().toISOString() }));

  try {
    await sb().from('progress').upsert(rows, { onConflict: 'player_id,item_id' });
  } catch {
    /* fail-silent; localStorage remains source of truth */
  }
}
