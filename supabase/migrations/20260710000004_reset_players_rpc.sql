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
