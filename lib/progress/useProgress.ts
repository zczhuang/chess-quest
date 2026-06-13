'use client';

// React hook over the local-first store with a debounced cloud mirror.
// Mutators mutate a working copy, persist to localStorage immediately, and
// schedule a push to Supabase (no-op for local/demo players).

import { useCallback, useEffect, useRef, useState } from 'react';
import { type PlayerState, loadState, saveState, touchStreak } from './store';
import { pullAndMerge, pushState } from './sync';

export function useProgress(playerId: string | null) {
  const [state, setState] = useState<PlayerState | null>(null);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load local immediately, then merge cloud in the background.
  useEffect(() => {
    if (!playerId) return;
    const s = loadState(playerId);
    setState({ ...s });
    let cancelled = false;
    void pullAndMerge(playerId, s).then((changed) => {
      if (cancelled) return;
      if (changed) {
        saveState(playerId, s);
        setState({ ...s });
      }
      // Seed cloud with anything local-only (first sign-in after demo play).
      void pushState(playerId, s);
    });
    return () => {
      cancelled = true;
    };
  }, [playerId]);

  const mutate = useCallback(
    (fn: (s: PlayerState) => void) => {
      if (!playerId) return;
      setState((prev) => {
        const s = prev ? { ...prev, lessons: { ...prev.lessons }, streak: { ...prev.streak }, puzzles: { ...prev.puzzles }, games: { ...prev.games, beaten: [...prev.games.beaten] } } : loadState(playerId);
        fn(s);
        touchStreak(s);
        saveState(playerId, s);
        if (pushTimer.current) clearTimeout(pushTimer.current);
        pushTimer.current = setTimeout(() => void pushState(playerId, s), 2500);
        return s;
      });
    },
    [playerId]
  );

  // Flush pending push on unmount.
  useEffect(() => {
    return () => {
      if (pushTimer.current) clearTimeout(pushTimer.current);
      if (playerId) {
        const s = loadState(playerId);
        void pushState(playerId, s);
      }
    };
  }, [playerId]);

  const addXp = useCallback((amount: number) => mutate((s) => void (s.xp += amount)), [mutate]);

  const completeLesson = useCallback(
    (lessonId: string, stars: number) =>
      mutate((s) => {
        const prev = s.lessons[lessonId] || { stars: 0, completed: false };
        s.lessons[lessonId] = { stars: Math.max(prev.stars, stars), completed: true };
      }),
    [mutate]
  );

  const recordPuzzle = useCallback(
    (solved: boolean, newRating: number) =>
      mutate((s) => {
        s.puzzles.attempts += 1;
        if (solved) s.puzzles.solved += 1;
        s.puzzles.rating = Math.round(newRating);
        s.puzzles.ratingAt = Date.now();
      }),
    [mutate]
  );

  const recordRush = useCallback(
    (score: number) => mutate((s) => void (s.puzzles.rushBest = Math.max(s.puzzles.rushBest, score))),
    [mutate]
  );

  const recordGame = useCallback(
    (result: 'win' | 'loss' | 'draw', botId: string) =>
      mutate((s) => {
        if (result === 'win') {
          s.games.wins += 1;
          if (!s.games.beaten.includes(botId)) s.games.beaten.push(botId);
        } else if (result === 'loss') s.games.losses += 1;
        else s.games.draws += 1;
      }),
    [mutate]
  );

  return { state, addXp, completeLesson, recordPuzzle, recordRush, recordGame, mutate };
}
