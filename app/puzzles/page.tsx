'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Nav from '@/components/ui/Nav';
import NeedPlayer from '@/components/ui/NeedPlayer';
import { usePlayerSession } from '@/lib/usePlayerSession';
import { loadState } from '@/lib/progress/store';
import { THEMES } from '@/lib/puzzles/types';

export default function PuzzlesHub() {
  const { player, loading } = usePlayerSession();
  const [rating, setRating] = useState(600);
  const [solved, setSolved] = useState(0);
  const [rushBest, setRushBest] = useState(0);

  useEffect(() => {
    if (!player) return;
    const s = loadState(player.id);
    setRating(s.puzzles.rating);
    setSolved(s.puzzles.solved);
    setRushBest(s.puzzles.rushBest);
  }, [player]);

  if (loading) return <Shell><div className="text-center py-20 opacity-50 font-bold">Loading…</div></Shell>;
  if (!player) return <Shell><NeedPlayer /></Shell>;

  return (
    <Shell>
      <h1 className="text-3xl font-black mb-1">Puzzles</h1>
      <p className="opacity-70 font-semibold mb-6">
        {player.avatar} {player.name} · Rating <b className="text-sky">{rating}</b> · {solved} solved
      </p>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <Link href="/puzzles/train" className="cq-card p-6 hover:-translate-y-1 transition">
          <div className="text-4xl mb-2">🎯</div>
          <h2 className="font-black text-lg">Train</h2>
          <p className="text-sm opacity-70 font-semibold">Endless puzzles that adapt to your level. Your rating goes up as you solve.</p>
        </Link>
        <Link href="/puzzles/rush" className="cq-card p-6 hover:-translate-y-1 transition">
          <div className="text-4xl mb-2">⏱️</div>
          <h2 className="font-black text-lg">Puzzle Rush</h2>
          <p className="text-sm opacity-70 font-semibold">How many can you solve in 3 minutes? 3 strikes and you’re out!</p>
          <p className="text-xs font-black text-flame mt-2">Best: {rushBest}</p>
        </Link>
        <div className="cq-card p-6 opacity-90">
          <div className="text-4xl mb-2">🧩</div>
          <h2 className="font-black text-lg">Themes</h2>
          <p className="text-sm opacity-70 font-semibold">Drill one idea at a time — pick a theme below.</p>
        </div>
      </div>

      <h2 className="font-black text-xl mb-3">Themes</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {THEMES.map((t) => (
          <Link key={t.key} href={`/puzzles/theme/${t.key}`} className="cq-card p-4 hover:-translate-y-1 transition">
            <div className="text-3xl mb-1">{t.emoji}</div>
            <div className="font-black">{t.label}</div>
            <div className="text-xs opacity-60 font-semibold">{t.blurb}</div>
          </Link>
        ))}
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <main className="max-w-3xl mx-auto px-4 py-8">{children}</main>
    </>
  );
}
