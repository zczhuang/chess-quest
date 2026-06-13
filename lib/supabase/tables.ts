// Chess Quest shares a Supabase project with mandarin-quest (free-tier 2-project
// limit), so its tables are prefixed `cq_` to avoid colliding with that app's
// `progress`/`children` tables. The `profiles` table (1:1 with auth.users) and
// its handle_new_user trigger are SHARED — both apps just need id + email.
export const PLAYERS_TABLE = 'cq_players';
export const PROGRESS_TABLE = 'cq_progress';
