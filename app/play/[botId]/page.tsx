'use client';

import Link from 'next/link';
import { useState } from 'react';
import Nav from '@/components/ui/Nav';
import NeedPlayer from '@/components/ui/NeedPlayer';
import GameBoard, { type GameResult } from '@/components/chess/GameBoard';
import { usePlayerSession } from '@/lib/usePlayerSession';
import { useProgress } from '@/lib/progress/useProgress';
import { botById } from '@/lib/chess/bots';
import type { PieceColor } from '@/lib/chess/coords';

export default function PlayBotPage({ params }: { params: { botId: string } }) {
  const { botId } = params;
  const bot = botById(botId);
  const { player, loading, pieceSet, isKid } = usePlayerSession();
  const { recordGame, addXp } = useProgress(player?.id ?? null);
  const [color, setColor] = useState<PieceColor | null>(null);
  const [recorded, setRecorded] = useState(false);

  if (loading) return <Shell><div className="text-center py-20 opacity-50 font-bold">Loading…</div></Shell>;
  if (!player) return <Shell><NeedPlayer /></Shell>;
  if (!bot) return <Shell><div className="text-center py-20 font-bold">Unknown bot. <Link className="text-brand underline" href="/play">Back</Link></div></Shell>;

  function onResult(result: GameResult) {
    if (recorded) return;
    setRecorded(true);
    recordGame(result, bot!.id);
    if (result === 'win') addXp(15);
    else if (result === 'draw') addXp(5);
  }

  if (!color) {
    return (
      <Shell>
        <div className="cq-card p-8 text-center max-w-md mx-auto">
          <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center text-4xl shadow-pop mb-3" style={{ background: bot.color }}>
            {bot.emoji}
          </div>
          <h1 className="text-2xl font-black mb-1">{bot.name}</h1>
          <p className="opacity-70 font-semibold mb-6">“{bot.intro}”</p>
          <p className="font-bold mb-3">Which color do you want?</p>
          <div className="flex gap-3 justify-center">
            <button className="cq-btn-ghost text-lg" onClick={() => setColor('w')}>⚪ White (move first)</button>
            <button className="cq-btn-ghost text-lg" onClick={() => setColor('b')}>⚫ Black</button>
          </div>
          <button className="mt-3 text-sm font-bold text-brand hover:underline" onClick={() => setColor(Math.random() < 0.5 ? 'w' : 'b')}>
            🎲 Surprise me
          </button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="flex items-center mb-3">
        <Link href="/play" className="text-2xl opacity-50 hover:opacity-100">←</Link>
      </div>
      <GameBoard bot={bot} playerColor={color} pieceSet={pieceSet} isKid={isKid} onResult={onResult} />
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <main className="max-w-lg mx-auto px-4 py-6">{children}</main>
    </>
  );
}
