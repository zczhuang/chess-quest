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
    <nav className="sticky top-0 z-50 cq-glass border-b border-white/40">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2 font-black text-xl shrink-0 group">
          <span className="text-2xl transition-transform group-hover:rotate-12 group-hover:scale-110">🏰</span>
          <span className="hidden sm:inline cq-gradient-text">Chess Quest</span>
        </Link>
        <div className="flex-1 flex justify-center gap-1 sm:gap-2">
          {LINKS.map((l) => {
            const active = pathname?.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 sm:px-4 py-2 rounded-xl font-extrabold text-sm sm:text-base transition-all ${
                  active ? 'cq-btn-brand !px-3 sm:!px-4 !py-2 !rounded-xl' : 'text-ink/80 hover:bg-white/60 hover:text-ink'
                }`}
              >
                <span className="mr-1">{l.emoji}</span>
                <span className="hidden sm:inline">{l.label}</span>
              </Link>
            );
          })}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {stats && (
            <>
              <span className="hidden sm:flex cq-chip text-flame" title="Day streak">
                🔥 {stats.streak}
              </span>
              <span className="cq-chip text-gold-dark" title="XP">
                ⭐ {stats.xp}
              </span>
            </>
          )}
          <Link
            href="/dashboard"
            className="w-10 h-10 rounded-full bg-white/80 border border-white flex items-center justify-center text-xl hover:scale-110 transition shadow-pop"
            title={player ? player.name : 'Choose player'}
          >
            {player ? player.avatar : '👤'}
          </Link>
        </div>
      </div>
    </nav>
  );
}
