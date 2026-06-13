# Chess Quest — project conventions for Claude

A chess web app for kids AND adults (Next.js 14 App Router + Supabase + Stockfish WASM +
Vertex AI Gemini, on Vercel). Three pillars: Learn (Duolingo-style), Puzzles, Play vs AI.
Two skins from one codebase via `data-theme`: `kid` (playful) and `classic` (woody).

## ⛔ Rule #1: never break a player's progress

- **localStorage keys are a public contract.** Never rename/re-shape:
  `cq.v1:<playerId>` (the per-player store), `cq.players`, `cq.activePlayer`.
  New state = additive field with a migration that reads the old shape first.
- **The `progress` table is upsert-only.** PK `(player_id, item_id)`; the synthetic item
  ids (`__xp__`, `__streak__`, `__puzzle__`, `__games__`, `l:<lessonId>`) and column
  semantics must stay stable. Schema changes are additive (`add column if not exists`).
- **Sync is max-wins** (`lib/progress/sync.ts`) — never replace a player's state wholesale
  in either direction. The one latest-wins field is `puzzles.rating` (arbitrated by `ratingAt`).
- **Lesson ids in `lib/learn/curriculum.ts` are FOREVER** — they are progress keys (`l:<id>`).

## Tests of record

- `npm run build` — type-check + lint + compile. Keep it green.
- `npm run verify:lessons` — validates every curriculum FEN, every solution move, and every
  `checkmate: true` claim with chess.js. Run after ANY curriculum edit.

## Architecture pointers

- Board: `components/chess/Board.tsx` reads ONLY `--cq-board-*` tokens (see `app/globals.css`).
  Lessons/puzzles/games all reuse it. Lone-piece exercises use `lib/learn/pieceMoves.ts`
  (chess.js rejects king-less FENs); real positions use `chess.js` via `lib/chess/game.ts`.
- Engine: single-threaded Stockfish lite WASM in `public/stockfish/` (`stockfish.js` +
  `stockfish.wasm` — the wasm MUST be named `stockfish.wasm`, the loader derives it from the
  script name). No COOP/COEP headers required. Bot difficulty: `lib/chess/bots.ts` +
  `lib/chess/playEngine.ts` (skill/Elo/movetime + random-blunder injection). Warm it up on
  mount (`getEngine().warmup()`) — first call compiles 7MB of WASM (~5s).
- Dynamic routes use **Next 14 sync `params`** (`{ params }: { params: { id: string } }`),
  NOT the Next 15 `use(params)` Promise form — that throws at runtime here.
- AI coach: `lib/gemini.ts` (Vertex, WIF on Vercel / ADC locally) — same pattern as
  mandarin-quest. `app/api/coach/route.ts` is hard-scoped to chess + kid-safe.
- Puzzle packs live in `public/puzzles/` (served statically, fetched on demand). Regenerate
  with `npm run puzzles` from the Lichess CC0 DB.

## Product guardrails

- Kids' app: no ads, no dark patterns, no chat/social, parent-managed profiles (COPPA).
- **Private app**: the whole thing is OAuth-walled. `middleware.ts` + `lib/auth.ts`
  require a signed-in user whose email is in `ALLOWED_EMAILS` on every route except
  the landing gate (`/`) and `/auth/*` (API → 401, pages → redirect to `/`). Empty
  allowlist = any signed-in account. Locally still runs with no Supabase env (no wall).
- Keep the AI coach chess-only and child-safe (`gemini-3.1-flash-lite`); never pass
  child free-text to the model.

## Git / deploy

- `main` auto-deploys to production on Vercel. Stage explicit paths; never `git add -A`.
- Secrets live in Vercel env, never committed. `.env.local` is gitignored.
