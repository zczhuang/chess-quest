'use client';

import { pieceSrc, type PieceColor } from '@/lib/chess/coords';

// Shows pieces a side has captured + a material advantage badge.
export default function CapturedTray({
  pieces,
  byColor,
  advantage,
  pieceSet = 'classic',
}: {
  pieces: string[];
  byColor: PieceColor; // color of the captured pieces shown
  advantage: number;
  pieceSet?: string;
}) {
  return (
    <div className="flex items-center gap-0.5 h-6">
      {pieces.map((t, i) => (
        <img
          key={i}
          src={pieceSrc({ color: byColor, type: t as any }, pieceSet)}
          alt={t}
          className="w-5 h-5 -ml-1 first:ml-0 opacity-90"
        />
      ))}
      {advantage > 0 && <span className="ml-1 text-xs font-black opacity-60">+{advantage}</span>}
    </div>
  );
}
