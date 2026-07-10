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
