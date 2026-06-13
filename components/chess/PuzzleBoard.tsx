'use client';

// Plays a single puzzle. Auto-plays the opponent's setup move, then expects the
// solver's moves in order. Wrong move = fail (with optional retry). Exposes
// onSolved / onFailed callbacks. Reusable by the rated trainer, theme packs,
// and Puzzle Rush.

import { useEffect, useMemo, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import Board from './Board';
import type { Puzzle } from '@/lib/puzzles/types';
import type { PieceColor, Square } from '@/lib/chess/coords';
import { applyUci, checkSquare as checkSq, gameEnd, legalDests } from '@/lib/chess/game';
import { sfx } from '@/lib/sounds';

export type PuzzleStatus = 'solving' | 'solved' | 'failed';

interface Props {
  puzzle: Puzzle;
  pieceSet?: string;
  allowRetry?: boolean; // rated/theme: true; rush: false
  showHints?: boolean;
  onSolved: () => void;
  onFailed: () => void;
}

export default function PuzzleBoard({ puzzle, pieceSet = 'classic', allowRetry = true, showHints = true, onSolved, onFailed }: Props) {
  const game = useMemo(() => new Chess(puzzle.fen), [puzzle.id]);
  const [, force] = useState(0);
  const [ply, setPly] = useState(0); // index into puzzle.moves of the NEXT expected move
  const [status, setStatus] = useState<PuzzleStatus>('solving');
  const [wrong, setWrong] = useState(false);
  const [hintFrom, setHintFrom] = useState<Square | null>(null);
  const [lastMove, setLastMove] = useState<[Square, Square] | null>(null);
  const solverColor = useRef<PieceColor>('w');
  const rerender = () => force((n) => n + 1);

  // On mount / new puzzle: reset and auto-play the opponent's setup move.
  useEffect(() => {
    game.load(puzzle.fen);
    setStatus('solving');
    setWrong(false);
    setHintFrom(null);
    const opp = puzzle.moves[0];
    // Solver is the side NOT moving first (the setup move is the opponent's).
    solverColor.current = game.turn() === 'w' ? 'b' : 'w';
    const t = setTimeout(() => {
      applyUci(game, opp);
      setLastMove([opp.slice(0, 2) as Square, opp.slice(2, 4) as Square]);
      setPly(1);
      rerender();
    }, 450);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzle.id]);

  function move(from: Square, to: Square, promotion?: 'q' | 'r' | 'b' | 'n') {
    if (status !== 'solving') return;
    const expected = puzzle.moves[ply];
    const uci = from + to + (promotion ?? '');
    const matches = uci === expected || from + to === expected || (expected.length === 5 && from + to + 'q' === expected && !promotion);

    // Accept any move that delivers the same result when it's the final mating move
    // — but for simplicity we require the canonical solution move.
    if (!matches) {
      // A different move that also checkmates is acceptable on the last move.
      const probe = new Chess(game.fen());
      const mv = probe.move({ from, to, promotion: promotion ?? 'q' });
      const isLastSolverMove = ply >= puzzle.moves.length - 1;
      if (mv && isLastSolverMove && probe.isCheckmate()) {
        acceptSolverMove(uci, from, to, promotion);
        return;
      }
      // wrong
      setWrong(true);
      sfx.wrong();
      setTimeout(() => setWrong(false), 500);
      if (allowRetry) {
        setStatus('failed');
      } else {
        setStatus('failed');
        onFailed();
      }
      rerender();
      return;
    }
    acceptSolverMove(expected, from, to, promotion);
  }

  function acceptSolverMove(solverUci: string, from: Square, to: Square, promotion?: string) {
    applyUci(game, solverUci);
    setLastMove([from, to]);
    const captured = false;
    void captured;
    let p = ply + 1;
    const end = gameEnd(game);
    if (p >= puzzle.moves.length || end.over) {
      setStatus('solved');
      sfx.correct();
      setPly(p);
      rerender();
      setTimeout(onSolved, 250);
      return;
    }
    // auto-play opponent reply
    const reply = puzzle.moves[p];
    sfx.move();
    setTimeout(() => {
      applyUci(game, reply);
      setLastMove([reply.slice(0, 2) as Square, reply.slice(2, 4) as Square]);
      setPly(p + 1);
      rerender();
    }, 350);
    setPly(p);
    rerender();
  }

  function retry() {
    game.load(puzzle.fen);
    setStatus('solving');
    setWrong(false);
    const opp = puzzle.moves[0];
    setTimeout(() => {
      applyUci(game, opp);
      setLastMove([opp.slice(0, 2) as Square, opp.slice(2, 4) as Square]);
      setPly(1);
      rerender();
    }, 300);
  }

  const dests = status === 'solving' && game.turn() === solverColor.current ? legalDests(game) : new Map<Square, Square[]>();
  const decorations: Partial<Record<Square, 'target'>> = {};
  if (hintFrom && status === 'solving') decorations[hintFrom] = 'target';

  return (
    <div className={wrong ? 'animate-shake' : ''}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-extrabold text-sm px-3 py-1 rounded-full bg-soft">
          {solverColor.current === 'w' ? '⚪ White' : '⚫ Black'} to move
        </span>
        <span className="text-sm font-bold opacity-50">Rating {puzzle.rating}</span>
      </div>
      <Board
        fen={game.fen()}
        orientation={solverColor.current}
        dests={dests}
        onMove={move}
        lastMove={lastMove}
        checkSquare={checkSq(game)}
        decorations={decorations}
        showCoords
        pieceSet={pieceSet}
        animateMs={160}
      />

      <div className="mt-3 min-h-[3rem] flex items-center justify-center gap-3">
        {status === 'solving' && showHints && (
          <button
            onClick={() => setHintFrom(puzzle.moves[ply]?.slice(0, 2) as Square)}
            className="text-sm font-bold text-brand hover:underline"
          >
            💡 Hint
          </button>
        )}
        {status === 'solved' && <span className="font-black text-mint text-lg animate-bounce-in">✅ Solved!</span>}
        {status === 'failed' && (
          <div className="flex items-center gap-3 animate-bounce-in">
            <span className="font-black text-cherry">❌ Not the move</span>
            {allowRetry && (
              <button onClick={retry} className="cq-btn-ghost text-sm py-2">
                Try again
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
