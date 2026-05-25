create table if not exists knockout_picks (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references leagues(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  match_id uuid not null references matches(id) on delete cascade,
  pick_team_id text not null references teams(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (league_id, user_id, match_id)
);

create index if not exists knockout_picks_league_user_idx
on knockout_picks (league_id, user_id);
