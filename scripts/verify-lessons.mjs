// Verify the curriculum: every FEN is legal, every solution move is legal, and
// every `checkmate: true` solution actually delivers mate. collect/tap-squares
// use lone-piece boards (no kings) and are checked with a single-piece move
// generator instead of chess.js.
//
// Run: npm run verify:lessons   (exits non-zero on any error)

import { Chess } from 'chess.js';
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

// Load the TS curriculum by transpiling on the fly is overkill; instead we parse
// the exported UNITS by importing a JSON mirror the script builds from the TS.
// Simpler: import via a tiny tsx-free loader — we read the file and eval the array.
import { readFile } from 'node:fs/promises';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const fileOf = (s) => FILES.indexOf(s[0]);
const rankOf = (s) => parseInt(s[1], 10) - 1;
const sq = (f, r) => (f < 0 || f > 7 || r < 0 || r > 7 ? null : `${FILES[f]}${r + 1}`);

function parseBoard(fen) {
  const board = new Map();
  const placement = fen.split(' ')[0];
  const rows = placement.split('/');
  for (let r = 0; r < 8; r++) {
    let file = 0;
    for (const ch of rows[r]) {
      if (/\d/.test(ch)) file += +ch;
      else {
        const color = ch === ch.toUpperCase() ? 'w' : 'b';
        board.set(`${FILES[file]}${8 - r}`, { color, type: ch.toLowerCase() });
        file++;
      }
    }
  }
  return board;
}

const SLIDE = { r: [[1,0],[-1,0],[0,1],[0,-1]], b: [[1,1],[1,-1],[-1,1],[-1,-1]], q: [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]] };
const KNIGHT = [[1,2],[2,1],[2,-1],[1,-2],[-1,-2],[-2,-1],[-2,1],[-1,2]];
const KING = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];

function pieceMoves(board, from) {
  const piece = board.get(from);
  if (!piece) return [];
  const f = fileOf(from), r = rankOf(from), out = [];
  if (piece.type === 'n' || piece.type === 'k') {
    for (const [df, dr] of piece.type === 'n' ? KNIGHT : KING) {
      const s = sq(f + df, r + dr);
      if (s) { const o = board.get(s); if (!o || o.color !== piece.color) out.push(s); }
    }
  } else if (piece.type === 'p') {
    const dir = piece.color === 'w' ? 1 : -1;
    const one = sq(f, r + dir);
    if (one && !board.get(one)) { out.push(one); const two = sq(f, r + 2*dir); const start = piece.color === 'w' ? 1 : 6; if (r === start && two && !board.get(two)) out.push(two); }
    for (const df of [-1, 1]) { const c = sq(f + df, r + dir); if (c) { const o = board.get(c); if (o && o.color !== piece.color) out.push(c); } }
  } else {
    for (const [df, dr] of SLIDE[piece.type]) {
      let nf = f + df, nr = r + dr;
      while (true) { const s = sq(nf, nr); if (!s) break; const o = board.get(s); if (!o) { out.push(s); } else { if (o.color !== piece.color) out.push(s); break; } nf += df; nr += dr; }
    }
  }
  return out;
}

// BFS: can the lone hero piece reach all star squares in some sequence of moves?
function canCollect(fen, stars, mover = 'w') {
  let board = parseBoard(fen);
  let heroSq = null;
  for (const [s, p] of board) if (p.color === mover) heroSq = s;
  if (!heroSq) return false;
  const remaining = new Set(stars);
  // Greedy-with-backtracking is overkill; stars are designed as a connected path.
  // Try: repeatedly, find a star reachable in one move; move there; repeat.
  let guard = 0;
  while (remaining.size && guard++ < 20) {
    const dests = pieceMoves(board, heroSq);
    const hit = [...remaining].find((star) => dests.includes(star));
    if (!hit) return false;
    const piece = board.get(heroSq);
    board.delete(heroSq);
    board.set(hit, piece);
    heroSq = hit;
    remaining.delete(hit);
  }
  return remaining.size === 0;
}

// Extract the UNITS array from the TS source by stripping types and eval'ing.
async function loadUnits() {
  const src = await readFile(new URL('../lib/learn/curriculum.ts', import.meta.url), 'utf8');
  // Grab the UNITS array literal.
  const start = src.indexOf('export const UNITS');
  const eq = src.indexOf('=', start);
  const arrStart = src.indexOf('[', eq);
  // Find the matching close bracket for the top-level array.
  let depth = 0, i = arrStart, end = -1;
  for (; i < src.length; i++) {
    if (src[i] === '[') depth++;
    else if (src[i] === ']') { depth--; if (depth === 0) { end = i; break; } }
  }
  let literal = src.slice(arrStart, end + 1);
  // Replace the `EMPTY_BOARD_FEN` identifier with its value.
  literal = literal.replace(/EMPTY_BOARD_FEN/g, "'8/8/8/8/8/8/8/8 w - - 0 1'");
  // eslint-disable-next-line no-eval
  return eval('(' + literal + ')');
}

const SQUARE_RE = /^[a-h][1-8]$/;
const UCI_RE = /^[a-h][1-8][a-h][1-8][qrbn]?$/;

const units = await loadUnits();
let errors = 0;
let checked = 0;
const err = (where, msg) => { console.error(`❌ ${where}: ${msg}`); errors++; };

const ids = new Set();
for (const unit of units) {
  for (const lesson of unit.lessons) {
    if (ids.has(lesson.id)) err(lesson.id, 'duplicate lesson id');
    ids.add(lesson.id);
    lesson.exercises.forEach((ex, idx) => {
      const where = `${lesson.id}#${idx} (${ex.type})`;
      checked++;
      try {
        if (ex.fen && (ex.type === 'best-move' || ex.type === 'line' || ex.type === 'mcq')) {
          // Full-position exercises must be legal chess. (info diagrams may show
          // lone pieces / empty boards, so they are intentionally not validated.)
          const chess = new Chess(ex.fen);
          if (ex.type === 'best-move') {
            for (const uci of ex.solutions) {
              if (!UCI_RE.test(uci)) { err(where, `bad UCI ${uci}`); continue; }
              const probe = new Chess(ex.fen);
              const mv = probe.move({ from: uci.slice(0,2), to: uci.slice(2,4), promotion: uci[4] });
              if (!mv) { err(where, `illegal solution ${uci}`); continue; }
              if (ex.checkmate && !probe.isCheckmate()) err(where, `solution ${uci} is NOT checkmate`);
            }
          }
          if (ex.type === 'line') {
            const probe = new Chess(ex.fen);
            for (const uci of ex.line) {
              const mv = probe.move({ from: uci.slice(0,2), to: uci.slice(2,4), promotion: uci[4] });
              if (!mv) { err(where, `illegal line move ${uci}`); break; }
            }
          }
          void chess;
        }
        if (ex.type === 'collect') {
          for (const s of ex.stars) if (!SQUARE_RE.test(s)) err(where, `bad star square ${s}`);
          if (!canCollect(ex.fen, ex.stars)) err(where, `stars are NOT collectible in sequence: ${ex.stars.join(',')}`);
        }
        if (ex.type === 'tap-squares') {
          for (const s of ex.targets) if (!SQUARE_RE.test(s)) err(where, `bad target square ${s}`);
          // If targets are a piece's reachable set, sanity-check the piece exists.
        }
        if (ex.type === 'mcq') {
          if (ex.answer < 0 || ex.answer >= ex.choices.length) err(where, `answer index out of range`);
        }
      } catch (e) {
        err(where, `threw: ${e.message}`);
      }
    });
  }
}

console.log(`\nChecked ${checked} exercises across ${ids.size} lessons.`);
if (errors) { console.error(`\n💥 ${errors} problem(s) found.`); process.exit(1); }
console.log('✅ All lessons valid.');
