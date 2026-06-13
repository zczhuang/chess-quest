'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Nav from '@/components/ui/Nav';
import NeedPlayer from '@/components/ui/NeedPlayer';
import { usePlayerSession } from '@/lib/usePlayerSession';
import { loadState } from '@/lib/progress/store';
import { BOTS } from '@/lib/chess/bots';

export default function PlayHub() {
  const { player, loading } = usePlayerSession();
  const [beaten, setBeaten] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (player) setBeaten(new Set(loadState(player.id).games.beaten));
  }, [player]);

  if (loading) return <Shell><div className="text-center py-20 opacity-50 font-bold">Loading…</div></Shell>;
  if (!player) return <Shell><NeedPlayer /></Shell>;

  return (
    <Shell>
      <h1 className="text-3xl font-black mb-1">Choose your opponent</h1>
      <p className="opacity-70 font-semibold mb-6">
        Climb the ladder from Pip the Pawn to Maximus. {beaten.size}/{BOTS.length} bots beaten!
      </p>
      <div className="grid sm:grid-cols-2 gap-4">
        {BOTS.map((bot, i) => {
          const isBeaten = beaten.has(bot.id);
          const prevBeaten = i === 0 || beaten.has(BOTS[i - 1].id);
          return (
            <Link
              key={bot.id}
              href={`/play/${bot.id}`}
              className="cq-card p-5 flex items-center gap-4 hover:-translate-y-1 transition relative overflow-hidden"
            >
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-pop shrink-0" style={{ background: bot.color }}>
                {bot.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-black text-lg">{bot.name}</span>
                  {isBeaten && <span title="Beaten">⭐</span>}
                </div>
                <div className="text-xs font-bold uppercase tracking-wide opacity-50">Rating {bot.elo}</div>
                <p className="text-sm opacity-75 font-semibold mt-0.5">{bot.tagline}</p>
              </div>
              {!prevBeaten && i > 0 && (
                <span className="absolute top-2 right-3 text-xs font-bold opacity-40">recommended next 👆</span>
              )}
            </Link>
          );
        })}
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <main className="max-w-2xl mx-auto px-4 py-8">{children}</main>
    </>
  );
}
