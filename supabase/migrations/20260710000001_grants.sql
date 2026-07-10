-- ==========================================
-- TABLE PRIVILEGE GRANTS
-- ==========================================
-- RLS policies filter *rows*, but PostgreSQL still requires base table
-- privileges for a role to touch a table at all. Hosted Supabase grants
-- these to `anon`/`authenticated` automatically; a bare local Postgres does
-- not, so create/join fail with "permission denied for table rooms".
-- These grants + the existing RLS policies together give correct access.

GRANT SELECT, INSERT, UPDATE, DELETE ON public.rooms TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.players TO authenticated;

-- Keep future-proof: anything created later in `public` is also granted.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
