'use client';

// Puzzle Rush: solve as many as you can in 3 minutes. 3 strikes ends it early.
// Difficulty ramps up as your run score climbs (chess.com style).

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import Nav from '@/components/ui/Nav';
import NeedPlayer from '@/components/ui/NeedPlayer';
import PuzzleBoard from '@/components/chess/PuzzleBoard';
import { usePlayerSession } from '@/lib/usePlayerSession';
import { useProgress } from '@/lib/progress/useProgress';
import { loadState } from '@/lib/progress/store';
import { type Puzzle, RATING_BANDS, loadPack } from '@/lib/puzzles/types';
import { sfx } from '@/lib/sounds';

const DURATION = 180; // seconds
const MAX_STRIKES = 3;

export default function RushPage() {
  const { player, loading, pieceSet } = usePlayerSession();
  const { recordRush, addXp } = useProgress(player?.id ?? null);
  const [phase, setPhase] = useState<'ready' | 'playing' | 'over'>('ready');
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [score, setScore] = useState(0);
  const [strikes, setStrikes] = useState(0);
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [best, setBest] = useState(0);
  const seen = useRef<Set<string>>(new Set());
  const scoreRef = useRef(0);

  useEffect(() => {
    if (player) setBest(loadState(player.id).puzzles.rushBest);
  }, [player]);

  // Difficulty ramps with score: every 4 solves climb a band.
  const pickNext = useCallback(async (currentScore: number) => {
    const bandIdx = Math.min(RATING_BANDS.length - 1, Math.floor(currentScore / 4));
    const pack = await loadPack('by-rating', RATING_BANDS[bandIdx].key);
    const fresh = pack.filter((p) => !seen.current.has(p.id));
    const pool = fresh.length ? fresh : pack;
    const next = pool[Math.floor(Math.random() * pool.length)];
    seen.current.add(next.id);
    setPuzzle(next);
  }, []);

  function start() {
    setScore(0);
    scoreRef.current = 0;
    setStrikes(0);
    setTimeLeft(DURATION);
    seen.current = new Set();
    setPhase('playing');
    void pickNext(0);
  }

  // Countdown
  useEffect(() => {
    if (phase !== 'playing') return;
    const t = setInterval(() => {
      setTimeLeft((tl) => {
        if (tl <= 1) {
          clearInterval(t);
          end();
          return 0;
        }
        return tl - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const end = useCallback(() => {
    setPhase('over');
    sfx.fanfare();
    const final = scoreRef.current;
    recordRush(final);
    addXp(final);
    setBest((b) => Math.max(b, final));
  }, [recordRush, addXp]);

  function onSolved() {
    const next = scoreRef.current + 1;
    scoreRef.current = next;
    setScore(next);
    void pickNext(next);
  }

  function onFailed() {
    const s = strikes + 1;
    setStrikes(s);
    if (s >= MAX_STRIKES) {
      end();
    } else {
      void pickNext(scoreRef.current);
    }
  }

  if (loading) return <Shell><div className="text-center py-20 opacity-50 font-bold">Loading…</div></Shell>;
  if (!player) return <Shell><NeedPlayer /></Shell>;

  return (
    <Shell>
      <div className="flex items-center justify-between mb-4">
        <Link href="/puzzles" className="text-2xl opacity-50 hover:opacity-100">←</Link>
        {phase === 'playing' && (
          <div className="flex items-center gap-4 font-black">
            <span className="text-sky text-xl">✅ {score}</span>
            <span>{'❌'.repeat(strikes)}{'⚪'.repeat(MAX_STRIKES - strikes)}</span>
            <span className={`text-xl tabular-nums ${timeLeft <= 20 ? 'text-cherry animate-pop' : ''}`}>
              {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
            </span>
          </div>
        )}
      </div>

      {phase === 'ready' && (
        <div className="cq-card p-8 text-center">
          <div className="text-6xl mb-3">⏱️</div>
          <h1 className="text-3xl font-black mb-2">Puzzle Rush</h1>
          <p className="opacity-75 font-semibold mb-2">Solve as many puzzles as you can in 3 minutes.</p>
          <p className="opacity-75 font-semibold mb-6">Three wrong moves and the run ends! Best: <b className="text-flame">{best}</b></p>
          <button className="cq-btn-gold text-lg" onClick={start}>🚀 Start the clock</button>
        </div>
      )}

      {phase === 'playing' && puzzle && (
        <PuzzleBoard key={puzzle.id} puzzle={puzzle} pieceSet={pieceSet} allowRetry={false} showHints={false} onSolved={onSolved} onFailed={onFailed} />
      )}

      {phase === 'over' && (
        <div className="cq-card p-8 text-center animate-bounce-in">
          <div className="text-6xl mb-2">{score > best ? '🏆' : '🎉'}</div>
          <h1 className="text-3xl font-black mb-1">Time’s up!</h1>
          <p className="text-5xl font-black text-sky my-4">{score}</p>
          <p className="font-bold opacity-70 mb-6">
            {score >= best && score > 0 ? 'New personal best! 🎊' : `Best: ${best}`} · +{score} XP
          </p>
          <div className="flex gap-2 justify-center">
            <button className="cq-btn-brand" onClick={start}>Play again</button>
            <Link href="/puzzles" className="cq-btn-ghost">Done</Link>
          </div>
        </div>
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
