'use client';

// A full game vs an AI bot. Handles player moves, bot replies (weakened engine),
// hints, takebacks, check/checkmate, captured trays, and end-of-game with a
// kid-friendly Gemini review.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import Board from './Board';
import CapturedTray from './CapturedTray';
import type { BotDef } from '@/lib/chess/bots';
import type { PieceColor, Square } from '@/lib/chess/coords';
import { applyUci, capturedPieces, checkSquare as checkSq, gameEnd, legalDests, type GameOver } from '@/lib/chess/game';
import { bestHint, botMove } from '@/lib/chess/playEngine';
import { getEngine } from '@/lib/chess/engine';
import { sfx } from '@/lib/sounds';

export type GameResult = 'win' | 'loss' | 'draw';

interface Props {
  bot: BotDef;
  playerColor: PieceColor;
  pieceSet?: string;
  isKid: boolean;
  onResult: (result: GameResult) => void;
}

export default function GameBoard({ bot, playerColor, pieceSet = 'classic', isKid, onResult }: Props) {
  const game = useMemo(() => new Chess(), []);
  const [, force] = useState(0);
  const rerender = () => force((n) => n + 1);
  const [lastMove, setLastMove] = useState<[Square, Square] | null>(null);
  const [thinking, setThinking] = useState(false);
  const [hintSquares, setHintSquares] = useState<[Square, Square] | null>(null);
  const [end, setEnd] = useState<ReturnType<typeof gameEnd> | null>(null);
  const [speech, setSpeech] = useState<string>(bot.intro);
  const [review, setReview] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const historyLen = useRef(0);

  const botColor: PieceColor = playerColor === 'w' ? 'b' : 'w';
  const myTurn = game.turn() === playerColor && !end;

  const playBotIfNeeded = useCallback(async () => {
    if (game.isGameOver() || game.turn() !== botColor) return;
    setThinking(true);
    const start = Date.now();
    const uci = await botMove(game.fen(), bot);
    // small floor so very fast bots don't feel instant
    const elapsed = Date.now() - start;
    if (elapsed < 350) await new Promise((r) => setTimeout(r, 350 - elapsed));
    if (uci) {
      const mv = applyUci(game, uci);
      if (mv) {
        setLastMove([uci.slice(0, 2) as Square, uci.slice(2, 4) as Square]);
        if (mv.captured) sfx.capture();
        else sfx.move();
        if (game.inCheck()) sfx.check();
      }
    }
    setThinking(false);
    checkEnd();
    rerender();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bot, botColor, game]);

  // Warm up the engine (compile WASM) on mount, then let the bot open if white.
  useEffect(() => {
    getEngine().warmup();
    if (botColor === 'w') void playBotIfNeeded();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function checkEnd() {
    const e = gameEnd(game);
    if (e.over) {
      setEnd(e);
      if (e.result === 'checkmate') {
        const playerWon = e.winner === playerColor;
        setSpeech(playerWon ? bot.loseLine : bot.winLine);
        if (playerWon) sfx.fanfare();
        else sfx.defeat();
        onResult(playerWon ? 'win' : 'loss');
      } else {
        setSpeech("A draw! Well played.");
        onResult('draw');
      }
    }
  }

  function onPlayerMove(from: Square, to: Square, promotion?: 'q' | 'r' | 'b' | 'n') {
    if (!myTurn || thinking) return;
    const mv = applyUci(game, from + to + (promotion ?? ''));
    if (!mv) return;
    setLastMove([from, to]);
    setHintSquares(null);
    if (mv.captured) sfx.capture();
    else sfx.move();
    if (game.inCheck()) sfx.check();
    rerender();
    const e = gameEnd(game);
    if (e.over) {
      checkEnd();
      return;
    }
    void playBotIfNeeded();
  }

  async function onHint() {
    if (!myTurn || thinking) return;
    const uci = await bestHint(game.fen());
    if (uci) setHintSquares([uci.slice(0, 2) as Square, uci.slice(2, 4) as Square]);
  }

  function onTakeback() {
    if (thinking || end) return;
    // Undo back to the player's turn (one full move = 2 plies if bot already replied).
    if (game.turn() === playerColor) {
      game.undo(); // bot's move
      game.undo(); // player's move
    } else {
      game.undo(); // player's last move
    }
    setLastMove(null);
    setHintSquares(null);
    rerender();
  }

  async function onReview() {
    setReviewing(true);
    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'game-review',
          pgn: game.pgn(),
          result: end && end.over ? end.result : undefined,
          winner: end && end.over && 'winner' in end ? end.winner : null,
          playerColor,
          botName: bot.name,
          isKid,
        }),
      });
      const data = await res.json();
      setReview(data.text || 'Good game! Keep practicing and you’ll keep improving.');
    } catch {
      setReview('Good game! Every game makes you stronger. 💪');
    }
    setReviewing(false);
  }

  const dests = myTurn ? legalDests(game) : new Map<Square, Square[]>();
  const caps = capturedPieces(game);
  const decorations: Partial<Record<Square, 'target' | 'good'>> = {};
  if (hintSquares) {
    decorations[hintSquares[0]] = 'good';
    decorations[hintSquares[1]] = 'target';
  }

  return (
    <div>
      {/* Bot header + speech bubble */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-pop shrink-0" style={{ background: bot.color }}>
          {bot.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-black leading-tight">
            {bot.name} <span className="opacity-50 font-bold text-sm">({bot.elo})</span>
          </div>
          <div className="text-sm font-semibold opacity-75 truncate">{thinking ? 'thinking…' : speech}</div>
        </div>
        <CapturedTray pieces={botColor === 'w' ? caps.byBlack : caps.byWhite} byColor={botColor === 'w' ? 'w' : 'b'} advantage={botColor === 'w' ? -caps.diff : caps.diff} pieceSet={pieceSet} />
      </div>

      <Board
        fen={game.fen()}
        orientation={playerColor}
        dests={dests}
        onMove={onPlayerMove}
        lastMove={lastMove}
        checkSquare={checkSq(game)}
        decorations={decorations}
        showCoords
        pieceSet={pieceSet}
        disabled={!myTurn}
      />

      {/* Player tray + controls */}
      <div className="flex items-center justify-between mt-2 mb-3">
        <CapturedTray pieces={playerColor === 'w' ? caps.byWhite : caps.byBlack} byColor={playerColor} advantage={playerColor === 'w' ? caps.diff : -caps.diff} pieceSet={pieceSet} />
        <span className="text-sm font-extrabold opacity-50">You</span>
      </div>

      {!end ? (
        <div className="flex flex-wrap gap-2 justify-center">
          <button onClick={onHint} disabled={!myTurn || thinking} className="cq-btn-ghost text-sm py-2 disabled:opacity-40">💡 Hint</button>
          <button onClick={onTakeback} disabled={thinking || game.history().length === 0} className="cq-btn-ghost text-sm py-2 disabled:opacity-40">↩️ Takeback</button>
        </div>
      ) : end.over ? (
        <EndCard end={end} bot={bot} playerColor={playerColor} review={review} reviewing={reviewing} onReview={onReview} />
      ) : null}
    </div>
  );
}

function EndCard({
  end,
  bot,
  playerColor,
  review,
  reviewing,
  onReview,
}: {
  end: GameOver;
  bot: BotDef;
  playerColor: PieceColor;
  review: string | null;
  reviewing: boolean;
  onReview: () => void;
}) {
  const won = end.result === 'checkmate' && end.winner === playerColor;
  const lost = end.result === 'checkmate' && !won;
  return (
    <div className="cq-card p-5 text-center animate-bounce-in mt-2">
      <div className="text-5xl mb-1">{won ? '🏆' : lost ? '💪' : '🤝'}</div>
      <h2 className="text-2xl font-black">
        {won ? `You beat ${bot.name}!` : lost ? `${bot.name} won this time` : 'It’s a draw!'}
      </h2>
      <p className="opacity-70 font-semibold mb-4">{won ? '+15 XP · keep climbing the ladder!' : lost ? 'Every loss is a lesson. Try again!' : 'A hard-fought balance.'}</p>

      {review ? (
        <div className="bg-soft rounded-xl p-4 text-left font-semibold whitespace-pre-wrap mb-3">{review}</div>
      ) : (
        <button onClick={onReview} disabled={reviewing} className="cq-btn-gold mb-3">
          {reviewing ? 'Coach is thinking…' : '🧙 Get coach review'}
        </button>
      )}

      <div className="flex gap-2 justify-center">
        <button onClick={() => window.location.reload()} className="cq-btn-brand">Rematch</button>
        <a href="/play" className="cq-btn-ghost">Pick another bot</a>
      </div>
    </div>
  );
}
