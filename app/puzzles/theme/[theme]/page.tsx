'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import Nav from '@/components/ui/Nav';
import NeedPlayer from '@/components/ui/NeedPlayer';
import PuzzleBoard from '@/components/chess/PuzzleBoard';
import { usePlayerSession } from '@/lib/usePlayerSession';
import { useProgress } from '@/lib/progress/useProgress';
import { type Puzzle, THEMES, loadPack, updateRating } from '@/lib/puzzles/types';
import { loadState } from '@/lib/progress/store';

export default function ThemePage({ params }: { params: { theme: string } }) {
  const { theme } = params;
  const meta = THEMES.find((t) => t.key === theme);
  const { player, loading, pieceSet } = usePlayerSession();
  const { recordPuzzle, addXp } = useProgress(player?.id ?? null);
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [solvedCount, setSolvedCount] = useState(0);
  const seen = useRef<Set<string>>(new Set());

  const pickNext = useCallback(async () => {
    const pack = await loadPack('themes', theme);
    const fresh = pack.filter((p) => !seen.current.has(p.id));
    const pool = fresh.length ? fresh : pack;
    if (!pool.length) return;
    const next = pool[Math.floor(Math.random() * pool.length)];
    seen.current.add(next.id);
    setPuzzle(next);
  }, [theme]);

  useEffect(() => {
    if (player) void pickNext();
  }, [player, pickNext]);

  function finish(solved: boolean) {
    if (!puzzle || !player) return;
    const s = loadState(player.id);
    const next = updateRating(s.puzzles.rating, puzzle.rating, solved);
    recordPuzzle(solved, next);
    if (solved) {
      addXp(5);
      setSolvedCount((c) => c + 1);
    }
    setTimeout(() => void pickNext(), 1000);
  }

  if (loading) return <Shell><div className="text-center py-20 opacity-50 font-bold">Loading…</div></Shell>;
  if (!player) return <Shell><NeedPlayer /></Shell>;
  if (!meta) return <Shell><div className="text-center py-20 font-bold">Unknown theme. <Link className="text-brand underline" href="/puzzles">Back</Link></div></Shell>;

  return (
    <Shell>
      <div className="flex items-center justify-between mb-4">
        <Link href="/puzzles" className="text-2xl opacity-50 hover:opacity-100">←</Link>
        <h1 className="font-black text-lg">{meta.emoji} {meta.label}</h1>
        <span className="font-extrabold text-mint">✅ {solvedCount}</span>
      </div>
      <p className="text-center opacity-70 font-semibold mb-4">{meta.blurb}</p>
      {puzzle ? (
        <PuzzleBoard key={puzzle.id} puzzle={puzzle} pieceSet={pieceSet} allowRetry onSolved={() => finish(true)} onFailed={() => finish(false)} />
      ) : (
        <div className="text-center py-20 opacity-50 font-bold">Loading puzzle…</div>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <main className="max-w-lg mx-auto px-4 py-8">{children}</main>
    </>
  );
}
