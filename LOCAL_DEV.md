# Local Supabase (test backend)

The hosted Supabase project this app used to point at no longer exists, so
local dev/testing runs against a local Supabase stack (Postgres + Auth +
Realtime + Studio, all in Docker via the Supabase CLI).

## Requirements
- Docker Desktop running

## Start / stop
```bash
npx supabase start     # boots the stack, applies migrations in supabase/migrations/
npx supabase stop      # shuts it down (data persists between start/stop)
npx supabase status    # show URLs + keys
```

- API:    http://127.0.0.1:54321
- Studio: http://127.0.0.1:54323  (browse tables, run SQL)
- Mailpit: http://127.0.0.1:54324 (captured emails)

`.env` is already pointed at the local API URL + the CLI's fixed local anon key.
The previous hosted config is saved in `.env.hosted.bak`.

## Schema
`supabase/migrations/` is the source of truth for local runs:
- `20260710000000_init.sql` — tables, indexes, RLS, realtime (copied from `supabase-schema.sql`)
- `20260710000001_grants.sql` — table privilege GRANTs to `authenticated`
  (RLS alone isn't enough; Postgres needs base grants that hosted Supabase adds automatically)

After editing a migration or adding a new one:
```bash
npx supabase migration up --local   # apply pending migrations
# or: npx supabase db reset          # wipe + replay all migrations from scratch
```

Anonymous sign-ins are enabled in `supabase/config.toml`
(`enable_anonymous_sign_ins = true`) — required by the app's auth flow.

## Tests
```bash
npm run test:e2e         # Playwright: real 3-player multiplayer flow + UI screenshots
npm run test:e2e:headed  # watch it in a browser
```
The suite health-checks the backend first and fails fast with a clear message
if Supabase isn't running.

## Switching back to a hosted project
Restore `.env.hosted.bak` → `.env` (or fill in a new project's URL + anon key),
and run `supabase-schema.sql` **plus** the grants from `20260710000001_grants.sql`
in the project's SQL editor.
