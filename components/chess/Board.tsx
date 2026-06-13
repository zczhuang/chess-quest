'use client';

// Chess Quest's board. Self-contained (no board library): renders any FEN,
// supports tap-to-move AND drag-to-move, legal-move dots, last-move highlight,
// check glow, an in-board promotion picker, and a `decorations` API so lessons
// can put stars/targets on squares. Theming via the --cq-board-* CSS tokens.

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FILES,
  type BoardPiece,
  type PieceColor,
  type Square,
  gridToSquare,
  parseFenBoard,
  pieceSrc,
  squareToGrid,
} from '@/lib/chess/coords';

export type Decoration = 'star' | 'target' | 'good' | 'bad' | 'sparkle';

export interface BoardProps {
  fen: string;
  orientation?: PieceColor;
  /** Legal destinations per from-square. Omit/empty = board is view-only. */
  dests?: Map<Square, Square[]>;
  onMove?: (from: Square, to: Square, promotion?: 'q' | 'r' | 'b' | 'n') => void;
  lastMove?: [Square, Square] | null;
  checkSquare?: Square | null;
  decorations?: Partial<Record<Square, Decoration>>;
  highlights?: Square[];
  showCoords?: boolean;
  disabled?: boolean;
  pieceSet?: string;
  /** Snappy (120) for puzzles, gentle (220) default. */
  animateMs?: number;
}

const DECO_GLYPH: Record<Decoration, string> = {
  star: '⭐',
  target: '🎯',
  good: '✅',
  bad: '❌',
  sparkle: '✨',
};

interface DragState {
  from: Square;
  piece: BoardPiece;
  x: number;
  y: number;
  moved: boolean;
}

export default function Board({
  fen,
  orientation = 'w',
  dests,
  onMove,
  lastMove,
  checkSquare,
  decorations,
  highlights,
  showCoords = true,
  disabled = false,
  pieceSet = 'classic',
  animateMs = 220,
}: BoardProps) {
  const board = useMemo(() => parseFenBoard(fen), [fen]);
  const boardRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<Square | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [promo, setPromo] = useState<{ from: Square; to: Square } | null>(null);

  // Clear selection when the position changes (a move happened elsewhere).
  useEffect(() => {
    setSelected(null);
    setDrag(null);
    setPromo(null);
  }, [fen]);

  const legalFrom = (sq: Square): Square[] => dests?.get(sq) ?? [];
  const canPick = (sq: Square) => !disabled && !!onMove && legalFrom(sq).length > 0;

  function squareFromPoint(clientX: number, clientY: number): Square | null {
    const el = boardRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const col = Math.floor(((clientX - rect.left) / rect.width) * 8);
    const row = Math.floor(((clientY - rect.top) / rect.height) * 8);
    return gridToSquare(col, row, orientation);
  }

  function tryMove(from: Square, to: Square) {
    if (!onMove) return;
    if (!legalFrom(from).includes(to)) return;
    const piece = board.get(from);
    const isPromo = piece?.type === 'p' && (to[1] === '8' || to[1] === '1');
    if (isPromo) {
      setPromo({ from, to });
      setSelected(null);
      return;
    }
    setSelected(null);
    onMove(from, to);
  }

  function handlePointerDown(e: React.PointerEvent) {
    if (disabled || !onMove) return;
    const sq = squareFromPoint(e.clientX, e.clientY);
    if (!sq) return;

    // Second tap: complete a tap-move.
    if (selected && legalFrom(selected).includes(sq)) {
      tryMove(selected, sq);
      return;
    }

    const piece = board.get(sq);
    if (piece && canPick(sq)) {
      setSelected(sq);
      setDrag({ from: sq, piece, x: e.clientX, y: e.clientY, moved: false });
      (e.target as Element).setPointerCapture?.(e.pointerId);
      e.preventDefault();
    } else {
      setSelected(null);
    }
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!drag) return;
    setDrag({ ...drag, x: e.clientX, y: e.clientY, moved: true });
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (!drag) return;
    const target = squareFromPoint(e.clientX, e.clientY);
    const wasDrag = drag.moved;
    const from = drag.from;
    setDrag(null);
    if (target && target !== from && wasDrag) {
      tryMove(from, target);
    }
    // Plain click (no drag): keep the selection for tap-move.
  }

  const sizePct = 12.5;
  const moveTargets = selected ? legalFrom(selected) : [];

  // Squares grid (backgrounds + decorations), then pieces, then overlays.
  const squares: JSX.Element[] = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const sq = gridToSquare(col, row, orientation)!;
      const dark = (col + row) % 2 === 1;
      const isLast = lastMove?.includes(sq);
      const isSel = selected === sq;
      const isCheck = checkSquare === sq;
      const isHl = highlights?.includes(sq);
      const deco = decorations?.[sq];
      const isTarget = moveTargets.includes(sq);
      const hasPiece = board.has(sq);
      squares.push(
        <div
          key={sq}
          data-square={sq}
          className="relative"
          style={{
            gridColumn: col + 1,
            gridRow: row + 1,
            background: dark ? 'var(--cq-board-dark)' : 'var(--cq-board-light)',
          }}
        >
          {(isLast || isSel || isHl) && (
            <div
              className="absolute inset-0"
              style={{ background: isSel ? 'var(--cq-board-selected)' : 'var(--cq-board-lastmove)' }}
            />
          )}
          {isCheck && (
            <div
              className="absolute inset-0"
              style={{ background: 'radial-gradient(circle, rgba(255,80,80,0.85) 0%, rgba(255,80,80,0) 70%)' }}
            />
          )}
          {deco && (
            <div className="absolute inset-0 z-10 flex items-center justify-center text-[min(5vw,2rem)] pointer-events-none animate-bounce-in">
              {DECO_GLYPH[deco]}
            </div>
          )}
          {isTarget && !hasPiece && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-1/3 h-1/3 rounded-full" style={{ background: 'var(--cq-board-dest)' }} />
            </div>
          )}
          {isTarget && hasPiece && (
            <div
              className="absolute inset-0 pointer-events-none rounded-sm"
              style={{ boxShadow: 'inset 0 0 0 4px var(--cq-board-dest-capture)' }}
            />
          )}
          {showCoords && col === 0 && (
            <span className="absolute left-0.5 top-0.5 text-[0.6rem] font-bold opacity-50 select-none" style={{ color: dark ? 'var(--cq-board-light)' : 'var(--cq-board-dark)' }}>
              {sq[1]}
            </span>
          )}
          {showCoords && row === 7 && (
            <span className="absolute right-0.5 bottom-0 text-[0.6rem] font-bold opacity-50 select-none" style={{ color: dark ? 'var(--cq-board-light)' : 'var(--cq-board-dark)' }}>
              {sq[0]}
            </span>
          )}
        </div>
      );
    }
  }

  // Pieces — absolutely positioned so the last-moved piece can slide in.
  const pieces: JSX.Element[] = [];
  board.forEach((piece, sq) => {
    const { col, row } = squareToGrid(sq, orientation);
    const isDragging = drag?.from === sq && drag.moved;
    const slideFrom = lastMove && lastMove[1] === sq ? lastMove[0] : null;
    pieces.push(
      <PieceView
        key={`${sq}-${piece.color}${piece.type}`}
        piece={piece}
        col={col}
        row={row}
        slideFrom={slideFrom ? squareToGrid(slideFrom, orientation) : null}
        animateMs={animateMs}
        hidden={!!isDragging}
        pickable={canPick(sq)}
        pieceSet={pieceSet}
      />
    );
  });

  return (
    <div className="cq-board-frame">
    <div
      ref={boardRef}
      className="relative w-full aspect-square select-none touch-none rounded-lg overflow-hidden"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => setDrag(null)}
    >
      <div className="absolute inset-0 grid" style={{ gridTemplateColumns: 'repeat(8,1fr)', gridTemplateRows: 'repeat(8,1fr)' }}>
        {squares}
      </div>
      <div className="absolute inset-0 pointer-events-none">{pieces}</div>

      {/* Drag ghost follows the pointer */}
      {drag?.moved && boardRef.current && (
        <img
          src={pieceSrc(drag.piece, pieceSet)}
          alt=""
          className="absolute z-30 pointer-events-none"
          style={{
            width: `${sizePct}%`,
            height: `${sizePct}%`,
            left: drag.x - boardRef.current.getBoundingClientRect().left,
            top: drag.y - boardRef.current.getBoundingClientRect().top,
            transform: 'translate(-50%, -55%) scale(1.15)',
            filter: 'drop-shadow(0 6px 8px rgba(0,0,0,0.35))',
          }}
        />
      )}

      {/* Promotion picker */}
      {promo && (
        <div className="absolute inset-0 z-40 flex items-center justify-center" style={{ background: 'rgba(43,36,64,0.55)' }}>
          <div className="bg-white rounded-2xl p-3 flex gap-2 shadow-pop-lg animate-bounce-in">
            {(['q', 'r', 'b', 'n'] as const).map((t) => (
              <button
                key={t}
                className="w-16 h-16 rounded-xl hover:bg-soft border-2 border-line"
                onClick={(e) => {
                  e.stopPropagation();
                  const p = promo;
                  setPromo(null);
                  if (p) onMove?.(p.from, p.to, t);
                }}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <img src={pieceSrc({ color: sideToMoveColor(fen), type: t }, pieceSet)} alt={t} className="w-full h-full" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
    </div>
  );
}

function sideToMoveColor(fen: string): PieceColor {
  return (fen.split(' ')[1] as PieceColor) || 'w';
}

function PieceView({
  piece,
  col,
  row,
  slideFrom,
  animateMs,
  hidden,
  pickable,
  pieceSet,
}: {
  piece: BoardPiece;
  col: number;
  row: number;
  slideFrom: { col: number; row: number } | null;
  animateMs: number;
  hidden: boolean;
  pickable: boolean;
  pieceSet: string;
}) {
  // If this piece just moved (slideFrom), start at the old square and slide to
  // the new one on the next frame.
  const [pos, setPos] = useState(slideFrom ?? { col, row });
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (slideFrom) {
      setPos(slideFrom);
      setAnimate(false);
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimate(true);
          setPos({ col, row });
        });
      });
      return () => cancelAnimationFrame(raf);
    }
    setPos({ col, row });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [col, row, slideFrom?.col, slideFrom?.row]);

  return (
    <img
      src={pieceSrc(piece, pieceSet)}
      alt={`${piece.color}${piece.type}`}
      draggable={false}
      className="absolute z-20"
      style={{
        width: '12.5%',
        height: '12.5%',
        transform: `translate(${pos.col * 100}%, ${pos.row * 100}%)`,
        transition: animate ? `transform ${animateMs}ms ease` : 'none',
        opacity: hidden ? 0 : 1,
        cursor: pickable ? 'grab' : 'default',
        filter: 'var(--cq-piece-shadow)',
      }}
    />
  );
}
