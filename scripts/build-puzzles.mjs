// Build bundled puzzle packs from the Lichess open puzzle database (CC0).
//   1. Download https://database.lichess.org/lichess_db_puzzle.csv.zst
//   2. zstd -d it to /tmp/lichess_db_puzzle.csv
//   3. node scripts/build-puzzles.mjs
//
// CSV columns: PuzzleId,FEN,Moves,Rating,RatingDeviation,Popularity,NbPlays,Themes,GameUrl,OpeningTags
// NOTE: FEN is the position BEFORE the opponent's first move; Moves[0] is the
// opponent's move (played automatically), the solver answers from Moves[1].
//
// Every sampled puzzle is re-validated by replaying all moves with chess.js.

import { createReadStream } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { createInterface } from 'node:readline';
import { Chess } from 'chess.js';

const SRC = process.env.PUZZLE_CSV || '/tmp/lichess_db_puzzle.csv';
const OUT = new URL('../public/puzzles/', import.meta.url).pathname;

// Quality gates
const MIN_POPULARITY = 90; // -100..100
const MIN_PLAYS = 2000;
const MAX_DEVIATION = 85;

// Rating bands for the adaptive trainer + rush
const BANDS = [
  { key: 'band-400', min: 0, max: 800, take: 700 },
  { key: 'band-800', min: 800, max: 1200, take: 700 },
  { key: 'band-1200', min: 1200, max: 1600, take: 700 },
  { key: 'band-1600', min: 1600, max: 2000, take: 500 },
  { key: 'band-2000', min: 2000, max: 9999, take: 400 },
];

// Theme packs (our curated taxonomy — kid-friendly subset of lichess themes)
const THEMES = [
  'mateIn1',
  'mateIn2',
  'fork',
  'pin',
  'skewer',
  'discoveredAttack',
  'hangingPiece',
  'backRankMate',
  'promotion',
  'defensiveMove',
  'endgame',
  'sacrifice',
];
const THEME_TAKE = 150;
// Theme packs skew easy so kids can use them; cap rating.
const THEME_MAX_RATING = 1800;

// Reservoir-less simple sampling: keep the first N that pass quality gates per
// bucket, but only accept each candidate with probability ACCEPT to spread the
// selection across the (rating-sorted-ish) file. Deterministic via LCG.
let seed = 42;
function rand() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 0xffffffff;
}
const ACCEPT = 0.18;

function validate(fen, moves) {
  try {
    const chess = new Chess(fen);
    for (const uci of moves) {
      const move = chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
      if (!move) return false;
    }
    return true;
  } catch {
    return false;
  }
}

const bandBuckets = new Map(BANDS.map((b) => [b.key, []]));
const themeBuckets = new Map(THEMES.map((t) => [t, []]));

const rl = createInterface({ input: createReadStream(SRC), crlfDelay: Infinity });
let lineNo = 0;
let kept = 0;
let invalid = 0;

for await (const line of rl) {
  lineNo++;
  if (lineNo === 1) continue; // header
  const cols = line.split(',');
  if (cols.length < 8) continue;
  const [id, fen, movesStr, ratingStr, devStr, popStr, playsStr, themesStr] = cols;
  const rating = +ratingStr;
  if (+popStr < MIN_POPULARITY || +playsStr < MIN_PLAYS || +devStr > MAX_DEVIATION) continue;

  const themes = themesStr.split(' ');
  const moves = movesStr.split(' ');

  const band = BANDS.find((b) => rating >= b.min && rating < b.max);
  const bandFull = !band || bandBuckets.get(band.key).length >= band.take;
  const wantedThemes = themes.filter(
    (t) => themeBuckets.has(t) && rating <= THEME_MAX_RATING && themeBuckets.get(t).length < THEME_TAKE
  );
  if (bandFull && wantedThemes.length === 0) continue;
  if (rand() > ACCEPT) continue;

  if (!validate(fen, moves)) {
    invalid++;
    continue;
  }

  const puzzle = {
    id,
    fen,
    moves,
    rating,
    themes: themes.filter((t) => themeBuckets.has(t)),
  };
  if (!bandFull) {
    bandBuckets.get(band.key).push(puzzle);
    kept++;
  }
  for (const t of wantedThemes) themeBuckets.get(t).push(puzzle);

  if ([...bandBuckets.values()].every((b, i) => b.length >= BANDS[i].take) &&
      [...themeBuckets.values()].every((b) => b.length >= THEME_TAKE)) {
    break;
  }
}

await mkdir(`${OUT}by-rating`, { recursive: true });
await mkdir(`${OUT}themes`, { recursive: true });

for (const b of BANDS) {
  const list = bandBuckets.get(b.key);
  await writeFile(`${OUT}by-rating/${b.key}.json`, JSON.stringify(list));
  console.log(`${b.key}: ${list.length}`);
}
for (const t of THEMES) {
  const list = themeBuckets.get(t);
  await writeFile(`${OUT}themes/${t}.json`, JSON.stringify(list));
  console.log(`theme ${t}: ${list.length}`);
}
console.log(`scanned ${lineNo} lines, kept ${kept} band puzzles, ${invalid} failed validation`);
