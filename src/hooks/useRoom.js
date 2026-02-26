import { useState, useCallback } from 'react';
import { supabase, setStoredPlayerName } from '../lib/supabase';
import { generateRoomCode, normalizeRoomCode } from '../utils/roomCode';
import topicsData from '../data/topics.json';

export const useRoom = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Create a new room
   * @param {string} authUserId - Auth user ID from Supabase Auth
   * @param {string} hostName - Name of the host player
   * @param {boolean} isFilipino - Whether to use Filipino topics
   * @returns {Promise<{room: object, player: object, error: string|null}>}
   */
  const createRoom = useCallback(async (authUserId, hostName, isFilipino = false) => {
    if (!authUserId) {
      return { room: null, player: null, error: 'Not authenticated' };
    }

    setLoading(true);
    setError(null);

    try {
      // Generate unique room code
      let code = generateRoomCode();
      let attempts = 0;
      const MAX_ATTEMPTS = 5;

      // Check for code uniqueness (rare collision handling)
      while (attempts < MAX_ATTEMPTS) {
        const { data: existing } = await supabase
          .from('rooms')
          .select('id')
          .eq('code', code)
          .single();

        if (!existing) break;
        code = generateRoomCode();
        attempts++;
      }

      // If all attempts failed, throw error instead of using duplicate code
      if (attempts >= MAX_ATTEMPTS) {
        throw new Error('Failed to generate unique room code. Please try again.');
      }

      // Create room
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .insert({
          code,
          host_id: null, // Will update after creating player
          status: 'lobby',
          is_filipino: isFilipino,
        })
        .select()
        .single();

      if (roomError) throw roomError;

      // Create host player with auth_user_id
      const { data: player, error: playerError } = await supabase
        .from('players')
        .insert({
          room_id: room.id,
          auth_user_id: authUserId,
          name: hostName,
          is_host: true,
          is_connected: true,
        })
        .select()
        .single();

      if (playerError) throw playerError;

      // Update room with host_id
      const { error: updateError } = await supabase
        .from('rooms')
        .update({ host_id: player.id })
        .eq('id', room.id);

      if (updateError) throw updateError;

      // Store player name locally for convenience
      setStoredPlayerName(hostName);

      setLoading(false);
      return { room: { ...room, host_id: player.id }, player, error: null };
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return { room: null, player: null, error: err.message };
    }
  }, []);

  /**
   * Join an existing room
   * @param {string} authUserId - Auth user ID from Supabase Auth
   * @param {string} code - Room code
   * @param {string} playerName - Name of the joining player
   * @returns {Promise<{room: object, player: object, error: string|null}>}
   */
  const joinRoom = useCallback(async (authUserId, code, playerName) => {
    if (!authUserId) {
      return { room: null, player: null, error: 'Not authenticated' };
    }

    setLoading(true);
    setError(null);

    try {
      const normalizedCode = normalizeRoomCode(code);

      // Find room by code
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('code', normalizedCode)
        .single();

      if (roomError || !room) {
        throw new Error('Room not found. Please check the code and try again.');
      }

      // Check if room is joinable
      if (room.status !== 'lobby') {
        throw new Error('This game has already started. Cannot join.');
      }

      // Check if user is already in this room (rejoin scenario)
      const { data: existingPlayer } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', room.id)
        .eq('auth_user_id', authUserId)
        .single();

      if (existingPlayer) {
        // User already in room - update connection status and name
        const { data: updatedPlayer, error: updateError } = await supabase
          .from('players')
          .update({ is_connected: true, name: playerName })
          .eq('id', existingPlayer.id)
          .select()
          .single();

        if (updateError) throw updateError;

        setStoredPlayerName(playerName);
        setLoading(false);
        return { room, player: updatedPlayer, error: null };
      }

      // Check player count
      const { data: existingPlayers, error: countError } = await supabase
        .from('players')
        .select('id')
        .eq('room_id', room.id);

      if (countError) throw countError;

      if (existingPlayers.length >= 8) {
        throw new Error('Room is full (max 8 players).');
      }

      // Check for duplicate name
      const { data: duplicateName } = await supabase
        .from('players')
        .select('id')
        .eq('room_id', room.id)
        .eq('name', playerName)
        .single();

      if (duplicateName) {
        throw new Error('A player with this name already exists in the room.');
      }

      // Create player with auth_user_id
      const { data: player, error: playerError } = await supabase
        .from('players')
        .insert({
          room_id: room.id,
          auth_user_id: authUserId,
          name: playerName,
          is_host: false,
          is_connected: true,
        })
        .select()
        .single();

      if (playerError) throw playerError;

      // Store player name locally
      setStoredPlayerName(playerName);

      setLoading(false);
      return { room, player, error: null };
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return { room: null, player: null, error: err.message };
    }
  }, []);

  /**
   * Get room by code and find current player by auth user ID
   * @param {string} authUserId - Auth user ID from Supabase Auth
   * @param {string} code - Room code
   * @returns {Promise<{room: object, players: array, currentPlayer: object|null, error: string|null}>}
   */
  const getRoomByCode = useCallback(async (authUserId, code) => {
    setLoading(true);
    setError(null);

    try {
      const normalizedCode = normalizeRoomCode(code);

      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('code', normalizedCode)
        .single();

      if (roomError || !room) {
        throw new Error('Room not found.');
      }

      const { data: players, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', room.id)
        .order('joined_at', { ascending: true });

      if (playersError) throw playersError;

      // Find current player by auth user ID
      const currentPlayer = authUserId
        ? players.find((p) => p.auth_user_id === authUserId) || null
        : null;

      setLoading(false);
      return { room, players, currentPlayer, error: null };
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return { room: null, players: [], currentPlayer: null, error: err.message };
    }
  }, []);

  /**
   * Leave a room
   * @param {string} playerId - Player ID
   * @returns {Promise<{success: boolean, error: string|null}>}
   */
  const leaveRoom = useCallback(async (playerId) => {
    setLoading(true);
    setError(null);

    try {
      // Get player info first
      const { data: player, error: playerError } = await supabase
        .from('players')
        .select('*, rooms(*)')
        .eq('id', playerId)
        .single();

      if (playerError) throw playerError;

      // Delete player
      const { error: deleteError } = await supabase
        .from('players')
        .delete()
        .eq('id', playerId);

      if (deleteError) throw deleteError;

      // If host is leaving, assign new host or delete room
      if (player.is_host) {
        const { data: remainingPlayers } = await supabase
          .from('players')
          .select('*')
          .eq('room_id', player.room_id)
          .order('joined_at', { ascending: true })
          .limit(1);

        if (remainingPlayers && remainingPlayers.length > 0) {
          // Assign new host
          await supabase
            .from('players')
            .update({ is_host: true })
            .eq('id', remainingPlayers[0].id);

          await supabase
            .from('rooms')
            .update({ host_id: remainingPlayers[0].id })
            .eq('id', player.room_id);
        } else {
          // Delete empty room
          await supabase
            .from('rooms')
            .delete()
            .eq('id', player.room_id);
        }
      }

      setLoading(false);
      return { success: true, error: null };
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, []);

  /**
   * Kick a player (host only)
   * @param {string} playerId - Player to kick
   * @param {string} hostPlayerId - Host player ID (for verification)
   * @returns {Promise<{success: boolean, error: string|null}>}
   */
  const kickPlayer = useCallback(async (playerId, hostPlayerId) => {
    setLoading(true);
    setError(null);

    try {
      // Verify host
      const { data: host } = await supabase
        .from('players')
        .select('is_host, room_id')
        .eq('id', hostPlayerId)
        .single();

      if (!host || !host.is_host) {
        throw new Error('Only the host can kick players.');
      }

      // Verify player is in same room
      const { data: player } = await supabase
        .from('players')
        .select('room_id')
        .eq('id', playerId)
        .single();

      if (!player || player.room_id !== host.room_id) {
        throw new Error('Player not found in this room.');
      }

      // Delete player
      const { error: deleteError } = await supabase
        .from('players')
        .delete()
        .eq('id', playerId);

      if (deleteError) throw deleteError;

      setLoading(false);
      return { success: true, error: null };
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, []);

  /**
   * Update room settings (host only)
   * @param {string} roomId - Room ID
   * @param {object} settings - Settings to update
   * @returns {Promise<{success: boolean, error: string|null}>}
   */
  const updateRoomSettings = useCallback(async (roomId, settings) => {
    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('rooms')
        .update({
          ...settings,
          updated_at: new Date().toISOString(),
        })
        .eq('id', roomId);

      if (updateError) throw updateError;

      setLoading(false);
      return { success: true, error: null };
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, []);

  /**
   * Start the game (host only)
   * @param {string} roomId - Room ID
   * @param {number} topicIndex - Selected topic index (null for random)
   * @param {boolean} isFilipino - Use Filipino topics
   * @returns {Promise<{success: boolean, error: string|null}>}
   */
  const startGame = useCallback(async (roomId, topicIndex = null, isFilipino = false) => {
    setLoading(true);
    setError(null);

    try {
      // Get players
      const { data: players, error: playersError } = await supabase
        .from('players')
        .select('id')
        .eq('room_id', roomId);

      if (playersError) throw playersError;

      if (players.length < 3) {
        throw new Error('Need at least 3 players to start.');
      }

      // Pick topic
      const topicArray = isFilipino ? topicsData.filipinoTopics : topicsData.topics;
      const selectedTopicIndex = topicIndex !== null
        ? topicIndex
        : Math.floor(Math.random() * topicArray.length);
      const selectedTopic = topicArray[selectedTopicIndex];

      // Generate dice result
      const diceRow = Math.floor(Math.random() * 4) + 1;
      const diceCol = Math.floor(Math.random() * 4) + 1;
      const secretWord = selectedTopic.words[diceRow - 1][diceCol - 1];

      // Pick chameleon
      const chameleonIndex = Math.floor(Math.random() * players.length);
      const chameleonId = players[chameleonIndex].id;

      // Update room
      const { error: updateError } = await supabase
        .from('rooms')
        .update({
          status: 'playing',
          topic_category: selectedTopic.category,
          secret_word: secretWord,
          dice_result: { row: diceRow, col: diceCol },
          chameleon_id: chameleonId,
          is_filipino: isFilipino,
          updated_at: new Date().toISOString(),
        })
        .eq('id', roomId);

      if (updateError) throw updateError;

      // Reset all players' revealed status
      const { error: resetError } = await supabase
        .from('players')
        .update({ has_revealed: false, vote_target_id: null })
        .eq('room_id', roomId);

      if (resetError) throw resetError;

      setLoading(false);
      return { success: true, error: null };
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, []);

  /**
   * Mark player as revealed
   * @param {string} playerId - Player ID
   * @returns {Promise<{success: boolean, error: string|null}>}
   */
  const revealRole = useCallback(async (playerId) => {
    try {
      const { error: updateError } = await supabase
        .from('players')
        .update({ has_revealed: true })
        .eq('id', playerId);

      if (updateError) throw updateError;

      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  /**
   * Update player connection status
   * @param {string} playerId - Player ID
   * @param {boolean} isConnected - Connection status
   */
  const updateConnectionStatus = useCallback(async (playerId, isConnected) => {
    try {
      await supabase
        .from('players')
        .update({ is_connected: isConnected })
        .eq('id', playerId);
    } catch (err) {
      console.error('Failed to update connection status:', err);
    }
  }, []);

  return {
    loading,
    error,
    createRoom,
    joinRoom,
    getRoomByCode,
    leaveRoom,
    kickPlayer,
    updateRoomSettings,
    startGame,
    revealRole,
    updateConnectionStatus,
  };
};
