// Square/coordinate helpers shared by the board UI.

export type Square = string; // 'a1'..'h8'
export type PieceColor = 'w' | 'b';
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';

export interface BoardPiece {
  color: PieceColor;
  type: PieceType;
}

export const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
export const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'] as const;

export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

/** Parse the placement field of a FEN into a square→piece map. */
export function parseFenBoard(fen: string): Map<Square, BoardPiece> {
  const board = new Map<Square, BoardPiece>();
  const placement = fen.split(' ')[0] || '';
  const rows = placement.split('/');
  for (let r = 0; r < rows.length && r < 8; r++) {
    let file = 0;
    for (const ch of rows[r]) {
      if (/\d/.test(ch)) {
        file += parseInt(ch, 10);
      } else {
        const color: PieceColor = ch === ch.toUpperCase() ? 'w' : 'b';
        const type = ch.toLowerCase() as PieceType;
        const square = `${FILES[file]}${8 - r}`;
        board.set(square, { color, type });
        file++;
      }
    }
  }
  return board;
}

export function sideToMove(fen: string): PieceColor {
  return (fen.split(' ')[1] as PieceColor) || 'w';
}

/** Grid position (0-7 col, 0-7 row from top-left) for a square given orientation. */
export function squareToGrid(square: Square, orientation: PieceColor): { col: number; row: number } {
  const file = FILES.indexOf(square[0] as (typeof FILES)[number]);
  const rank = parseInt(square[1], 10) - 1;
  if (orientation === 'w') return { col: file, row: 7 - rank };
  return { col: 7 - file, row: rank };
}

export function gridToSquare(col: number, row: number, orientation: PieceColor): Square | null {
  if (col < 0 || col > 7 || row < 0 || row > 7) return null;
  if (orientation === 'w') return `${FILES[col]}${8 - row}`;
  return `${FILES[7 - col]}${row + 1}`;
}

/** Piece image path, e.g. wK → /pieces/classic/wK.svg */
export function pieceSrc(piece: BoardPiece, set: string = 'classic'): string {
  return `/pieces/${set}/${piece.color}${piece.type.toUpperCase()}.svg`;
}
