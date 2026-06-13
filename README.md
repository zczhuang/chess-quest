# ♟️ Chess Quest

A joyful chess web app for **kids and adults alike** — bite-size lessons (Duolingo-style),
thousands of real-game puzzles, and friendly AI opponents from total beginner to grandmaster.

Built with Next.js 14 (App Router) · Supabase (auth + cloud progress) · Stockfish 17 WASM ·
Vertex AI Gemini (AI coach) · Tailwind. Deploys on Vercel. Works fully **offline/guest** —
sign in with Google only to sync progress across devices.

## The three pillars

| Pillar | What it is |
| --- | --- |
| 📚 **Learn** | A winding path of 17 lessons across 5 units (board → pieces → capture/check → checkmate & special moves → first tactics). Each lesson is 4–9 bite-size, auto-checked board exercises. Earn XP, stars, and a daily streak. |
| 🧩 **Puzzles** | An adaptive rated **Train** mode (your rating climbs as you solve), a timed **Puzzle Rush** (3 min, 3 strikes), and 12 **theme** packs (forks, pins, mate-in-1, back-rank…). Sourced from the [Lichess open puzzle database](https://database.lichess.org/) (CC0). |
| ⚔️ **Play** | Eight personality bots from **Pip the Pawn** (~250, just learned the rules) to **Maximus** (~2200, the final boss). Hints, takebacks, and a kid-friendly post-game review from the Gemini AI coach. |

### Kid mode vs Classic mode

One codebase, two skins. A player profile is **kid** (playful purple board, big targets,
extra celebration) or **classic** (calm woody board). COPPA-friendly: no chat, no social
features, parent-managed profiles, no ads.

## Architecture

- **Board** — `components/chess/Board.tsx`: a dependency-free board (tap + drag, legal-move
  dots, last-move/check highlights, in-board promotion picker, lesson decorations). Themed
  entirely through `--cq-board-*` CSS tokens, so kid/classic swap with one `data-theme`.
- **Engine** — `lib/chess/engine.ts`: a UCI client over the single-threaded Stockfish 17.1
  "lite" WASM build in `public/stockfish/` (no COOP/COEP headers needed). `lib/chess/bots.ts`
  defines the difficulty ladder; `lib/chess/playEngine.ts` weakens it (skill level + Elo limit
  + short search + random-blunder injection) so the easy bots play like real beginners.
- **Rules** — `chess.js` for real positions (`lib/chess/game.ts`); a tiny single-piece move
  generator (`lib/learn/pieceMoves.ts`) for lesson exercises that use lone pieces on empty
  boards (which chess.js rejects as illegal).
- **Curriculum** — `lib/learn/curriculum.ts`. Every FEN + solution is validated by
  `npm run verify:lessons` (chess.js): legal positions, legal solutions, real checkmates.
- **Progress** — local-first (`lib/progress/store.ts`, `localStorage`) with a best-effort,
  **max-wins** cloud mirror to Supabase (`lib/progress/sync.ts`). Guest play needs no account;
  signing in merges and syncs.
- **AI coach** — `app/api/coach/route.ts` → `lib/gemini.ts` (Vertex AI, Workload Identity
  Federation on Vercel, ambient ADC locally). Hard-scoped to chess, kid-safe prompting.

## Local development

```bash
npm install
npm run dev          # http://localhost:3000 — runs in guest mode with no env set
```

The app runs with **zero configuration** (guest/local progress). To enable Google sign-in +
cloud sync and the AI coach, fill `.env.local` (see `.env.example`).

### Rebuilding the puzzle packs

```bash
curl -O https://database.lichess.org/lichess_db_puzzle.csv.zst
zstd -d lichess_db_puzzle.csv.zst -o /tmp/lichess_db_puzzle.csv
npm run puzzles      # filters by quality, validates with chess.js, writes public/puzzles/
```

## Tests of record

```bash
npm run build           # type-check + lint + compile (keep green)
npm run verify:lessons  # validates every curriculum FEN/solution
```

## Credits

- Piece art: [cburnett](https://github.com/lichess-org/lila/tree/master/public/piece/cburnett)
  (CC BY-SA 3.0) via Lichess.
- Puzzles: [Lichess open database](https://database.lichess.org/) (CC0).
- Engine: [Stockfish](https://stockfishchess.org/) 17.1 ([nmrugg/stockfish.js](https://github.com/nmrugg/stockfish.js), GPLv3).
