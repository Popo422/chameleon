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
