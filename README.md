# World Cup Fantasy

A private fantasy World Cup MVP built with Next.js, TypeScript, Clerk, and Supabase-ready data models.

## Getting started

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and add Clerk and Supabase keys.
3. Run [supabase/schema.sql](/Users/pauldrabinski/Projects/world-cup-fantasy/supabase/schema.sql) once for a fresh Supabase project.
4. Apply anything in [/Users/pauldrabinski/Projects/world-cup-fantasy/supabase/migrations](/Users/pauldrabinski/Projects/world-cup-fantasy/supabase/migrations) for incremental updates.
5. Run `npm run dev`.

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
- Bootstrap schema in [supabase/schema.sql](/Users/pauldrabinski/Projects/world-cup-fantasy/supabase/schema.sql)
- Incremental database changes in [/Users/pauldrabinski/Projects/world-cup-fantasy/supabase/migrations](/Users/pauldrabinski/Projects/world-cup-fantasy/supabase/migrations)
- User-facing MCP endpoint at `/api/mcp`

## MCP

The app now exposes a Streamable HTTP MCP endpoint at `/api/mcp`.

Auth:
- Accepts Clerk `session_token` requests
- Accepts Clerk `oauth_token` requests
- Uses Clerk server-side verification in the route handler before any tool runs

Current MCP tools:
- `whoami`
- `list_my_leagues`
- `create_league`
- `join_league`
- `get_league_overview`
- `get_standings`
- `get_matches`
- `get_bracket`
- `get_draft_status`
- `draft_team`
- `submit_bracket_pick`
- `start_draft`
- `sync_fixtures`
- `sync_results`
- `recalculate_table`

## Notes

- Use `NEXT_PUBLIC_SUPABASE_URL` with `NEXT_PUBLIC_SUPABASE_ANON_KEY` for public/browser access.
- Use `SUPABASE_SECRET_KEY` for server-side writes and admin access.
- `schema.sql` is now repeat-safe for the enum setup, but the cleaner long-term path is `schema.sql` once plus targeted migration files after that.
- The scoring layer already separates `group` and `knockout` phases.
- The MCP endpoint currently verifies Clerk tokens directly. If you want fully automated third-party MCP OAuth discovery, the next step is adding the MCP auth metadata/discovery layer around Clerk as the IdP.
