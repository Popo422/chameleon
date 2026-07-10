-- ==========================================
-- VOTING END-GAME RESILIENCE
-- ==========================================
-- Previously only the host could move a room out of the voting phase. If the
-- host disconnected or navigated away while a vote was in progress, the room
-- got stuck in 'voting' forever with no recovery. Allow ANY player in the room
-- to transition a room from 'voting' -> 'results' once voting is underway, so a
-- non-host fallback can end the round. All other room updates remain host-only.

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
