create extension if not exists pgcrypto;

create type league_status as enum (
  'pre_draft',
  'drafting',
  'group_stage',
  'knockout_stage',
  'completed'
);

create type draft_pick_type as enum ('team', 'player');
create type roster_type as enum ('team', 'player');
create type match_stage as enum ('group', 'r32', 'r16', 'qf', 'sf', 'final');
create type match_status as enum ('scheduled', 'completed');
create type score_phase as enum ('group', 'knockout');

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null unique,
  display_name text not null,
  email text not null,
  created_at timestamptz not null default now()
);

create table if not exists leagues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  commissioner_user_id uuid not null references users(id),
  invite_code text not null unique,
  status league_status not null default 'pre_draft',
  max_members integer not null default 8,
  created_at timestamptz not null default now()
);

create table if not exists league_members (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references leagues(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  draft_position integer,
  created_at timestamptz not null default now(),
  unique (league_id, user_id)
);

create table if not exists teams (
  id text primary key,
  name text not null unique,
  country_code text not null,
  tier text not null,
  group_name text not null,
  flag_url text
);

create table if not exists players (
  id text primary key,
  name text not null,
  team_id text references teams(id),
  position text not null,
  active boolean not null default true
);

create table if not exists draft_picks (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references leagues(id) on delete cascade,
  round integer not null,
  pick_number integer not null,
  user_id uuid not null references users(id) on delete cascade,
  pick_type draft_pick_type not null,
  team_id text references teams(id),
  player_id text references players(id),
  created_at timestamptz not null default now()
);

create table if not exists rosters (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references leagues(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  team_id text references teams(id),
  player_id text references players(id),
  roster_type roster_type not null
);

create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  home_team_id text not null references teams(id),
  away_team_id text not null references teams(id),
  stage match_stage not null,
  kickoff_at timestamptz not null,
  home_score integer,
  away_score integer,
  status match_status not null default 'scheduled'
);

create table if not exists team_match_stats (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id) on delete cascade,
  team_id text not null references teams(id),
  result text not null,
  goals_for integer not null default 0,
  goals_against integer not null default 0,
  clean_sheet boolean not null default false,
  advanced boolean not null default false,
  fantasy_points integer not null default 0
);

create table if not exists player_match_stats (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id) on delete cascade,
  player_id text not null references players(id),
  goals integer not null default 0,
  assists integer not null default 0,
  clean_sheet boolean not null default false,
  saves integer not null default 0,
  penalty_saves integer not null default 0,
  yellow_cards integer not null default 0,
  red_cards integer not null default 0,
  own_goals integer not null default 0,
  fantasy_points integer not null default 0
);

create table if not exists league_scores (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references leagues(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  phase score_phase not null,
  team_points integer not null default 0,
  player_points integer not null default 0,
  total_points integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (league_id, user_id, phase)
);

create index if not exists league_members_league_idx on league_members (league_id);
create index if not exists draft_picks_league_idx on draft_picks (league_id, pick_number);
create index if not exists rosters_league_user_idx on rosters (league_id, user_id);
create index if not exists league_scores_league_phase_idx on league_scores (league_id, phase);

insert into teams (id, name, country_code, tier, group_name, flag_url)
values
  ('team-france', 'France', 'FRA', 'Tier 1', 'A', null),
  ('team-brazil', 'Brazil', 'BRA', 'Tier 1', 'B', null),
  ('team-argentina', 'Argentina', 'ARG', 'Tier 1', 'C', null),
  ('team-england', 'England', 'ENG', 'Tier 1', 'D', null),
  ('team-spain', 'Spain', 'ESP', 'Tier 1', 'E', null),
  ('team-germany', 'Germany', 'GER', 'Tier 1', 'F', null),
  ('team-portugal', 'Portugal', 'POR', 'Tier 2', 'G', null),
  ('team-netherlands', 'Netherlands', 'NED', 'Tier 2', 'H', null),
  ('team-morocco', 'Morocco', 'MAR', 'Tier 2', 'E', null),
  ('team-usa', 'United States', 'USA', 'Tier 3', 'D', null),
  ('team-japan', 'Japan', 'JPN', 'Tier 3', 'F', null),
  ('team-senegal', 'Senegal', 'SEN', 'Tier 3', 'A', null),
  ('team-mexico', 'Mexico', 'MEX', 'Tier 3', 'B', null),
  ('team-switzerland', 'Switzerland', 'SUI', 'Tier 3', 'G', null)
on conflict (id) do update set
  name = excluded.name,
  country_code = excluded.country_code,
  tier = excluded.tier,
  group_name = excluded.group_name,
  flag_url = excluded.flag_url;

insert into players (id, name, team_id, position, active)
values
  ('player-mbappe', 'Kylian Mbappe', 'team-france', 'FWD', true),
  ('player-vinicius', 'Vinicius Junior', 'team-brazil', 'FWD', true),
  ('player-messi', 'Lionel Messi', 'team-argentina', 'FWD', true),
  ('player-bellingham', 'Jude Bellingham', 'team-england', 'MID', true),
  ('player-yamal', 'Lamine Yamal', 'team-spain', 'FWD', true),
  ('player-musiala', 'Jamal Musiala', 'team-germany', 'MID', true),
  ('player-hakimi', 'Achraf Hakimi', 'team-morocco', 'DEF', true),
  ('player-pulisic', 'Christian Pulisic', 'team-usa', 'MID', true),
  ('player-mitoma', 'Kaoru Mitoma', 'team-japan', 'MID', true),
  ('player-ochoa', 'Guillermo Ochoa', 'team-mexico', 'GK', true)
on conflict (id) do update set
  name = excluded.name,
  team_id = excluded.team_id,
  position = excluded.position,
  active = excluded.active;
