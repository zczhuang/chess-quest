'use client';

// Player hub: pick or create a player profile (kid or classic mode), see stats.
// Signed-out players live in localStorage; signed-in accounts get cloud players
// whose progress syncs across devices.

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Nav from '@/components/ui/Nav';
import AuthButton from '@/components/ui/AuthButton';
import {
  AVATARS,
  type Player,
  type PlayerMode,
  createCloudPlayer,
  createLocalPlayer,
  getActivePlayerId,
  getCloudPlayers,
  getLocalPlayers,
  setActivePlayerId,
} from '@/lib/players';
import { loadState, levelFromXp } from '@/lib/progress/store';
import { createClient, hasSupabaseClient } from '@/lib/supabase/client';
import { BOTS } from '@/lib/chess/bots';

export default function DashboardPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [mode, setMode] = useState<PlayerMode>('kid');
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [loaded, setLoaded] = useState(false);

  async function refresh() {
    let signed = false;
    if (hasSupabaseClient()) {
      const { data } = await createClient().auth.getSession();
      signed = !!data.session;
    }
    setSignedIn(signed);
    const cloud = signed ? await getCloudPlayers() : null;
    const list = cloud ?? getLocalPlayers();
    setPlayers(list);
    const current = getActivePlayerId();
    if (current && list.some((p) => p.id === current)) setActiveId(current);
    else if (list.length) {
      setActivePlayerId(list[0].id);
      setActiveId(list[0].id);
    }
    setLoaded(true);
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function handleCreate() {
    const trimmed = name.trim() || 'Player';
    const player = signedIn
      ? (await createCloudPlayer(trimmed, mode, avatar)) ?? createLocalPlayer(trimmed, mode, avatar)
      : createLocalPlayer(trimmed, mode, avatar);
    setActivePlayerId(player.id);
    setCreating(false);
    setName('');
    void refresh();
  }

  const active = players.find((p) => p.id === activeId) ?? null;
  const stats = active ? loadState(active.id) : null;
  const level = stats ? levelFromXp(stats.xp) : null;

  return (
    <>
      <Nav />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h1 className="text-3xl font-black">Who&apos;s playing?</h1>
          <AuthButton />
        </div>

        {!signedIn && loaded && (
          <p className="mb-6 cq-card p-4 text-sm font-semibold opacity-80">
            👋 You&apos;re playing as a guest — progress is saved on this device. Sign in with
            Google to keep it safe and use it on any device.
          </p>
        )}

        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          {players.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setActivePlayerId(p.id);
                setActiveId(p.id);
              }}
              className={`cq-card p-5 text-left transition hover:-translate-y-1 ${
                p.id === activeId ? 'ring-4 ring-brand' : ''
              }`}
            >
              <div className="text-4xl mb-2">{p.avatar}</div>
              <div className="font-black text-lg">{p.name}</div>
              <div className="text-xs font-bold uppercase tracking-wide opacity-60">
                {p.mode === 'kid' ? '🌈 Kid mode' : '♟ Classic mode'}
              </div>
            </button>
          ))}
          <button
            onClick={() => setCreating(true)}
            className="cq-card p-5 border-dashed flex flex-col items-center justify-center gap-2 opacity-70 hover:opacity-100 hover:-translate-y-1 transition min-h-[8rem]"
          >
            <span className="text-3xl">➕</span>
            <span className="font-extrabold">New player</span>
          </button>
        </div>

        {creating && (
          <div className="cq-card p-6 mb-8 animate-bounce-in">
            <h2 className="font-black text-xl mb-4">Create a player</h2>
            <div className="flex flex-wrap gap-4 items-end">
              <label className="block">
                <span className="text-sm font-bold opacity-70">Name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block mt-1 rounded-xl border-2 border-line px-4 py-2 font-bold focus:border-brand outline-none"
                  placeholder="e.g. Leeann"
                  maxLength={20}
                />
              </label>
              <label className="block">
                <span className="text-sm font-bold opacity-70">Mode</span>
                <div className="flex gap-2 mt-1">
                  <button
                    className={`cq-btn text-sm ${mode === 'kid' ? 'bg-brand text-white shadow-pop' : 'bg-soft'}`}
                    onClick={() => setMode('kid')}
                  >
                    🌈 Kid
                  </button>
                  <button
                    className={`cq-btn text-sm ${mode === 'classic' ? 'bg-brand text-white shadow-pop' : 'bg-soft'}`}
                    onClick={() => setMode('classic')}
                  >
                    ♟ Classic
                  </button>
                </div>
              </label>
              <div className="block">
                <span className="text-sm font-bold opacity-70">Avatar</span>
                <div className="flex flex-wrap gap-1 mt-1 max-w-xs">
                  {AVATARS.map((a) => (
                    <button
                      key={a}
                      className={`w-9 h-9 rounded-lg text-xl ${a === avatar ? 'bg-gold' : 'hover:bg-soft'}`}
                      onClick={() => setAvatar(a)}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
              <button className="cq-btn-brand" onClick={() => void handleCreate()}>
                Create
              </button>
            </div>
          </div>
        )}

        {active && stats && level && (
          <section>
            <h2 className="font-black text-2xl mb-4">
              {active.avatar} {active.name}&apos;s quest
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="cq-card p-4 text-center">
                <div className="text-3xl font-black text-brand">Lv {level.level}</div>
                <div className="text-xs font-bold opacity-60 uppercase">
                  {level.into}/{level.need} XP
                </div>
              </div>
              <div className="cq-card p-4 text-center">
                <div className="text-3xl font-black text-flame">🔥 {stats.streak.count}</div>
                <div className="text-xs font-bold opacity-60 uppercase">Day streak</div>
              </div>
              <div className="cq-card p-4 text-center">
                <div className="text-3xl font-black text-sky">🧩 {stats.puzzles.rating}</div>
                <div className="text-xs font-bold opacity-60 uppercase">Puzzle rating</div>
              </div>
              <div className="cq-card p-4 text-center">
                <div className="text-3xl font-black text-mint">
                  🏆 {stats.games.beaten.length}/{BOTS.length}
                </div>
                <div className="text-xs font-bold opacity-60 uppercase">Bots beaten</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/learn" className="cq-btn-gold">
                📚 Continue learning
              </Link>
              <Link href="/puzzles" className="cq-btn-ghost">
                🧩 Solve puzzles
              </Link>
              <Link href="/play" className="cq-btn-ghost">
                ⚔️ Challenge a bot
              </Link>
            </div>
          </section>
        )}
      </main>
    </>
  );
}
