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
  ('team-spain', 'Spain', 'ESP', 'Pot 1', 'TBD', null),
  ('team-argentina', 'Argentina', 'ARG', 'Pot 1', 'TBD', null),
  ('team-france', 'France', 'FRA', 'Pot 1', 'TBD', null),
  ('team-england', 'England', 'ENG', 'Pot 1', 'TBD', null),
  ('team-brazil', 'Brazil', 'BRA', 'Pot 1', 'TBD', null),
  ('team-portugal', 'Portugal', 'POR', 'Pot 1', 'TBD', null),
  ('team-netherlands', 'Netherlands', 'NED', 'Pot 1', 'TBD', null),
  ('team-belgium', 'Belgium', 'BEL', 'Pot 1', 'TBD', null),
  ('team-germany', 'Germany', 'GER', 'Pot 1', 'TBD', null),
  ('team-croatia', 'Croatia', 'CRO', 'Pot 1', 'TBD', null),
  ('team-mexico', 'Mexico', 'MEX', 'Pot 1', 'TBD', null),
  ('team-morocco', 'Morocco', 'MAR', 'Pot 2', 'TBD', null),
  ('team-colombia', 'Colombia', 'COL', 'Pot 2', 'TBD', null),
  ('team-uruguay', 'Uruguay', 'URU', 'Pot 2', 'TBD', null),
  ('team-switzerland', 'Switzerland', 'SUI', 'Pot 2', 'TBD', null),
  ('team-japan', 'Japan', 'JPN', 'Pot 2', 'TBD', null),
  ('team-senegal', 'Senegal', 'SEN', 'Pot 2', 'TBD', null),
  ('team-iran', 'Iran', 'IRN', 'Pot 2', 'TBD', null),
  ('team-south-korea', 'South Korea', 'KOR', 'Pot 2', 'TBD', null),
  ('team-ecuador', 'Ecuador', 'ECU', 'Pot 2', 'TBD', null),
  ('team-austria', 'Austria', 'AUT', 'Pot 2', 'TBD', null),
  ('team-australia', 'Australia', 'AUS', 'Pot 2', 'TBD', null),
  ('team-usa', 'United States', 'USA', 'Pot 2', 'TBD', null),
  ('team-canada', 'Canada', 'CAN', 'Pot 2', 'TBD', null),
  ('team-norway', 'Norway', 'NOR', 'Pot 3', 'TBD', null),
  ('team-panama', 'Panama', 'PAN', 'Pot 3', 'TBD', null),
  ('team-egypt', 'Egypt', 'EGY', 'Pot 3', 'TBD', null),
  ('team-algeria', 'Algeria', 'ALG', 'Pot 3', 'TBD', null),
  ('team-scotland', 'Scotland', 'SCO', 'Pot 3', 'TBD', null),
  ('team-paraguay', 'Paraguay', 'PAR', 'Pot 3', 'TBD', null),
  ('team-tunisia', 'Tunisia', 'TUN', 'Pot 3', 'TBD', null),
  ('team-ivory-coast', 'Ivory Coast', 'CIV', 'Pot 3', 'TBD', null),
  ('team-uzbekistan', 'Uzbekistan', 'UZB', 'Pot 3', 'TBD', null),
  ('team-qatar', 'Qatar', 'QAT', 'Pot 3', 'TBD', null),
  ('team-saudi-arabia', 'Saudi Arabia', 'KSA', 'Pot 3', 'TBD', null),
  ('team-south-africa', 'South Africa', 'RSA', 'Pot 3', 'TBD', null)
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
