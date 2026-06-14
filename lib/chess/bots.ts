// The bot ladder. Difficulty is produced by combining four levers, with the
// emphasis on WEAK-BUT-COHERENT play (Stockfish picking sub-optimal-but-sensible
// moves), NOT random flailing:
//   1. Skill Level (0-20) — Stockfish's built-in weakening; at low skill it plays
//      reasonable moves but misses the best one. This is the primary easy-bot dial.
//   2. depth — shallow search (1-6 ply) misses deeper tactics → "human-weak" play
//      that still grabs hanging pieces and avoids 1-move blunders.
//   3. elo — UCI_LimitStrength/UCI_Elo (≥1320) makes the upper bots actually play
//      at their displayed rating.
//   4. randomChance — a SMALL chance of an outright blunder, kept low (≤18%) so the
//      easy bots stay beatable for young kids without feeling broken. Was much
//      higher; lowered so bots play recognizable chess.

export interface BotEngineParams {
  skill: number;
  depth?: number;
  moveTimeMs?: number;
  elo?: number;
  randomChance: number;
}

export interface BotDef {
  id: string;
  name: string;
  elo: number; // display rating
  emoji: string;
  color: string; // card accent (tailwind-safe hex)
  tagline: string;
  intro: string; // speech bubble at game start
  winLine: string; // what the bot says when IT wins
  loseLine: string; // what it says when YOU win
  engine: BotEngineParams;
}

export const BOTS: BotDef[] = [
  {
    id: 'pip',
    name: 'Pip the Pawn',
    elo: 250,
    emoji: '🐣',
    color: '#ffc94d',
    tagline: 'Just learned the rules!',
    intro: "Hi! I'm Pip! I mostly move pieces because they look fun. Let's play!",
    winLine: 'Wow, I won?! That never happens!',
    loseLine: "Great game! You're really good at this!",
    engine: { skill: 0, depth: 1, randomChance: 0.18 },
  },
  {
    id: 'rookie',
    name: 'Rookie the Rook',
    elo: 400,
    emoji: '🏰',
    color: '#ff9f43',
    tagline: 'Loves straight lines, forgets to look both ways.',
    intro: "Rookie here! I love castles and straight lines. Watch out... or don't!",
    winLine: 'Castle power! That was fun!',
    loseLine: 'You got me! My towers are tumbling!',
    engine: { skill: 0, depth: 2, randomChance: 0.10 },
  },
  {
    id: 'bella',
    name: 'Bella the Bishop',
    elo: 650,
    emoji: '⛪',
    color: '#a472ff',
    tagline: 'Sneaky on the diagonals, sleepy everywhere else.',
    intro: "I'm Bella! I see everything on the diagonals... mostly.",
    winLine: 'The diagonals never lie!',
    loseLine: 'Well played! I should watch the straight lines too...',
    engine: { skill: 1, depth: 3, randomChance: 0.05 },
  },
  {
    id: 'nelly',
    name: 'Nelly the Knight',
    elo: 850,
    emoji: '🐴',
    color: '#2fb877',
    tagline: 'Jumps before she looks. Sometimes it works!',
    intro: 'Neigh! I jump in L-shapes and I LOVE forks. En garde!',
    winLine: 'Galloping victory! 🐴',
    loseLine: 'You out-jumped me! Rematch sometime?',
    engine: { skill: 3, depth: 4, randomChance: 0.02 },
  },
  {
    id: 'quinn',
    name: 'Quinn the Queen',
    elo: 1100,
    emoji: '👑',
    color: '#ff6b5e',
    tagline: 'Powerful, but a little overconfident.',
    intro: "Queen Quinn at your service. I do hope you've been practicing.",
    winLine: 'A royal performance, if I may say so.',
    loseLine: 'Impressive! You play like royalty.',
    engine: { skill: 5, depth: 6, randomChance: 0 },
  },
  {
    id: 'rex',
    name: 'King Rex',
    elo: 1400,
    emoji: '🦖',
    color: '#4c8dff',
    tagline: 'A solid club player with sharp teeth.',
    intro: 'ROAR. I mean — good luck. You will need it.',
    winLine: 'RAWR means checkmate in dinosaur.',
    loseLine: 'You have bested the king of the board. Respect.',
    engine: { skill: 20, elo: 1400, moveTimeMs: 500, randomChance: 0 },
  },
  {
    id: 'gambit',
    name: 'Grandma Gambit',
    elo: 1700,
    emoji: '👵',
    color: '#6344e0',
    tagline: 'Sixty years of tricks up her cardigan sleeve.',
    intro: "Sit down, dear. Grandma's been playing since before computers.",
    winLine: 'Would you like a cookie with that checkmate, sweetie?',
    loseLine: 'Marvelous! You remind me of myself at your age.',
    engine: { skill: 20, elo: 1700, moveTimeMs: 700, randomChance: 0 },
  },
  {
    id: 'maximus',
    name: 'Maximus',
    elo: 2200,
    emoji: '🤖',
    color: '#2b2440',
    tagline: 'The final boss. Beats almost everyone.',
    intro: 'CHALLENGER DETECTED. INITIATING CHESS PROTOCOL.',
    winLine: 'VICTORY LOGGED. HUMANS REMAIN ADORABLE.',
    loseLine: 'ERROR... DEFEAT? RECALIBRATING. WELL PLAYED, HUMAN.',
    engine: { skill: 20, elo: 2400, moveTimeMs: 1200, randomChance: 0 },
  },
];

export const botById = (id: string): BotDef | undefined => BOTS.find((b) => b.id === id);
