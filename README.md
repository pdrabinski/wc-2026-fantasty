# World Cup Fantasy

A private fantasy World Cup MVP built with Next.js, TypeScript, Clerk, and Supabase-ready data models.

## Getting started

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and add Clerk and Supabase keys.
3. Run `npm run dev`.

## Data sources

- `football-data.org` is the live fixture/team feed when `FOOTBALL_DATA_API_KEY` is configured.
- FIFA public pages remain the official tournament reference for schedule and qualified teams.
- If the API key is missing or the feed fails, the app falls back to seeded teams and placeholder fixtures so commissioner workflows stay usable.

## Current scope

- Public landing page with sports-product styling
- Auth-ready app shell with Clerk
- Dashboard, league home, and draft room routes
- Mock seeded data for leagues, teams, players, standings, and picks
- Draft and scoring service logic ready to be connected to Supabase
- Live tournament feed abstraction with seeded fallback
- Initial Supabase schema in [supabase/schema.sql](/Users/pauldrabinski/Projects/world-cup-fantasy/supabase/schema.sql)

## Notes

- The UI currently uses mock data so we can move fast on product flow before wiring persistence.
- The scoring layer already separates `group` and `knockout` phases.
- A future top-8 fantasy playoff bracket is noted in the scoring code but intentionally not built for MVP.
