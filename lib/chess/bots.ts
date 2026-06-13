// The bot ladder. Difficulty is produced by combining four levers:
//   1. randomChance — probability of playing a random legal move (the great equalizer:
//      Stockfish's Skill Level floor is still far too strong for a 5-year-old).
//   2. Skill Level (0-20) — Stockfish's built-in weakening.
//   3. depth / moveTimeMs — shallow search plays "human-shallow" moves.
//   4. elo — UCI_LimitStrength (only meaningful ≥1320, used for the upper bots).

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
    engine: { skill: 0, depth: 1, randomChance: 0.65 },
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
    engine: { skill: 0, depth: 1, randomChance: 0.45 },
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
    engine: { skill: 1, depth: 2, randomChance: 0.25 },
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
    engine: { skill: 3, depth: 3, randomChance: 0.12 },
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
    engine: { skill: 6, depth: 5, randomChance: 0.05 },
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
    engine: { skill: 10, moveTimeMs: 400, randomChance: 0 },
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
    engine: { skill: 20, elo: 1700, moveTimeMs: 600, randomChance: 0 },
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
    engine: { skill: 20, moveTimeMs: 900, randomChance: 0 },
  },
];

export const botById = (id: string): BotDef | undefined => BOTS.find((b) => b.id === id);
