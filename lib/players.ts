'use client';

// Player profiles. Signed-out: stored locally (cq.players) with 'local-' ids
// so they are never cloud-synced. Signed-in: rows in the Supabase `players`
// table (UUID ids → syncable). The active player id lives in cq.activePlayer.

import { createClient, hasSupabaseClient } from '@/lib/supabase/client';
import { PLAYERS_TABLE } from '@/lib/supabase/tables';

export type PlayerMode = 'kid' | 'classic';

export interface Player {
  id: string;
  name: string;
  mode: PlayerMode;
  avatar: string; // emoji avatar
}

const LOCAL_KEY = 'cq.players';
const ACTIVE_KEY = 'cq.activePlayer';

export const AVATARS = ['🦄', '🐸', '🦊', '🐼', '🐯', '🦁', '🐙', '🦖', '🚀', '🌟', '🎨', '🏰', '👑', '🧙', '🐴', '🤖'];

export function getLocalPlayers(): Player[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveLocalPlayers(players: Player[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(players));
}

export function createLocalPlayer(name: string, mode: PlayerMode, avatar: string): Player {
  const player: Player = {
    id: `local-${Math.random().toString(36).slice(2, 10)}`,
    name,
    mode,
    avatar,
  };
  saveLocalPlayers([...getLocalPlayers(), player]);
  return player;
}

export function getActivePlayerId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACTIVE_KEY);
}

export function setActivePlayerId(id: string) {
  localStorage.setItem(ACTIVE_KEY, id);
}

// ---- Cloud players (signed-in) ----

export async function getCloudPlayers(): Promise<Player[] | null> {
  if (!hasSupabaseClient()) return null;
  try {
    const sb = createClient();
    const { data: session } = await sb.auth.getSession();
    if (!session.session) return null;
    const { data, error } = await sb.from(PLAYERS_TABLE).select('id, name, mode, avatar').order('created_at');
    if (error) return null;
    return (data || []).map((r: any) => ({ id: r.id, name: r.name, mode: r.mode, avatar: r.avatar || '🌟' }));
  } catch {
    return null;
  }
}

export async function createCloudPlayer(name: string, mode: PlayerMode, avatar: string): Promise<Player | null> {
  try {
    const sb = createClient();
    const { data: u } = await sb.auth.getUser();
    if (!u.user) return null;
    const { data, error } = await sb
      .from(PLAYERS_TABLE)
      .insert({ account_id: u.user.id, name, mode, avatar })
      .select('id, name, mode, avatar')
      .single();
    if (error || !data) return null;
    return { id: data.id, name: data.name, mode: data.mode as PlayerMode, avatar: data.avatar || '🌟' };
  } catch {
    return null;
  }
}
