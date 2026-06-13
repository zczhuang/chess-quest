'use client';

// Adaptive rated trainer: serves puzzles near the player's rating, updates the
// rating after each, and keeps going. A streak counter adds a little drama.

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import Nav from '@/components/ui/Nav';
import NeedPlayer from '@/components/ui/NeedPlayer';
import PuzzleBoard from '@/components/chess/PuzzleBoard';
import { usePlayerSession } from '@/lib/usePlayerSession';
import { useProgress } from '@/lib/progress/useProgress';
import { loadState } from '@/lib/progress/store';
import { type Puzzle, bandForRating, loadPack, updateRating } from '@/lib/puzzles/types';

export default function TrainPage() {
  const { player, loading, pieceSet } = usePlayerSession();
  const { recordPuzzle, addXp } = useProgress(player?.id ?? null);
  const [rating, setRating] = useState(600);
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [streak, setStreak] = useState(0);
  const [delta, setDelta] = useState<number | null>(null);
  const seen = useRef<Set<string>>(new Set());

  const pickNext = useCallback(
    async (forRating: number) => {
      const pack = await loadPack('by-rating', bandForRating(forRating));
      const fresh = pack.filter((p) => !seen.current.has(p.id));
      const pool = fresh.length ? fresh : pack;
      if (!pool.length) return;
      const next = pool[Math.floor(Math.random() * pool.length)];
      seen.current.add(next.id);
      setPuzzle(next);
      setDelta(null);
    },
    []
  );

  useEffect(() => {
    if (!player) return;
    const s = loadState(player.id);
    setRating(s.puzzles.rating);
    void pickNext(s.puzzles.rating);
  }, [player, pickNext]);

  function finish(solved: boolean) {
    if (!puzzle) return;
    const next = updateRating(rating, puzzle.rating, solved);
    setDelta(next - rating);
    setRating(next);
    recordPuzzle(solved, next);
    if (solved) {
      addXp(5);
      setStreak((s) => s + 1);
    } else {
      setStreak(0);
    }
    setTimeout(() => void pickNext(next), 1100);
  }

  if (loading) return <Shell><div className="text-center py-20 opacity-50 font-bold">Loading…</div></Shell>;
  if (!player) return <Shell><NeedPlayer /></Shell>;

  return (
    <Shell>
      <div className="flex items-center justify-between mb-4">
        <Link href="/puzzles" className="text-2xl opacity-50 hover:opacity-100">←</Link>
        <div className="flex items-center gap-4 font-extrabold">
          <span className="text-sky">
            🎯 {rating}
            {delta !== null && (
              <span className={delta >= 0 ? 'text-mint ml-1' : 'text-cherry ml-1'}>
                {delta >= 0 ? '+' : ''}
                {delta}
              </span>
            )}
          </span>
          {streak > 1 && <span className="text-flame">🔥 {streak}</span>}
        </div>
      </div>

      {puzzle ? (
        <PuzzleBoard
          key={puzzle.id}
          puzzle={puzzle}
          pieceSet={pieceSet}
          allowRetry={false}
          onSolved={() => finish(true)}
          onFailed={() => finish(false)}
        />
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
