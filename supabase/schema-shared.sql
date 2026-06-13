-- =============================================================================
-- Chess Quest — SHARED-DB schema (runs inside the mandarin-quest Supabase project).
-- Free-tier 2-project limit → Chess Quest reuses that project with `cq_`-prefixed
-- tables so it never collides with mandarin-quest's own `progress`/`children`.
-- The `profiles` table + handle_new_user() trigger ALREADY EXIST there and are
-- shared (both apps only need profiles.id + email). Safe to re-run (idempotent).
-- =============================================================================

-- cq_players: player profiles owned by an account (kid or classic mode).
create table if not exists public.cq_players (
  id         uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.profiles (id) on delete cascade,
  name       text not null,
  mode       text not null default 'kid' check (mode in ('kid', 'classic')),
  avatar     text,
  created_at timestamptz not null default now()
);
create index if not exists cq_players_account_id_idx on public.cq_players (account_id);

-- cq_progress: per-player, per-item state. item_id is a namespaced key:
--   '__xp__' '__streak__' '__puzzle__' '__games__'  and  'l:<lessonId>'
create table if not exists public.cq_progress (
  player_id  uuid not null references public.cq_players (id) on delete cascade,
  item_id    text not null,
  completed  boolean not null default false,
  best_stars int not null default 0,
  data       jsonb,
  updated_at timestamptz not null default now(),
  primary key (player_id, item_id)
);

alter table public.cq_players  enable row level security;
alter table public.cq_progress enable row level security;

-- ---- cq_players: scoped to the owning account --------------------------------
drop policy if exists "cq_players: select own" on public.cq_players;
create policy "cq_players: select own" on public.cq_players for select
  using (account_id = auth.uid());
drop policy if exists "cq_players: insert own" on public.cq_players;
create policy "cq_players: insert own" on public.cq_players for insert
  with check (account_id = auth.uid());
drop policy if exists "cq_players: update own" on public.cq_players;
create policy "cq_players: update own" on public.cq_players for update
  using (account_id = auth.uid()) with check (account_id = auth.uid());
drop policy if exists "cq_players: delete own" on public.cq_players;
create policy "cq_players: delete own" on public.cq_players for delete
  using (account_id = auth.uid());

-- ---- cq_progress: scoped via the player's account ----------------------------
drop policy if exists "cq_progress: select own" on public.cq_progress;
create policy "cq_progress: select own" on public.cq_progress for select
  using (exists (select 1 from public.cq_players p
    where p.id = cq_progress.player_id and p.account_id = auth.uid()));
drop policy if exists "cq_progress: insert own" on public.cq_progress;
create policy "cq_progress: insert own" on public.cq_progress for insert
  with check (exists (select 1 from public.cq_players p
    where p.id = cq_progress.player_id and p.account_id = auth.uid()));
drop policy if exists "cq_progress: update own" on public.cq_progress;
create policy "cq_progress: update own" on public.cq_progress for update
  using (exists (select 1 from public.cq_players p
    where p.id = cq_progress.player_id and p.account_id = auth.uid()))
  with check (exists (select 1 from public.cq_players p
    where p.id = cq_progress.player_id and p.account_id = auth.uid()));
drop policy if exists "cq_progress: delete own" on public.cq_progress;
create policy "cq_progress: delete own" on public.cq_progress for delete
  using (exists (select 1 from public.cq_players p
    where p.id = cq_progress.player_id and p.account_id = auth.uid()));
