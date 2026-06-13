'use client';

// Plays one lesson: steps through exercises, auto-checks each on the board,
// tracks mistakes for star scoring, and shows a celebration at the end.
// Star model: 3 = flawless, 2 = ≤2 mistakes/hints, 1 = completed.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Chess } from 'chess.js';
import Board from './Board';
import type { Exercise, Lesson } from '@/lib/learn/types';
import type { Square } from '@/lib/chess/coords';
import { applyUci, checkSquare as checkSq, legalDests } from '@/lib/chess/game';
import { heroDests, applyOnBoard, boardToFen } from '@/lib/learn/pieceMoves';
import { parseFenBoard, sideToMove } from '@/lib/chess/coords';
import { sfx } from '@/lib/sounds';

interface Props {
  lesson: Lesson;
  onComplete: (stars: number, xp: number) => void;
  onExit: () => void;
  pieceSet?: string;
}

export default function LessonPlayer({ lesson, onComplete, onExit, pieceSet = 'classic' }: Props) {
  const [step, setStep] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const total = lesson.exercises.length;
  const ex = lesson.exercises[step];

  const next = useCallback(() => {
    if (step + 1 >= total) {
      const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
      sfx.fanfare();
      onComplete(stars, lesson.xp);
    } else {
      setStep((s) => s + 1);
    }
  }, [step, total, mistakes, lesson.xp, onComplete]);

  const onMistake = useCallback(() => setMistakes((m) => m + 1), []);

  return (
    <div className="max-w-xl mx-auto">
      {/* Progress bar */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onExit} className="text-2xl opacity-50 hover:opacity-100" aria-label="Exit lesson">
          ✕
        </button>
        <div className="flex-1 h-3 bg-line rounded-full overflow-hidden">
          <div
            className="h-full bg-mint transition-all duration-300"
            style={{ width: `${(step / total) * 100}%` }}
          />
        </div>
        <span className="text-sm font-extrabold opacity-60">
          {step + 1}/{total}
        </span>
      </div>

      <ExerciseView key={step} ex={ex} onSolved={next} onMistake={onMistake} pieceSet={pieceSet} />
    </div>
  );
}

function ExerciseView({
  ex,
  onSolved,
  onMistake,
  pieceSet,
}: {
  ex: Exercise;
  onSolved: () => void;
  onMistake: () => void;
  pieceSet: string;
}) {
  switch (ex.type) {
    case 'info':
      return <InfoCard ex={ex} onNext={onSolved} pieceSet={pieceSet} />;
    case 'mcq':
      return <McqCard ex={ex} onNext={onSolved} onMistake={onMistake} pieceSet={pieceSet} />;
    case 'collect':
      return <CollectCard ex={ex} onNext={onSolved} pieceSet={pieceSet} />;
    case 'tap-squares':
      return <TapCard ex={ex} onNext={onSolved} onMistake={onMistake} pieceSet={pieceSet} />;
    case 'best-move':
      return <BestMoveCard ex={ex} onNext={onSolved} onMistake={onMistake} pieceSet={pieceSet} />;
    case 'line':
      return <LineCard ex={ex} onNext={onSolved} onMistake={onMistake} pieceSet={pieceSet} />;
  }
}

function Feedback({ kind, text }: { kind: 'good' | 'bad'; text: string }) {
  return (
    <div
      className={`mt-3 p-3 rounded-xl font-bold animate-bounce-in ${
        kind === 'good' ? 'bg-mint/15 text-mint-dark' : 'bg-cherry/15 text-cherry'
      }`}
    >
      {kind === 'good' ? '✅ ' : '🤔 '}
      {text}
    </div>
  );
}

function ContinueBtn({ onClick, label = 'Continue' }: { onClick: () => void; label?: string }) {
  return (
    <button onClick={onClick} className="cq-btn-brand w-full mt-4 text-lg animate-bounce-in">
      {label} →
    </button>
  );
}

function InfoCard({ ex, onNext, pieceSet }: { ex: Extract<Exercise, { type: 'info' }>; onNext: () => void; pieceSet: string }) {
  return (
    <div className="cq-card p-6">
      <h2 className="text-2xl font-black mb-2">{ex.title}</h2>
      <p className="text-lg opacity-85 font-semibold mb-4">{ex.body}</p>
      {ex.fen && (
        <div className="max-w-xs mx-auto">
          <Board fen={ex.fen} decorations={ex.decorations} highlights={ex.highlights} showCoords disabled pieceSet={pieceSet} />
        </div>
      )}
      <ContinueBtn onClick={onNext} label="Got it" />
    </div>
  );
}

function McqCard({
  ex,
  onNext,
  onMistake,
  pieceSet,
}: {
  ex: Extract<Exercise, { type: 'mcq' }>;
  onNext: () => void;
  onMistake: () => void;
  pieceSet: string;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const correct = picked === ex.answer;
  return (
    <div className="cq-card p-6">
      <h2 className="text-xl font-black mb-4">{ex.question}</h2>
      {ex.fen && (
        <div className="max-w-[14rem] mx-auto mb-4">
          <Board fen={ex.fen} decorations={ex.decorations} highlights={ex.highlights} showCoords disabled pieceSet={pieceSet} />
        </div>
      )}
      <div className="grid gap-2">
        {ex.choices.map((c, i) => {
          const state =
            picked === null ? '' : i === ex.answer ? 'ring-4 ring-mint' : i === picked ? 'ring-4 ring-cherry opacity-70' : 'opacity-50';
          return (
            <button
              key={i}
              disabled={picked !== null}
              onClick={() => {
                setPicked(i);
                if (i === ex.answer) sfx.correct();
                else {
                  sfx.wrong();
                  onMistake();
                }
              }}
              className={`cq-card p-4 text-left font-bold text-lg transition ${state}`}
            >
              {c}
            </button>
          );
        })}
      </div>
      {picked !== null && <Feedback kind={correct ? 'good' : 'bad'} text={ex.explain || (correct ? 'Correct!' : 'Not quite — see the highlighted answer.')} />}
      {picked !== null && <ContinueBtn onClick={onNext} />}
    </div>
  );
}

function TapCard({
  ex,
  onNext,
  onMistake,
  pieceSet,
}: {
  ex: Extract<Exercise, { type: 'tap-squares' }>;
  onNext: () => void;
  onMistake: () => void;
  pieceSet: string;
}) {
  const [hit, setHit] = useState<Square[]>([]);
  const targets = useMemo(() => new Set(ex.targets), [ex.targets]);
  const done = hit.length >= targets.size && [...targets].every((t) => hit.includes(t));

  // We intercept board taps via a transparent overlay of 64 buttons.
  const board = parseFenBoard(ex.fen);
  const orientation = 'w';

  function tap(sq: Square) {
    if (done || hit.includes(sq)) return;
    if (targets.has(sq)) {
      sfx.star();
      setHit((h) => [...h, sq]);
    } else {
      sfx.wrong();
      onMistake();
    }
  }

  const decorations = Object.fromEntries(hit.map((s) => [s, 'good' as const]));

  return (
    <div className="cq-card p-6">
      <h2 className="text-xl font-black mb-1">{ex.title}</h2>
      <p className="opacity-80 font-semibold mb-4">{ex.instructions}</p>
      <div className="max-w-sm mx-auto">
        <TappableBoard fen={boardToFen(board, orientation)} decorations={decorations} onTap={tap} pieceSet={pieceSet} />
      </div>
      <p className="text-center mt-3 font-extrabold opacity-60">
        {hit.length}/{targets.size} found
      </p>
      {done && <Feedback kind="good" text={ex.explain || 'Nice tapping!'} />}
      {done && <ContinueBtn onClick={onNext} />}
    </div>
  );
}

function CollectCard({ ex, onNext, pieceSet }: { ex: Extract<Exercise, { type: 'collect' }>; onNext: () => void; pieceSet: string }) {
  const [fen, setFen] = useState(ex.fen);
  const [stars, setStars] = useState<Square[]>(ex.stars);
  const [moves, setMoves] = useState(0);
  const [lastMove, setLastMove] = useState<[Square, Square] | null>(null);
  const done = stars.length === 0;
  const dests = useMemo(() => (done ? new Map<Square, Square[]>() : heroDests(fen, sideToMove(fen))), [fen, done]);
  const decorations = Object.fromEntries(stars.map((s) => [s, 'star' as const]));

  function move(from: Square, to: Square) {
    const board = parseFenBoard(fen);
    const next = applyOnBoard(board, from, to);
    setFen(boardToFen(next, sideToMove(fen)));
    setLastMove([from, to]);
    setMoves((m) => m + 1);
    if (stars.includes(to)) {
      sfx.star();
      setStars((s) => s.filter((x) => x !== to));
    } else {
      sfx.move();
    }
  }

  const optimal = ex.maxMoves ? moves <= ex.maxMoves : true;

  return (
    <div className="cq-card p-6">
      <h2 className="text-xl font-black mb-1">{ex.title}</h2>
      <p className="opacity-80 font-semibold mb-4">{ex.instructions}</p>
      <div className="max-w-sm mx-auto">
        <Board fen={fen} dests={dests} onMove={move} lastMove={lastMove} decorations={decorations} showCoords pieceSet={pieceSet} animateMs={180} />
      </div>
      <p className="text-center mt-3 font-extrabold opacity-60">
        {ex.stars.length - stars.length}/{ex.stars.length} stars · {moves} moves
      </p>
      {done && <Feedback kind="good" text={optimal ? 'Perfect path! ⭐' : 'You got them all!'} />}
      {done && <ContinueBtn onClick={onNext} />}
    </div>
  );
}

function BestMoveCard({
  ex,
  onNext,
  onMistake,
  pieceSet,
}: {
  ex: Extract<Exercise, { type: 'best-move' }>;
  onNext: () => void;
  onMistake: () => void;
  pieceSet: string;
}) {
  const game = useMemo(() => new Chess(ex.fen), [ex.fen]);
  const [, force] = useState(0);
  const [solved, setSolved] = useState(false);
  const [wrong, setWrong] = useState(false);
  const [hint, setHint] = useState(false);
  const [lastMove, setLastMove] = useState<[Square, Square] | null>(null);

  const orientation = sideToMove(ex.fen);
  const dests = solved ? new Map<Square, Square[]>() : legalDests(game);
  const solutionFroms = useMemo(() => new Set(ex.solutions.map((s) => s.slice(0, 2))), [ex.solutions]);

  function move(from: Square, to: Square, promotion?: 'q' | 'r' | 'b' | 'n') {
    const uci = from + to + (promotion ?? '');
    const uciAuto = from + to + 'q'; // accept implicit queen-promo too
    const isSolution = ex.solutions.includes(uci) || ex.solutions.includes(uciAuto) || ex.solutions.includes(from + to);
    if (isSolution) {
      applyUci(game, ex.solutions.find((s) => s.startsWith(from + to)) || uci);
      setLastMove([from, to]);
      setSolved(true);
      sfx.correct();
      force((n) => n + 1);
    } else {
      // wrong move: flash, don't apply
      setWrong(true);
      sfx.wrong();
      onMistake();
      setTimeout(() => setWrong(false), 600);
    }
  }

  const decorations: Partial<Record<Square, 'target'>> = {};
  if (hint && !solved) {
    for (const f of solutionFroms) decorations[f as Square] = 'target';
  }

  return (
    <div className={`cq-card p-6 ${wrong ? 'animate-shake' : ''}`}>
      <h2 className="text-xl font-black mb-1">{ex.title}</h2>
      <p className="opacity-80 font-semibold mb-4">{ex.instructions}</p>
      <div className="max-w-sm mx-auto">
        <Board
          fen={game.fen()}
          orientation={orientation}
          dests={dests}
          onMove={move}
          lastMove={lastMove}
          checkSquare={checkSq(game)}
          decorations={decorations}
          showCoords
          pieceSet={pieceSet}
          animateMs={180}
        />
      </div>
      {!solved && (
        <button onClick={() => setHint(true)} className="mt-3 text-sm font-bold text-brand hover:underline">
          💡 Show me a hint
        </button>
      )}
      {solved && <Feedback kind="good" text={ex.explain || 'Great move!'} />}
      {solved && <ContinueBtn onClick={onNext} />}
    </div>
  );
}

function LineCard({
  ex,
  onNext,
  onMistake,
  pieceSet,
}: {
  ex: Extract<Exercise, { type: 'line' }>;
  onNext: () => void;
  onMistake: () => void;
  pieceSet: string;
}) {
  const game = useMemo(() => new Chess(ex.fen), [ex.fen]);
  const [ply, setPly] = useState(0);
  const [, force] = useState(0);
  const [wrong, setWrong] = useState(false);
  const [lastMove, setLastMove] = useState<[Square, Square] | null>(null);
  const done = ply >= ex.line.length;
  const orientation = sideToMove(ex.fen);
  const dests = done ? new Map<Square, Square[]>() : legalDests(game);

  function move(from: Square, to: Square, promotion?: 'q' | 'r' | 'b' | 'n') {
    const expected = ex.line[ply];
    const uci = from + to + (promotion ?? '');
    if (uci === expected || from + to === expected) {
      applyUci(game, expected);
      setLastMove([from, to]);
      let p = ply + 1;
      // auto-play opponent reply
      if (p < ex.line.length) {
        const reply = ex.line[p];
        applyUci(game, reply);
        setTimeout(() => setLastMove([reply.slice(0, 2) as Square, reply.slice(2, 4) as Square]), 200);
        p += 1;
      }
      setPly(p);
      sfx.move();
      force((n) => n + 1);
    } else {
      setWrong(true);
      sfx.wrong();
      onMistake();
      setTimeout(() => setWrong(false), 600);
    }
  }

  return (
    <div className={`cq-card p-6 ${wrong ? 'animate-shake' : ''}`}>
      <h2 className="text-xl font-black mb-1">{ex.title}</h2>
      <p className="opacity-80 font-semibold mb-4">{ex.instructions}</p>
      <div className="max-w-sm mx-auto">
        <Board fen={game.fen()} orientation={orientation} dests={dests} onMove={move} lastMove={lastMove} checkSquare={checkSq(game)} showCoords pieceSet={pieceSet} animateMs={180} />
      </div>
      {done && <Feedback kind="good" text={ex.explain || 'You played the whole line!'} />}
      {done && <ContinueBtn onClick={onNext} />}
    </div>
  );
}

// A board with a transparent 8×8 tap grid on top (for tap-squares exercises).
function TappableBoard({
  fen,
  decorations,
  onTap,
  pieceSet,
}: {
  fen: string;
  decorations: Record<string, 'good'>;
  onTap: (sq: Square) => void;
  pieceSet: string;
}) {
  const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const cells: JSX.Element[] = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const sq = `${FILES[col]}${8 - row}`;
      cells.push(
        <button
          key={sq}
          onClick={() => onTap(sq)}
          className="w-full h-full"
          style={{ gridColumn: col + 1, gridRow: row + 1 }}
          aria-label={sq}
        />
      );
    }
  }
  return (
    <div className="relative">
      <Board fen={fen} decorations={decorations} showCoords disabled pieceSet={pieceSet} />
      <div className="absolute inset-0 grid" style={{ gridTemplateColumns: 'repeat(8,1fr)', gridTemplateRows: 'repeat(8,1fr)' }}>
        {cells}
      </div>
    </div>
  );
}
