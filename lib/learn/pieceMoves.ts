// Single-piece move generator for the Learn module's "collect" and "tap-squares"
// exercises. These use lone pieces on otherwise-empty boards (e.g. just a knight),
// which chess.js rejects as illegal FENs — so we compute movement ourselves.
//
// This is pseudo-legal piece movement (blocked by occupancy, captures enemies);
// it intentionally ignores check, since the point is teaching how a piece moves.

import { FILES, parseFenBoard, type BoardPiece, type PieceColor, type Square } from '@/lib/chess/coords';

function sq(file: number, rank: number): Square | null {
  if (file < 0 || file > 7 || rank < 0 || rank > 7) return null;
  return `${FILES[file]}${rank + 1}`;
}
function fileOf(s: Square): number {
  return FILES.indexOf(s[0] as (typeof FILES)[number]);
}
function rankOf(s: Square): number {
  return parseInt(s[1], 10) - 1;
}

const SLIDE: Record<string, number[][]> = {
  r: [[1, 0], [-1, 0], [0, 1], [0, -1]],
  b: [[1, 1], [1, -1], [-1, 1], [-1, -1]],
  q: [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]],
};
const KNIGHT = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]];
const KING = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

/** Destination squares for the piece on `from` given the board's occupancy. */
export function pieceMoves(board: Map<Square, BoardPiece>, from: Square): Square[] {
  const piece = board.get(from);
  if (!piece) return [];
  const f = fileOf(from);
  const r = rankOf(from);
  const out: Square[] = [];
  const occupant = (s: Square) => board.get(s);
  const tryLand = (s: Square | null): 'stop' | 'continue' => {
    if (!s) return 'stop';
    const o = occupant(s);
    if (!o) {
      out.push(s);
      return 'continue';
    }
    if (o.color !== piece.color) out.push(s); // capture
    return 'stop';
  };

  if (piece.type === 'n') {
    for (const [df, dr] of KNIGHT) {
      const s = sq(f + df, r + dr);
      if (s) {
        const o = occupant(s);
        if (!o || o.color !== piece.color) out.push(s);
      }
    }
  } else if (piece.type === 'k') {
    for (const [df, dr] of KING) {
      const s = sq(f + df, r + dr);
      if (s) {
        const o = occupant(s);
        if (!o || o.color !== piece.color) out.push(s);
      }
    }
  } else if (piece.type === 'p') {
    const dir = piece.color === 'w' ? 1 : -1;
    const one = sq(f, r + dir);
    if (one && !occupant(one)) {
      out.push(one);
      const startRank = piece.color === 'w' ? 1 : 6;
      const two = sq(f, r + 2 * dir);
      if (r === startRank && two && !occupant(two)) out.push(two);
    }
    for (const df of [-1, 1]) {
      const cap = sq(f + df, r + dir);
      if (cap) {
        const o = occupant(cap);
        if (o && o.color !== piece.color) out.push(cap);
      }
    }
  } else {
    const dirs = SLIDE[piece.type];
    for (const [df, dr] of dirs) {
      let nf = f + df;
      let nr = r + dr;
      while (true) {
        const s = sq(nf, nr);
        if (tryLand(s) === 'stop') break;
        nf += df;
        nr += dr;
      }
    }
  }
  return out;
}

/** Build the Board `dests` map for the single movable hero piece of `mover`. */
export function heroDests(fen: string, mover: PieceColor): Map<Square, Square[]> {
  const board = parseFenBoard(fen);
  const dests = new Map<Square, Square[]>();
  board.forEach((piece, square) => {
    if (piece.color === mover) {
      const moves = pieceMoves(board, square);
      if (moves.length) dests.set(square, moves);
    }
  });
  return dests;
}

/** Apply a from→to move on a raw board map (used by collect exercises). */
export function applyOnBoard(board: Map<Square, BoardPiece>, from: Square, to: Square): Map<Square, BoardPiece> {
  const next = new Map(board);
  const piece = next.get(from);
  if (!piece) return next;
  next.delete(from);
  next.set(to, piece);
  return next;
}

/** Serialize a board map back to a FEN placement (so Board can render it). */
export function boardToFen(board: Map<Square, BoardPiece>, turn: PieceColor = 'w'): string {
  const rows: string[] = [];
  for (let rank = 7; rank >= 0; rank--) {
    let row = '';
    let empty = 0;
    for (let file = 0; file < 8; file++) {
      const s = `${FILES[file]}${rank + 1}`;
      const p = board.get(s);
      if (!p) {
        empty++;
      } else {
        if (empty) {
          row += empty;
          empty = 0;
        }
        const ch = p.type === 'n' ? 'n' : p.type;
        row += p.color === 'w' ? ch.toUpperCase() : ch.toLowerCase();
      }
    }
    if (empty) row += empty;
    rows.push(row);
  }
  return `${rows.join('/')} ${turn} - - 0 1`;
}
