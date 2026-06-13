// The Learn module's content schema. Every exercise is auto-checkable on the
// interactive board (or a tap-choice). Lessons are bite-size: 5-9 exercises,
// ~3 minutes. Content lives in lib/learn/curriculum/*.ts and is verified by
// scripts/verify-lessons.mjs (FEN legality, solution correctness, mate checks).

import type { Square } from '@/lib/chess/coords';

export type Exercise =
  | {
      /** Teaching card: Rookie explains something, optionally over a board diagram. */
      type: 'info';
      title: string;
      body: string;
      fen?: string;
      decorations?: Partial<Record<Square, 'star' | 'target' | 'good' | 'bad' | 'sparkle'>>;
      highlights?: Square[];
    }
  | {
      /** Move the lone piece to collect every star (captures allowed; same piece moves repeatedly). */
      type: 'collect';
      title: string;
      instructions: string;
      fen: string; // position with the hero piece (and optional obstacles/enemies)
      stars: Square[];
      maxMoves?: number; // for 3-star scoring (optimal path)
    }
  | {
      /** Find the one best move (mate-in-1, win a piece, save a piece...). */
      type: 'best-move';
      title: string;
      instructions: string;
      fen: string;
      solutions: string[]; // accepted UCI moves, e.g. ['e5f7']
      hint?: string;
      explain?: string; // shown after solving
      checkmate?: boolean; // verifier asserts the solution mates
    }
  | {
      /** Play a forced sequence; scripted opponent replies between your moves. */
      type: 'line';
      title: string;
      instructions: string;
      fen: string;
      line: string[]; // UCI moves; user plays line[0], line[2], ... (opponent replies auto-play)
      explain?: string;
    }
  | {
      /** Multiple choice, optionally with a board diagram. */
      type: 'mcq';
      question: string;
      fen?: string;
      decorations?: Partial<Record<Square, 'star' | 'target' | 'good' | 'bad' | 'sparkle'>>;
      highlights?: Square[];
      choices: string[];
      answer: number; // index into choices
      explain?: string;
    }
  | {
      /** Tap the right square(s) on the board (e.g. "tap e4", "tap every square the rook can reach"). */
      type: 'tap-squares';
      title: string;
      instructions: string;
      fen: string; // can be an empty board: '8/8/8/8/8/8/8/8 w - - 0 1'
      targets: Square[]; // all must be tapped; wrong taps count as mistakes
      explain?: string;
    };

export interface Lesson {
  id: string; // stable forever — progress keys on it (l:<id>)
  title: string;
  emoji: string;
  xp: number; // base XP for completing
  exercises: Exercise[];
}

export interface Unit {
  id: string;
  title: string;
  emoji: string;
  color: string; // accent hex
  blurb: string;
  lessons: Lesson[];
}

export const EMPTY_BOARD_FEN = '8/8/8/8/8/8/8/8 w - - 0 1';
