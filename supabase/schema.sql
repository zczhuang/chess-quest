-- =============================================================================
-- Chess Quest — initial schema
-- Tables: profiles, players, progress
-- Auth:   Supabase auth.users (RLS-scoped to the owning account)
-- Pattern follows mandarin-quest (profiles → children → progress), renamed for
-- a kids+adults app: an account owns multiple "players" (kid or classic mode).
-- =============================================================================

-- profiles: one row per account, 1:1 with auth.users.
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text,
  created_at timestamptz not null default now()
);

-- players: learner/player profiles owned by an account (a family can have several).
create table public.players (
  id         uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.profiles (id) on delete cascade,
  name       text not null,
  mode       text not null default 'kid' check (mode in ('kid', 'classic')),
  avatar     text,
  created_at timestamptz not null default now()
);

create index players_account_id_idx on public.players (account_id);

-- progress: per-player, per-item state. item_id is a namespaced key:
--   'l:<lessonId>'  lesson record   (completed, best_stars)
--   '__xp__'        total XP        (best_stars holds the number, max-wins)
--   '__streak__'    daily streak    (data jsonb {count, lastDay})
--   '__puzzle__'    puzzle state    (data jsonb {rating, solved, rushBest})
--   '__games__'     vs-AI record    (data jsonb {beaten: [botId], wins, losses, draws})
-- Append/upsert-only; schema changes must be additive.
create table public.progress (
  player_id  uuid not null references public.players (id) on delete cascade,
  item_id    text not null,
  completed  boolean not null default false,
  best_stars int not null default 0,
  data       jsonb,
  updated_at timestamptz not null default now(),
  primary key (player_id, item_id)
);

-- =============================================================================
-- Row Level Security
-- =============================================================================

alter table public.profiles enable row level security;
alter table public.players  enable row level security;
alter table public.progress enable row level security;

create policy "profiles: select own"
  on public.profiles for select
  using (id = auth.uid());

create policy "profiles: update own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles: insert self"
  on public.profiles for insert
  with check (id = auth.uid());

create policy "players: select own"
  on public.players for select
  using (account_id = auth.uid());

create policy "players: insert own"
  on public.players for insert
  with check (account_id = auth.uid());

create policy "players: update own"
  on public.players for update
  using (account_id = auth.uid())
  with check (account_id = auth.uid());

create policy "players: delete own"
  on public.players for delete
  using (account_id = auth.uid());

create policy "progress: select own"
  on public.progress for select
  using (exists (
    select 1 from public.players p
    where p.id = progress.player_id and p.account_id = auth.uid()
  ));

create policy "progress: insert own"
  on public.progress for insert
  with check (exists (
    select 1 from public.players p
    where p.id = progress.player_id and p.account_id = auth.uid()
  ));

create policy "progress: update own"
  on public.progress for update
  using (exists (
    select 1 from public.players p
    where p.id = progress.player_id and p.account_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.players p
    where p.id = progress.player_id and p.account_id = auth.uid()
  ));

create policy "progress: delete own"
  on public.progress for delete
  using (exists (
    select 1 from public.players p
    where p.id = progress.player_id and p.account_id = auth.uid()
  ));

-- Auto-provision a profiles row whenever a new auth.users row is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
