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
CREATE POLICY "Host can update rooms"
  ON rooms FOR UPDATE
  TO authenticated
  USING (
    host_id IN (
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

-- Enable realtime for rooms table
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;

-- Enable realtime for players table
ALTER PUBLICATION supabase_realtime ADD TABLE players;

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
