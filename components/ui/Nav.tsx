'use client';

// Top navigation: logo, the three pillars, and the player chip (streak + XP).

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getActivePlayerId, getLocalPlayers, getCloudPlayers, type Player } from '@/lib/players';
import { loadState } from '@/lib/progress/store';

const LINKS = [
  { href: '/learn', label: 'Learn', emoji: '📚' },
  { href: '/puzzles', label: 'Puzzles', emoji: '🧩' },
  { href: '/play', label: 'Play', emoji: '⚔️' },
];

export default function Nav() {
  const pathname = usePathname();
  const [player, setPlayer] = useState<Player | null>(null);
  const [stats, setStats] = useState<{ xp: number; streak: number } | null>(null);

  useEffect(() => {
    const id = getActivePlayerId();
    if (!id) return;
    const local = getLocalPlayers().find((p) => p.id === id);
    if (local) setPlayer(local);
    else void getCloudPlayers().then((ps) => setPlayer(ps?.find((p) => p.id === id) ?? null));
    const s = loadState(id);
    setStats({ xp: s.xp, streak: s.streak.count });
  }, [pathname]);

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b-2 border-line">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2 font-black text-xl text-brand shrink-0">
          <span className="text-2xl">🏰</span>
          <span className="hidden sm:inline">Chess Quest</span>
        </Link>
        <div className="flex-1 flex justify-center gap-1 sm:gap-2">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 sm:px-4 py-2 rounded-xl font-extrabold text-sm sm:text-base transition ${
                pathname?.startsWith(l.href) ? 'bg-brand text-white shadow-pop' : 'text-ink hover:bg-soft'
              }`}
            >
              <span className="mr-1">{l.emoji}</span>
              <span className="hidden sm:inline">{l.label}</span>
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {stats && (
            <>
              <span className="hidden sm:flex items-center gap-1 font-extrabold text-flame" title="Day streak">
                🔥 {stats.streak}
              </span>
              <span className="flex items-center gap-1 font-extrabold text-gold-dark" title="XP">
                ⭐ {stats.xp}
              </span>
            </>
          )}
          <Link
            href="/dashboard"
            className="w-10 h-10 rounded-full bg-soft border-2 border-line flex items-center justify-center text-xl hover:scale-105 transition"
            title={player ? player.name : 'Choose player'}
          >
            {player ? player.avatar : '👤'}
          </Link>
        </div>
      </div>
    </nav>
  );
}
