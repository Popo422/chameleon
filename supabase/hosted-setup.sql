-- ==============================================================
-- CHAMELEON — COMPLETE HOSTED SUPABASE SETUP
-- Paste this whole file into Supabase Dashboard -> SQL Editor -> Run.
-- It bundles all migrations in order (schema, RLS, grants, RPCs).
-- Safe to re-run (uses IF NOT EXISTS / CREATE OR REPLACE).
-- ==============================================================


-- ============================================================
-- 20260710000000_init.sql
-- ============================================================
-- ==========================================
-- CHAMELEON GAME - SUPABASE DATABASE SCHEMA
-- ==========================================
-- Run this SQL in your Supabase SQL Editor to set up the database
-- Dashboard: https://supabase.com/dashboard/project/_/sql

-- Enable UUID extension (usually enabled by default)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- TABLES
-- ==========================================

-- Game rooms/sessions
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(6) UNIQUE NOT NULL,          -- 6-char room code (e.g., "ABC123")
  host_id UUID,                              -- Player who created the room
  status VARCHAR(20) DEFAULT 'lobby',        -- lobby | playing | voting | results
  topic_category VARCHAR(100),
  secret_word VARCHAR(100),
  dice_result JSONB,                         -- {row: 1, col: 2}
  chameleon_id UUID,                         -- Player who is the chameleon
  is_filipino BOOLEAN DEFAULT false,
  vote_end_time TIMESTAMPTZ,                 -- When voting timer ends
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Players in rooms
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  auth_user_id UUID NOT NULL,                -- Links to Supabase auth.users
  name VARCHAR(50) NOT NULL,
  is_host BOOLEAN DEFAULT false,
  has_revealed BOOLEAN DEFAULT false,
  vote_target_id UUID,                       -- Who this player voted for
  is_connected BOOLEAN DEFAULT true,
  joined_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: one player per auth user per room
  UNIQUE(room_id, auth_user_id)
);

-- ==========================================
-- INDEXES
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_rooms_code ON rooms(code);
CREATE INDEX IF NOT EXISTS idx_players_room ON players(room_id);
CREATE INDEX IF NOT EXISTS idx_players_auth_user ON players(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Enable RLS on tables
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Rooms policies
-- Anyone authenticated can read rooms (to check if room exists and join)
CREATE POLICY "Rooms are viewable by authenticated users"
  ON rooms FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can create a room
CREATE POLICY "Authenticated users can create rooms"
  ON rooms FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only room host can update rooms (enforced at database level)
-- Also allows update when host_id is NULL (initial room setup)
CREATE POLICY "Host can update rooms"
  ON rooms FOR UPDATE
  TO authenticated
  USING (
    host_id IS NULL
    OR host_id IN (
      SELECT id FROM players WHERE auth_user_id = auth.uid()
    )
  );

-- Authenticated users can delete rooms (cleanup)
CREATE POLICY "Authenticated users can delete rooms"
  ON rooms FOR DELETE
  TO authenticated
  USING (true);

-- Players policies
-- Anyone authenticated can read players in a room
CREATE POLICY "Players are viewable by authenticated users"
  ON players FOR SELECT
  TO authenticated
  USING (true);

-- Users can only create player records for themselves
CREATE POLICY "Users can create their own player record"
  ON players FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = auth_user_id);

-- Users can only update their own player record
CREATE POLICY "Users can update their own player record"
  ON players FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_user_id);

-- Users can delete their own player record, OR host can delete any player in their room
CREATE POLICY "Users can delete players"
  ON players FOR DELETE
  TO authenticated
  USING (
    auth.uid() = auth_user_id
    OR
    EXISTS (
      SELECT 1 FROM players p
      WHERE p.room_id = players.room_id
      AND p.auth_user_id = auth.uid()
      AND p.is_host = true
    )
  );

-- ==========================================
-- REALTIME
-- ==========================================

-- Enable realtime for rooms + players (idempotent — skips if already added)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'rooms'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'players'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE players;
  END IF;
END $$;

-- Enable REPLICA IDENTITY FULL for players so DELETE events include old row data
ALTER TABLE players REPLICA IDENTITY FULL;

-- ==========================================
-- CLEANUP FUNCTION (Optional)
-- ==========================================

-- Function to delete old rooms (older than 24 hours)
CREATE OR REPLACE FUNCTION cleanup_old_rooms()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM rooms
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$;

-- You can schedule this function to run periodically using pg_cron
-- or call it manually when needed

-- ==========================================
-- MIGRATION FOR EXISTING DATABASES
-- ==========================================
-- If you already have the old schema, run this to add the auth_user_id column:
--
-- ALTER TABLE players ADD COLUMN IF NOT EXISTS auth_user_id UUID;
-- CREATE INDEX IF NOT EXISTS idx_players_auth_user ON players(auth_user_id);
--
-- Note: You'll need to drop and recreate RLS policies if updating an existing database

-- ==========================================
-- ANONYMOUS AUTH SETUP
-- ==========================================
-- Go to Supabase Dashboard > Authentication > Providers
-- Enable "Anonymous Sign-ins"

-- ==========================================
-- DONE!
-- ==========================================
-- After running this SQL:
-- 1. Go to Project Settings > API
-- 2. Copy your Project URL and anon/public key
-- 3. Enable Anonymous Auth in Authentication > Providers
-- 4. Create a .env file in your project with:
--    VITE_SUPABASE_URL=your-project-url
--    VITE_SUPABASE_ANON_KEY=your-anon-key
-- 5. Restart your dev server


-- ============================================================
-- 20260710000001_grants.sql
-- ============================================================
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


-- ============================================================
-- 20260710000002_voting_endgame.sql
-- ============================================================
-- ==========================================
-- VOTING END-GAME RESILIENCE
-- ==========================================
-- Previously only the host could move a room out of the voting phase. If the
-- host disconnected or navigated away while a vote was in progress, the room
-- got stuck in 'voting' forever with no recovery. Allow ANY player in the room
-- to transition a room from 'voting' -> 'results' once voting is underway, so a
-- non-host fallback can end the round. All other room updates remain host-only.

DROP POLICY IF EXISTS "Players can end voting in their room" ON rooms;
CREATE POLICY "Players can end voting in their room"
  ON rooms FOR UPDATE
  TO authenticated
  USING (
    status = 'voting'
    AND EXISTS (
      SELECT 1 FROM players p
      WHERE p.room_id = rooms.id
      AND p.auth_user_id = auth.uid()
    )
  );


-- ============================================================
-- 20260710000003_leave_room_rpc.sql
-- ============================================================
-- ==========================================
-- ATOMIC LEAVE-ROOM / HOST HANDOFF (SECURITY DEFINER)
-- ==========================================
-- The players UPDATE RLS policy is `auth.uid() = auth_user_id`, so a departing
-- host physically CANNOT promote another player's row from the client — the
-- write is rejected and the room is left with no functional host. Likewise a
-- mid-game departure of the chameleon/host needs to reset the room, and two
-- simultaneous leaves must not both reassign the host.
--
-- This does the whole leave in one transactional, SECURITY DEFINER function so
-- it runs with owner privileges (bypassing RLS) and atomically:
--   1. deletes the leaving player
--   2. if they were the chameleon or host during an active round, resets the
--      room to lobby (so the round can't reference a deleted chameleon)
--   3. if they were the host, promotes the oldest remaining player (or deletes
--      the room if empty)
-- The caller may only remove THEIR OWN player row (enforced by auth.uid()).

CREATE OR REPLACE FUNCTION leave_room(p_player_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_player   players%ROWTYPE;
  v_room     rooms%ROWTYPE;
  v_new_host UUID;
BEGIN
  SELECT * INTO v_player FROM players WHERE id = p_player_id;
  IF NOT FOUND THEN
    RETURN; -- already gone
  END IF;

  -- Only allow a user to remove their own player record.
  IF v_player.auth_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Not authorized to remove this player';
  END IF;

  SELECT * INTO v_room FROM rooms WHERE id = v_player.room_id FOR UPDATE;

  -- Remove the player first.
  DELETE FROM players WHERE id = p_player_id;

  -- If the round can no longer resolve (chameleon or host left mid-game),
  -- reset the room back to the lobby.
  IF FOUND AND v_room.id IS NOT NULL AND v_room.status <> 'lobby'
     AND (v_room.chameleon_id = p_player_id OR v_player.is_host) THEN
    UPDATE rooms
      SET status = 'lobby',
          topic_category = NULL,
          secret_word = NULL,
          dice_result = NULL,
          chameleon_id = NULL,
          vote_end_time = NULL,
          updated_at = NOW()
      WHERE id = v_room.id;
    UPDATE players
      SET has_revealed = false, vote_target_id = NULL
      WHERE room_id = v_room.id;
  END IF;

  -- Host handoff.
  IF v_player.is_host THEN
    SELECT id INTO v_new_host
      FROM players
      WHERE room_id = v_player.room_id
      ORDER BY joined_at ASC
      LIMIT 1;

    IF v_new_host IS NOT NULL THEN
      UPDATE players SET is_host = true WHERE id = v_new_host;
      UPDATE rooms SET host_id = v_new_host, updated_at = NOW()
        WHERE id = v_player.room_id;
    ELSE
      -- No one left — remove the empty room.
      DELETE FROM rooms WHERE id = v_player.room_id;
    END IF;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION leave_room(UUID) TO authenticated;


-- ============================================================
-- 20260710000004_reset_players_rpc.sql
-- ============================================================
-- ==========================================
-- ATOMIC ROOM-WIDE PLAYER RESET (SECURITY DEFINER)
-- ==========================================
-- The players UPDATE RLS policy is `auth.uid() = auth_user_id` (self-only), so a
-- room-wide `UPDATE players ... WHERE room_id = X` from the client only mutates
-- the CALLER's own row and silently skips everyone else. That quietly broke every
-- reset path: start game, start voting, and new round all left other players'
-- has_revealed / vote_target_id at their previous-round values — so stale reveals
-- and stale votes leaked across rounds and corrupted results.
--
-- This SECURITY DEFINER function resets all players in a room at once, bypassing
-- RLS. Only the room's host may call it.

CREATE OR REPLACE FUNCTION reset_room_players(p_room_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only the host of this room may reset its players.
  IF NOT EXISTS (
    SELECT 1 FROM players
    WHERE room_id = p_room_id
      AND auth_user_id = auth.uid()
      AND is_host = true
  ) THEN
    RAISE EXCEPTION 'Only the host can reset players';
  END IF;

  UPDATE players
    SET has_revealed = false, vote_target_id = NULL
    WHERE room_id = p_room_id;
END;
$$;

GRANT EXECUTE ON FUNCTION reset_room_players(UUID) TO authenticated;


-- ============================================================
-- 20260710000005_join_integrity.sql
-- ============================================================
-- ==========================================
-- JOIN INTEGRITY: CASE-INSENSITIVE UNIQUE NAMES + MAX PLAYER CAP
-- ==========================================
-- The client checks "is this name taken?" and "is the room full?" before
-- INSERTing, but those are check-then-act races (TOCTOU): two players joining
-- at the same instant can both pass the check and both insert, producing
-- duplicate names or a 9th player. Enforce both invariants at the DB level so
-- the race is impossible regardless of client timing.

-- 1. Case-insensitive unique player name per room (so "Bob" and "bob" collide).
CREATE UNIQUE INDEX IF NOT EXISTS idx_players_room_name_ci
  ON players (room_id, lower(name));

-- 2. Hard cap of 8 players per room, enforced on insert.
CREATE OR REPLACE FUNCTION enforce_player_cap()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT count(*) INTO v_count FROM players WHERE room_id = NEW.room_id;
  IF v_count >= 8 THEN
    RAISE EXCEPTION 'Room is full (max 8 players).' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_player_cap ON players;
CREATE TRIGGER trg_enforce_player_cap
  BEFORE INSERT ON players
  FOR EACH ROW
  EXECUTE FUNCTION enforce_player_cap();

