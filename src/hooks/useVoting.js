import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook for managing the voting phase
 * @param {string} roomId - Room ID
 * @param {string} playerId - Current player ID
 * @returns {object} - Voting state and functions
 */
export const useVoting = (roomId, playerId) => {
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [votedFor, setVotedFor] = useState(null);
  const [voteResults, setVoteResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1000) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [timeRemaining]);

  /**
   * Start the voting phase (host only)
   * @param {number} durationSeconds - Voting duration in seconds
   * @returns {Promise<{success: boolean, error: string|null}>}
   */
  const startVoting = useCallback(async (durationSeconds = 60) => {
    setLoading(true);

    try {
      const voteEndTime = new Date(Date.now() + durationSeconds * 1000).toISOString();

      // Reset all votes and update room status
      const { error: resetError } = await supabase
        .from('players')
        .update({ vote_target_id: null })
        .eq('room_id', roomId);

      if (resetError) throw resetError;

      const { error: updateError } = await supabase
        .from('rooms')
        .update({
          status: 'voting',
          vote_end_time: voteEndTime,
          updated_at: new Date().toISOString(),
        })
        .eq('id', roomId);

      if (updateError) throw updateError;

      setTimeRemaining(durationSeconds * 1000);
      setHasVoted(false);
      setVotedFor(null);
      setVoteResults(null);
      setLoading(false);

      return { success: true, error: null };
    } catch (err) {
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, [roomId]);

  /**
   * Cast a vote
   * @param {string} targetPlayerId - Player ID to vote for
   * @returns {Promise<{success: boolean, error: string|null}>}
   */
  const castVote = useCallback(async (targetPlayerId) => {
    if (hasVoted) {
      return { success: false, error: 'Already voted' };
    }

    // Check if voting is still active (prevent vote after timer expires)
    if (timeRemaining !== null && timeRemaining <= 0) {
      return { success: false, error: 'Voting has ended' };
    }

    setLoading(true);

    try {
      // Verify room is still in voting status before submitting
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select('status')
        .eq('id', roomId)
        .single();

      if (roomError) throw roomError;

      if (room.status !== 'voting') {
        setLoading(false);
        return { success: false, error: 'Voting has ended' };
      }

      // Verify target player exists in this room
      const { data: targetPlayer, error: targetError } = await supabase
        .from('players')
        .select('id')
        .eq('id', targetPlayerId)
        .eq('room_id', roomId)
        .single();

      if (targetError || !targetPlayer) {
        setLoading(false);
        return { success: false, error: 'Invalid vote target' };
      }

      const { error: voteError } = await supabase
        .from('players')
        .update({ vote_target_id: targetPlayerId })
        .eq('id', playerId);

      if (voteError) throw voteError;

      setHasVoted(true);
      setVotedFor(targetPlayerId);
      setLoading(false);

      return { success: true, error: null };
    } catch (err) {
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, [playerId, hasVoted, timeRemaining, roomId]);

  /**
   * Calculate and get vote results
   * @returns {Promise<{results: object, error: string|null}>}
   */
  const getResults = useCallback(async () => {
    try {
      // Get all players with their votes
      const { data: players, error: playersError } = await supabase
        .from('players')
        .select('id, name, vote_target_id')
        .eq('room_id', roomId);

      if (playersError) throw playersError;

      // Get room info for chameleon
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select('chameleon_id, secret_word')
        .eq('id', roomId)
        .single();

      if (roomError) throw roomError;

      // Tally votes
      const voteCounts = {};
      players.forEach((player) => {
        if (player.vote_target_id) {
          voteCounts[player.vote_target_id] = (voteCounts[player.vote_target_id] || 0) + 1;
        }
      });

      // Find player with most votes
      let maxVotes = 0;
      let accusedPlayers = [];

      Object.entries(voteCounts).forEach(([targetId, count]) => {
        if (count > maxVotes) {
          maxVotes = count;
          accusedPlayers = [targetId];
        } else if (count === maxVotes) {
          accusedPlayers.push(targetId);
        }
      });

      // Get accused player names
      const accusedInfo = players
        .filter((p) => accusedPlayers.includes(p.id))
        .map((p) => ({ id: p.id, name: p.name }));

      const chameleonInfo = players.find((p) => p.id === room.chameleon_id);

      const results = {
        voteCounts,
        accusedPlayers: accusedInfo,
        isTie: accusedPlayers.length > 1,
        chameleonId: room.chameleon_id,
        chameleonName: chameleonInfo?.name || 'Unknown',
        chameleonCaught: accusedPlayers.includes(room.chameleon_id),
        secretWord: room.secret_word,
        totalVotes: Object.values(voteCounts).reduce((a, b) => a + b, 0),
        playerCount: players.length,
      };

      setVoteResults(results);
      return { results, error: null };
    } catch (err) {
      return { results: null, error: err.message };
    }
  }, [roomId]);

  /**
   * End voting and show results (host only)
   * @returns {Promise<{success: boolean, error: string|null}>}
   */
  const endVoting = useCallback(async () => {
    setLoading(true);

    try {
      const { error: updateError } = await supabase
        .from('rooms')
        .update({
          status: 'results',
          vote_end_time: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', roomId);

      if (updateError) throw updateError;

      // Get results
      await getResults();

      setTimeRemaining(0);
      setLoading(false);

      return { success: true, error: null };
    } catch (err) {
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, [roomId, getResults]);

  /**
   * Sync timer with server time
   * @param {string} voteEndTime - ISO string of when voting ends
   */
  const syncTimer = useCallback((voteEndTime) => {
    if (!voteEndTime) {
      setTimeRemaining(null);
      return;
    }

    const endTime = new Date(voteEndTime).getTime();
    const remaining = Math.max(0, endTime - Date.now());
    setTimeRemaining(remaining);
  }, []);

  /**
   * Reset voting state for new round
   */
  const resetVoting = useCallback(() => {
    setTimeRemaining(null);
    setHasVoted(false);
    setVotedFor(null);
    setVoteResults(null);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return {
    timeRemaining,
    hasVoted,
    votedFor,
    voteResults,
    loading,
    startVoting,
    castVote,
    getResults,
    endVoting,
    syncTimer,
    resetVoting,
  };
};
