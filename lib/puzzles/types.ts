// Puzzle shape (matches the JSON produced by scripts/build-puzzles.mjs).
// FEN is the position BEFORE the opponent's setup move. moves[0] is the
// opponent's move (auto-played); the solver answers from moves[1] onward,
// alternating (solver plays odd indices, opponent even indices ≥2).

export interface Puzzle {
  id: string;
  fen: string;
  moves: string[]; // UCI
  rating: number;
  themes: string[];
}

export const RATING_BANDS = [
  { key: 'band-400', min: 0, max: 800 },
  { key: 'band-800', min: 800, max: 1200 },
  { key: 'band-1200', min: 1200, max: 1600 },
  { key: 'band-1600', min: 1600, max: 2000 },
  { key: 'band-2000', min: 2000, max: 9999 },
];

export const THEMES: { key: string; label: string; emoji: string; blurb: string }[] = [
  { key: 'mateIn1', label: 'Mate in 1', emoji: '👑', blurb: 'One move to checkmate.' },
  { key: 'mateIn2', label: 'Mate in 2', emoji: '⚡', blurb: 'Force mate in two moves.' },
  { key: 'fork', label: 'Forks', emoji: '🍴', blurb: 'Attack two things at once.' },
  { key: 'pin', label: 'Pins', emoji: '📌', blurb: 'Freeze an enemy piece.' },
  { key: 'skewer', label: 'Skewers', emoji: '🍢', blurb: 'Win the piece behind.' },
  { key: 'discoveredAttack', label: 'Discovered', emoji: '🎭', blurb: 'Unveil a hidden attacker.' },
  { key: 'hangingPiece', label: 'Free Pieces', emoji: '🎁', blurb: 'Grab the undefended piece.' },
  { key: 'backRankMate', label: 'Back Rank', emoji: '🚪', blurb: 'Mate on the last rank.' },
  { key: 'promotion', label: 'Promotion', emoji: '✨', blurb: 'Make a new queen.' },
  { key: 'defensiveMove', label: 'Defense', emoji: '🛡️', blurb: 'Find the only save.' },
  { key: 'endgame', label: 'Endgames', emoji: '🏁', blurb: 'Few pieces, big ideas.' },
  { key: 'sacrifice', label: 'Sacrifices', emoji: '💥', blurb: 'Give up material to win.' },
];

export function bandForRating(rating: number): string {
  const b = RATING_BANDS.find((b) => rating >= b.min && rating < b.max);
  return b?.key ?? 'band-800';
}

const cache = new Map<string, Puzzle[]>();

export async function loadPack(kind: 'by-rating' | 'themes', key: string): Promise<Puzzle[]> {
  const cacheKey = `${kind}/${key}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;
  const res = await fetch(`/puzzles/${kind}/${key}.json`);
  if (!res.ok) return [];
  const data = (await res.json()) as Puzzle[];
  cache.set(cacheKey, data);
  return data;
}

/** Simple Elo update for puzzle rating. Puzzle is the "opponent". */
export function updateRating(playerRating: number, puzzleRating: number, solved: boolean): number {
  const expected = 1 / (1 + Math.pow(10, (puzzleRating - playerRating) / 400));
  const K = 32;
  const next = playerRating + K * ((solved ? 1 : 0) - expected);
  return Math.max(100, Math.round(next));
}
