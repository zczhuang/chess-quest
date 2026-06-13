// The Chess Quest curriculum — Duolingo-style units → lessons → bite-size,
// auto-checkable exercises. Ordered absolute-beginner → first tactics (~800 Elo).
//
// ⛔ Lesson `id`s are progress keys (l:<id>) and are FOREVER stable.
// Every FEN + solution here is checked by `npm run verify:lessons` (chess.js).
// collect/tap-squares use lone pieces (no kings) on purpose — they teach raw
// movement and are validated by lib/learn/pieceMoves, not chess.js.

import { EMPTY_BOARD_FEN, type Unit } from './types';

export const UNITS: Unit[] = [
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'board',
    title: 'Meet the Board',
    emoji: '🗺️',
    color: '#4c8dff',
    blurb: 'Squares, files, and ranks — your battlefield.',
    lessons: [
      {
        id: 'board-1',
        title: 'The Battlefield',
        emoji: '🏁',
        xp: 10,
        exercises: [
          {
            type: 'info',
            title: 'Welcome, champion!',
            body: 'A chessboard has 64 squares — 8 rows across and 8 rows up. Half are light, half are dark. This is where every chess adventure happens!',
            fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
          },
          {
            type: 'mcq',
            question: 'How many squares are on a chessboard?',
            choices: ['16', '32', '64', '100'],
            answer: 2,
            explain: '8 × 8 = 64 squares. A perfect little world!',
          },
          {
            type: 'tap-squares',
            title: 'Find the corners',
            instructions: 'Tap all four corner squares of the board.',
            fen: EMPTY_BOARD_FEN,
            targets: ['a1', 'h1', 'a8', 'h8'],
            explain: 'The corners — a1, h1, a8, and h8. Notice a light square is always on the right!',
          },
          {
            type: 'mcq',
            question: 'Which color square is always in the bottom-right corner?',
            choices: ['Light', 'Dark'],
            answer: 0,
            explain: '“Light on the right” — an easy way to set up the board correctly.',
          },
        ],
      },
      {
        id: 'board-2',
        title: 'Files & Ranks',
        emoji: '🔢',
        xp: 10,
        exercises: [
          {
            type: 'info',
            title: 'Naming squares',
            body: 'Columns are FILES, lettered a–h from left to right. Rows are RANKS, numbered 1–8 from bottom to top. Every square has a name like e4 — file e, rank 4.',
            fen: EMPTY_BOARD_FEN,
          },
          {
            type: 'tap-squares',
            title: 'Center square',
            instructions: 'Tap the square e4.',
            fen: EMPTY_BOARD_FEN,
            targets: ['e4'],
            explain: 'e4 — one of the most important squares in chess!',
          },
          {
            type: 'tap-squares',
            title: 'Bottom-left',
            instructions: 'Tap the square a1.',
            fen: EMPTY_BOARD_FEN,
            targets: ['a1'],
          },
          {
            type: 'tap-squares',
            title: 'Top-right',
            instructions: 'Tap the square h8.',
            fen: EMPTY_BOARD_FEN,
            targets: ['h8'],
          },
          {
            type: 'mcq',
            question: 'Files are lettered a–h. What are ranks?',
            choices: ['Numbered 1–8', 'Lettered i–p', 'Colored'],
            answer: 0,
            explain: 'Letters for files, numbers for ranks. Together they name every square.',
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'pieces',
    title: 'How the Pieces Move',
    emoji: '♟️',
    color: '#7c5cff',
    blurb: 'Meet your whole army, one piece at a time.',
    lessons: [
      {
        id: 'piece-rook',
        title: 'The Rook',
        emoji: '🏰',
        xp: 12,
        exercises: [
          {
            type: 'info',
            title: 'The Rook',
            body: 'The Rook moves in straight lines — up, down, left, or right — as far as it likes. It cannot jump over pieces.',
            fen: '8/8/8/8/3R4/8/8/8 w - - 0 1',
          },
          {
            type: 'collect',
            title: 'Star run',
            instructions: 'Move the rook to land on every star. Straight lines only!',
            fen: '8/8/8/8/8/8/8/R7 w - - 0 1',
            stars: ['d1', 'd8'],
            maxMoves: 2,
          },
          {
            type: 'collect',
            title: 'Around the houses',
            instructions: 'Collect all three stars with the rook.',
            fen: '8/8/8/8/8/8/8/R7 w - - 0 1',
            stars: ['a5', 'e5', 'e1'],
            maxMoves: 3,
          },
          {
            type: 'mcq',
            question: 'Can a rook move diagonally?',
            choices: ['Yes', 'No'],
            answer: 1,
            explain: 'Never! Rooks love straight lines. Diagonals belong to the bishop.',
          },
        ],
      },
      {
        id: 'piece-bishop',
        title: 'The Bishop',
        emoji: '⛪',
        xp: 12,
        exercises: [
          {
            type: 'info',
            title: 'The Bishop',
            body: 'The Bishop slides along diagonals as far as it likes. Each bishop stays on ONE color the entire game.',
            fen: '8/8/8/8/3B4/8/8/8 w - - 0 1',
          },
          {
            type: 'collect',
            title: 'Diagonal dash',
            instructions: 'Move the bishop along the diagonals to collect the stars.',
            fen: '8/8/8/8/8/8/8/2B5 w - - 0 1',
            stars: ['e3', 'h6'],
            maxMoves: 2,
          },
          {
            type: 'mcq',
            question: 'A bishop that starts on a dark square can reach…',
            choices: ['Only dark squares', 'Only light squares', 'Any square'],
            answer: 0,
            explain: 'Bishops are loyal to their color forever — that is why you have one of each!',
          },
        ],
      },
      {
        id: 'piece-queen',
        title: 'The Queen',
        emoji: '👑',
        xp: 14,
        exercises: [
          {
            type: 'info',
            title: 'The Queen',
            body: 'The Queen is the most powerful piece: she moves like a rook AND a bishop — straight lines and diagonals, any distance.',
            fen: '8/8/8/8/3Q4/8/8/8 w - - 0 1',
          },
          {
            type: 'collect',
            title: 'Royal tour',
            instructions: 'The queen can go straight OR diagonal. Collect both stars.',
            fen: '8/8/8/8/8/8/8/3Q4 w - - 0 1',
            stars: ['h5', 'a5'],
            maxMoves: 2,
          },
          {
            type: 'mcq',
            question: 'The queen moves like which two pieces combined?',
            choices: ['Rook + Bishop', 'Knight + King', 'Two pawns'],
            answer: 0,
            explain: 'Rook + Bishop = Queen. That is why she is so strong — protect her!',
          },
        ],
      },
      {
        id: 'piece-king',
        title: 'The King',
        emoji: '🤴',
        xp: 12,
        exercises: [
          {
            type: 'info',
            title: 'The King',
            body: 'The King moves just one square in any direction. He is slow but precious — if he is trapped, the game is over.',
            fen: '8/8/8/8/4K3/8/8/8 w - - 0 1',
          },
          {
            type: 'collect',
            title: 'Baby steps',
            instructions: 'Walk the king one square at a time to collect the stars.',
            fen: '8/8/8/8/8/8/8/4K3 w - - 0 1',
            stars: ['d2', 'e3'],
            maxMoves: 2,
          },
          {
            type: 'mcq',
            question: 'How many squares can the king move at once?',
            choices: ['1', '2', 'Any number'],
            answer: 0,
            explain: 'Just one square — but in any of the 8 directions.',
          },
        ],
      },
      {
        id: 'piece-knight',
        title: 'The Knight',
        emoji: '🐴',
        xp: 16,
        exercises: [
          {
            type: 'info',
            title: 'The Knight',
            body: 'The Knight moves in an L-shape: two squares one way, then one square to the side. It is the ONLY piece that can jump over others!',
            fen: '8/8/8/8/3N4/8/8/8 w - - 0 1',
          },
          {
            type: 'tap-squares',
            title: 'Where can it jump?',
            instructions: 'Tap every square this knight can jump to.',
            fen: '8/8/8/8/3N4/8/8/8 w - - 0 1',
            targets: ['b3', 'b5', 'c2', 'c6', 'e2', 'e6', 'f3', 'f5'],
            explain: 'Eight L-shaped jumps from the center. Knights are tricky!',
          },
          {
            type: 'collect',
            title: 'Leap frog',
            instructions: 'Hop the knight in L-shapes to collect the stars.',
            fen: '8/8/8/8/8/8/8/N7 w - - 0 1',
            stars: ['b3', 'c5'],
            maxMoves: 2,
          },
          {
            type: 'mcq',
            question: 'Which piece can jump over other pieces?',
            choices: ['Rook', 'Knight', 'Bishop'],
            answer: 1,
            explain: 'Only the knight leaps. Handy in a crowded board!',
          },
        ],
      },
      {
        id: 'piece-pawn',
        title: 'The Pawn',
        emoji: '♙',
        xp: 14,
        exercises: [
          {
            type: 'info',
            title: 'The Pawn',
            body: 'Pawns move forward one square — or two on their very first move. But they CAPTURE diagonally forward. Small but mighty!',
            fen: '8/8/8/8/8/8/4P3/8 w - - 0 1',
          },
          {
            type: 'best-move',
            title: 'The big first step',
            instructions: 'It is this pawn’s first move. Push it forward two squares!',
            fen: '4k3/8/8/8/8/8/4P3/4K3 w - - 0 1',
            solutions: ['e2e4'],
            explain: 'On its first move only, a pawn may leap two squares.',
          },
          {
            type: 'mcq',
            question: 'How do pawns capture?',
            choices: ['Straight ahead', 'Diagonally forward', 'Sideways'],
            answer: 1,
            explain: 'Pawns push straight but bite diagonally!',
          },
          {
            type: 'best-move',
            title: 'Pawn takes!',
            instructions: 'Capture the black pawn with your pawn.',
            fen: '4k3/8/8/3p4/4P3/8/8/4K3 w - - 0 1',
            solutions: ['e4d5'],
            explain: 'The pawn captures one square diagonally forward.',
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'capture-check',
    title: 'Capture & Check',
    emoji: '⚔️',
    color: '#ff9f43',
    blurb: 'Win material and put the king in danger.',
    lessons: [
      {
        id: 'capturing',
        title: 'Capturing',
        emoji: '🍽️',
        xp: 14,
        exercises: [
          {
            type: 'info',
            title: 'Taking pieces',
            body: 'To capture, move your piece onto an enemy piece’s square. The enemy piece leaves the board and yours takes its place.',
            fen: '8/8/8/3r4/3R4/8/8/8 w - - 0 1',
          },
          {
            type: 'best-move',
            title: 'Free queen!',
            instructions: 'The black queen is undefended. Grab it with your rook!',
            fen: 'q3k3/8/8/8/8/8/8/R3K3 w - - 0 1',
            solutions: ['a1a8'],
            explain: 'Always look for free pieces — captures win games.',
          },
          {
            type: 'best-move',
            title: 'Knight snack',
            instructions: 'Win the rook with your knight.',
            fen: '4k3/8/8/5r2/3N4/8/8/4K3 w - - 0 1',
            solutions: ['d4f5'],
            explain: 'The knight hops in and takes the rook for free.',
          },
        ],
      },
      {
        id: 'check',
        title: 'Check!',
        emoji: '⚡',
        xp: 14,
        exercises: [
          {
            type: 'info',
            title: 'Attacking the king',
            body: 'When a piece attacks the enemy king, that is CHECK. The other player MUST get their king to safety on the next move.',
            fen: '4k3/8/8/8/8/8/8/4R1K1 w - - 0 1',
          },
          {
            type: 'best-move',
            title: 'Say check!',
            instructions: 'Move your queen to give check to the black king.',
            fen: '4k3/8/8/8/Q7/8/8/4K3 w - - 0 1',
            solutions: ['a4e4', 'a4a8', 'a4d7'],
            checkmate: false,
            explain: 'There are several ways to check — any move attacking e8 counts.',
          },
          {
            type: 'best-move',
            title: 'Rook check',
            instructions: 'Give check with your rook.',
            fen: '4k3/8/8/8/8/8/8/R5K1 w - - 0 1',
            solutions: ['a1a8', 'a1e1'],
            checkmate: false,
            explain: 'A rook checks by reaching the king’s file or rank.',
          },
        ],
      },
      {
        id: 'escape-check',
        title: 'Escaping Check',
        emoji: '🛡️',
        xp: 16,
        exercises: [
          {
            type: 'info',
            title: 'Three ways out',
            body: 'When you are in check you have 3 choices: MOVE the king away, BLOCK with another piece, or CAPTURE the attacker.',
            fen: '4r3/k7/8/8/7R/8/8/4K3 w - - 0 1',
          },
          {
            type: 'best-move',
            title: 'Block it!',
            instructions: 'You are in check from the rook. Block it with your own rook.',
            fen: '4r3/k7/8/8/7R/8/8/4K3 w - - 0 1',
            solutions: ['h4e4'],
            explain: 'Sliding your rook to e4 blocks the check along the e-file.',
          },
          {
            type: 'best-move',
            title: 'Take the attacker',
            instructions: 'A knight is checking your king. Capture it with your pawn!',
            fen: '4k3/8/8/8/8/5n2/6P1/4K3 w - - 0 1',
            solutions: ['g2f3'],
            explain: 'Capturing the checking piece is often the cleanest escape.',
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'mate-special',
    title: 'Checkmate & Special Moves',
    emoji: '🏆',
    color: '#ff6b5e',
    blurb: 'End the game — and learn castling and promotion.',
    lessons: [
      {
        id: 'checkmate',
        title: 'Checkmate',
        emoji: '👑',
        xp: 18,
        exercises: [
          {
            type: 'info',
            title: 'The goal of chess',
            body: 'Checkmate is a check the king cannot escape — no move, no block, no capture saves him. That ends the game. You win!',
            fen: '6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1',
          },
          {
            type: 'best-move',
            title: 'Back-rank mate',
            instructions: 'The king is trapped behind its pawns. Deliver checkmate with your rook!',
            fen: '6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1',
            solutions: ['a1a8'],
            checkmate: true,
            explain: 'The rook checks along the 8th rank and the pawns block every escape. Checkmate!',
          },
          {
            type: 'best-move',
            title: 'Queen finish',
            instructions: 'Checkmate the black king in one move with your queen.',
            fen: '6k1/5ppp/8/8/8/8/8/3Q2K1 w - - 0 1',
            solutions: ['d1d8'],
            checkmate: true,
            explain: 'Same back-rank idea — the queen lands on d8 with no escape.',
          },
          {
            type: 'mcq',
            question: 'What is checkmate?',
            choices: ['A check the king can’t escape', 'A friendly draw', 'Taking the queen'],
            answer: 0,
            explain: 'Trap the king and the game is yours.',
          },
        ],
      },
      {
        id: 'castling',
        title: 'Castling',
        emoji: '🏰',
        xp: 16,
        exercises: [
          {
            type: 'info',
            title: 'King safety',
            body: 'Castling is a special move: the king slides two squares toward a rook, and the rook hops to the other side. It tucks your king away safely.',
            fen: '4k3/8/8/8/8/8/8/4K2R w K - 0 1',
          },
          {
            type: 'best-move',
            title: 'Castle kingside',
            instructions: 'Castle! Move your king two squares toward the rook.',
            fen: '4k3/8/8/8/8/8/8/4K2R w K - 0 1',
            solutions: ['e1g1'],
            explain: 'The king goes to g1 and the rook jumps to f1 — all in one move.',
          },
          {
            type: 'mcq',
            question: 'When can you NOT castle?',
            choices: ['After the king has already moved', 'On weekends', 'If you still have a queen'],
            answer: 0,
            explain: 'Castling needs a king and rook that have never moved, with no pieces between them.',
          },
        ],
      },
      {
        id: 'promotion',
        title: 'Promotion',
        emoji: '✨',
        xp: 16,
        exercises: [
          {
            type: 'info',
            title: 'Pawns dream big',
            body: 'If a pawn marches all the way to the far side, it transforms — usually into a powerful Queen! This is called promotion.',
            fen: '4k3/P7/8/8/8/8/8/4K3 w - - 0 1',
          },
          {
            type: 'best-move',
            title: 'Make a queen',
            instructions: 'Push your pawn to the last rank and promote it to a queen!',
            fen: '4k3/P7/8/8/8/8/8/4K3 w - - 0 1',
            solutions: ['a7a8q'],
            explain: 'a8=Q! A brand-new queen joins your army.',
          },
          {
            type: 'mcq',
            question: 'What does a pawn usually become when it promotes?',
            choices: ['A Queen', 'Another pawn', 'A King'],
            answer: 0,
            explain: 'Almost always a queen — the strongest choice.',
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'tactics',
    title: 'First Tactics',
    emoji: '🎯',
    color: '#2fb877',
    blurb: 'Forks, pins, and finding checkmate in one.',
    lessons: [
      {
        id: 'fork',
        title: 'The Fork',
        emoji: '🍴',
        xp: 18,
        exercises: [
          {
            type: 'info',
            title: 'Two for one',
            body: 'A fork attacks two pieces at the same time. Your opponent can only save one! Knights are the kings of forking.',
            fen: 'r3k3/8/8/3N4/8/8/8/4K3 w - - 0 1',
          },
          {
            type: 'best-move',
            title: 'Knight fork',
            instructions: 'Jump your knight to attack the king AND the rook at once.',
            fen: 'r3k3/8/8/3N4/8/8/8/4K3 w - - 0 1',
            solutions: ['d5c7'],
            explain: 'Nc7 forks the king (check!) and the rook. After the king moves, you grab the rook.',
          },
          {
            type: 'best-move',
            title: 'Pawn fork',
            instructions: 'Push your pawn to attack both black pieces at once.',
            fen: '4k3/8/2n1b3/8/3P4/8/8/4K3 w - - 0 1',
            solutions: ['d4d5'],
            explain: 'd5 attacks the knight and the bishop together. Even pawns can fork!',
          },
          {
            type: 'mcq',
            question: 'What does a fork do?',
            choices: ['Attacks two pieces at once', 'Defends your king', 'Promotes a pawn'],
            answer: 0,
            explain: 'Two threats, one move — the opponent can’t save both.',
          },
        ],
      },
      {
        id: 'pin',
        title: 'The Pin',
        emoji: '📌',
        xp: 18,
        exercises: [
          {
            type: 'info',
            title: 'Frozen in place',
            body: 'A pin freezes an enemy piece: if it moves, something more valuable behind it would be captured. Pinned pieces are stuck!',
            fen: '4k3/8/8/4n3/8/8/8/R5K1 w - - 0 1',
          },
          {
            type: 'best-move',
            title: 'Pin the knight',
            instructions: 'Move your rook to pin the knight against the king.',
            fen: '4k3/8/8/4n3/8/8/8/R5K1 w - - 0 1',
            solutions: ['a1e1'],
            explain: 'Re1 lines up rook–knight–king. The knight can’t move or the king is exposed!',
          },
          {
            type: 'mcq',
            question: 'A pinned piece…',
            choices: ['Can’t move without exposing the king', 'Moves twice as far', 'Turns into a queen'],
            answer: 0,
            explain: 'That is what makes pins so powerful — the piece is paralyzed.',
          },
        ],
      },
      {
        id: 'mate-in-1',
        title: 'Mate in One',
        emoji: '🥇',
        xp: 20,
        exercises: [
          {
            type: 'info',
            title: 'Finish the game',
            body: 'The most important skill: spotting checkmate in one move. Look for checks the king cannot escape.',
            fen: '6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1',
          },
          {
            type: 'best-move',
            title: 'Find mate #1',
            instructions: 'Checkmate in one move with your rook.',
            fen: '6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1',
            solutions: ['d1d8'],
            checkmate: true,
            explain: 'Rd8# — back-rank checkmate. The pawns seal the king’s fate.',
          },
          {
            type: 'best-move',
            title: 'Find mate #2',
            instructions: 'Checkmate in one move with your queen.',
            fen: '6k1/5ppp/8/8/8/8/8/3Q2K1 w - - 0 1',
            solutions: ['d1d8'],
            checkmate: true,
            explain: 'Qd8# — the queen delivers the final blow on the back rank.',
          },
          {
            type: 'best-move',
            title: 'Find mate #3',
            instructions: 'One move to checkmate — use your rook on the open file.',
            fen: '7k/5ppp/8/8/8/8/8/R6K w - - 0 1',
            solutions: ['a1a8'],
            checkmate: true,
            explain: 'Ra8# — another back-rank finish. You’re a checkmate machine!',
          },
        ],
      },
    ],
  },
];

// ---- Derived helpers --------------------------------------------------------

export const ALL_LESSONS = UNITS.flatMap((u) => u.lessons.map((l) => ({ unit: u, lesson: l })));

export function findLesson(lessonId: string) {
  return ALL_LESSONS.find((x) => x.lesson.id === lessonId) ?? null;
}

export function unitProgress(unitId: string, completed: Set<string>): { done: number; total: number } {
  const unit = UNITS.find((u) => u.id === unitId);
  if (!unit) return { done: 0, total: 0 };
  return {
    done: unit.lessons.filter((l) => completed.has(l.id)).length,
    total: unit.lessons.length,
  };
}

/** A lesson is unlocked when the previous lesson (across the whole path) is done. */
export function isLessonUnlocked(lessonId: string, completed: Set<string>): boolean {
  const idx = ALL_LESSONS.findIndex((x) => x.lesson.id === lessonId);
  if (idx <= 0) return true;
  return completed.has(ALL_LESSONS[idx - 1].lesson.id);
}
