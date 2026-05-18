# Build MVP: Fantasy World Cup Hybrid Website

Build a fantasy World Cup website for a private friend group.

## Tech Stack

Use:

- Next.js app router
- TypeScript
- Vercel
- Clerk for auth
- Supabase Postgres for database
- Supabase Realtime where useful
- Plain CSS or Tailwind, whichever is already configured

## Product Concept

This is a casual fantasy World Cup game.

Each league member drafts:

- 5 national teams
- 6 players

There are two winners:

1. **Group Stage Champion**
2. **Tournament Champion**

The game should feel like a clean sports product: ESPN / global soccer / World Cup energy.

Think:

- bold standings
- matchday cards
- flags
- tables
- dark navy / green / white / gold accents
- editorial sports dashboard feel
- not cartoonish
- not overly gamified

---

# Core MVP Features

## 1. Authentication

Use Clerk.

Users should be able to:

- sign up
- log in
- view their leagues
- create a league
- join a league via invite link

---

## 2. League Creation

A user can create a league with:

- league name
- max members
- draft type: snake draft
- roster settings:
  - 5 teams
  - 6 players

After creation, generate an invite link.

---

## 3. League Home Page

League page should show:

- league name
- members
- draft status
- current standings
- user rosters
- scoring rules
- invite link

States:

- pre-draft
- drafting
- group stage active
- knockout stage active
- completed

---

## 4. Draft Room

Build a simple snake draft room.

Draft order:

- randomize order when commissioner starts draft
- snake order reverses every round

Roster requirements:

- each manager drafts 5 teams
- each manager drafts 6 players
- total: 11 rounds

Draft room needs:

- current pick indicator
- draft order
- available teams
- available players
- drafted rosters
- pick history
- commissioner button to start draft

For MVP, timer is optional. Do not build chat.

---

# Draft Rules

## Teams

Teams should be grouped into tiers.

Each manager drafts:

- 1 Tier 1 team
- 1 Tier 2 team
- 3 Tier 3+ teams

This gives everyone a balanced portfolio.

Seed the database with placeholder World Cup teams and tiers.

Use sample data for now.

Example tiers:

### Tier 1
France, Brazil, Argentina, England, Spain, Germany

### Tier 2
Portugal, Netherlands, Uruguay, Belgium, Croatia, Italy, Colombia, Morocco

### Tier 3
USA, Mexico, Japan, Senegal, Switzerland, Denmark, South Korea, Australia, Canada, Ghana, etc.

Exact teams can be updated later.

## Players

Players are drafted independently from teams.

A manager can draft any available player, even if they do not own that player’s national team.

Seed with placeholder star players for now.

---

# Scoring System

Build the scoring system in a configurable way, but seed these defaults.

## Team Scoring

### Group Stage

- Win: +3
- Draw: +1
- Clean sheet: +1
- Goal differential bonus: capped at +2 per match

### Knockout Stage

- Advance from Round of 16: +5
- Advance from Quarterfinal: +8
- Advance from Semifinal: +12
- Win Final / Champion: +20

## Player Scoring

- Goal: +5
- Assist: +3
- Clean sheet for defender/goalkeeper: +4
- Goalkeeper save: +1
- Penalty save: +8
- Yellow card: -1
- Red card: -3
- Own goal: -5

---

# Competitions

## Group Stage Champion

During the group stage:

- all team and player points count toward group stage standings
- at the end of the group stage, freeze the group stage leaderboard
- display the Group Stage Champion

## Tournament Champion

After the group stage:

- tournament standings should reset to 0
- knockout stage points determine the Tournament Champion

For MVP, do not build a head-to-head bracket yet. Use cumulative knockout scoring.

Add a note in the code/comments that future versions may support a top-8 fantasy playoff bracket.

---

# Pages Needed

## Public Home Page

Should explain:

- draft 5 teams and 6 players
- compete for group stage winner
- reset and compete for tournament winner
- built for private friend leagues

CTA:

- create league
- sign in

## Dashboard

Shows user’s leagues.

## League Page

Main hub for one league.

Tabs or sections:

- Standings
- Rosters
- Draft
- Matches
- Rules

## Draft Page

Dedicated draft room.

## Roster Page

View each manager’s teams and players.

## Admin / Commissioner Controls

Commissioner can:

- start draft
- manually add match results
- manually add player stats
- recalculate scores
- lock group stage
- start knockout stage
- complete tournament

Manual stat entry is acceptable for MVP.

---

# Database Model

Create Supabase tables for:

## users
Map Clerk user IDs to app users.

Fields:
- id
- clerk_user_id
- display_name
- email
- created_at

## leagues
- id
- name
- commissioner_user_id
- invite_code
- status
- created_at

## league_members
- id
- league_id
- user_id
- draft_position
- created_at

## teams
- id
- name
- country_code
- tier
- group_name
- flag_url optional

## players
- id
- name
- team_id
- position
- active

## draft_picks
- id
- league_id
- round
- pick_number
- user_id
- pick_type: team/player
- team_id nullable
- player_id nullable
- created_at

## rosters
- id
- league_id
- user_id
- team_id nullable
- player_id nullable
- roster_type: team/player

## matches
- id
- home_team_id
- away_team_id
- stage: group/r16/qf/sf/final
- kickoff_at
- home_score
- away_score
- status

## team_match_stats
- id
- match_id
- team_id
- result
- goals_for
- goals_against
- clean_sheet
- advanced
- fantasy_points

## player_match_stats
- id
- match_id
- player_id
- goals
- assists
- clean_sheet
- saves
- penalty_saves
- yellow_cards
- red_cards
- own_goals
- fantasy_points

## league_scores
- id
- league_id
- user_id
- phase: group/knockout
- team_points
- player_points
- total_points
- updated_at

---

# Important Backend Logic

Create functions/services for:

## Draft Logic

- calculate current pick
- validate pick
- enforce roster limits
- enforce team tier limits
- prevent duplicate picks in a league
- write draft pick
- write roster item

## Scoring Logic

- calculate team fantasy points
- calculate player fantasy points
- aggregate user score from roster
- support separate group and knockout phase scores
- freeze group stage standings

## League Status Logic

Statuses:

- pre_draft
- drafting
- group_stage
- knockout_stage
- completed

---

# Styling Direction

Style should feel like:

- ESPN scoreboard
- global football tournament
- modern sports dashboard

Use:

- dark navy backgrounds
- white cards
- green pitch accents
- gold trophy accents
- red alert accents sparingly
- bold condensed headings if available
- clear standings tables
- flag badges
- pill labels for tiers and positions

Avoid:

- cartoon mascots
- overly playful gradients
- cluttered fantasy-football UI
- complex analytics

Core components:

- standings table
- match card
- roster card
- draft pick card
- league status badge
- score summary card
- team/player search list

---

# MVP Constraints

Do not build:

- ownership heatmap
- trades
- waivers
- chat
- notifications
- projections
- mobile app
- paid leagues
- public league discovery

Keep it focused on:

- creating a league
- drafting
- entering results/stats
- scoring
- standings
- crowning two winners

---

# Success Criteria

The MVP is successful when:

1. A user can create a league.
2. Friends can join via invite link.
3. Commissioner can start a snake draft.
4. Users can draft 5 teams and 6 players.
5. Rosters are saved.
6. Commissioner can manually enter match and player stats.
7. Scores update correctly.
8. Group Stage Champion can be locked.
9. Knockout scoring resets and produces a Tournament Champion.
10. The site feels like a polished global sports product.