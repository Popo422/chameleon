import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useRoom } from '../hooks/useRoom';
import { useRealtime, usePresence } from '../hooks/useRealtime';
import { useVoting } from '../hooks/useVoting';
import topicsData from '../data/topics.json';

const GameContext = createContext(null);

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

export const GameProvider = ({ children }) => {
  // Auth
  const { userId, loading: authLoading } = useAuth();

  // Core state
  const [room, setRoom] = useState(null);
  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [isFilipino, setIsFilipino] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Derived state
  const [hasRevealed, setHasRevealed] = useState(false);
  const [allPlayersRevealed, setAllPlayersRevealed] = useState(false);
  const [isChameleon, setIsChameleon] = useState(false);
  const [wasKicked, setWasKicked] = useState(false);

  const navigate = useNavigate();

  // Hooks
  const {
    createRoom: createRoomApi,
    joinRoom: joinRoomApi,
    getRoomByCode,
    leaveRoom: leaveRoomApi,
    kickPlayer: kickPlayerApi,
    updateRoomSettings,
    startGame: startGameApi,
    revealRole,
    updateConnectionStatus,
  } = useRoom();

  const voting = useVoting(room?.id, currentPlayer?.id);

  // Use ref for voting to avoid dependency issues in callbacks
  const votingRef = useRef(voting);
  votingRef.current = voting;

  // Get current topic data
  const getCurrentTopic = useCallback(() => {
    if (!room?.topic_category) return null;
    const topicArray = room.is_filipino ? topicsData.filipinoTopics : topicsData.topics;
    return topicArray.find((t) => t.category === room.topic_category);
  }, [room]);

  // Memoized realtime callbacks using refs to avoid re-subscriptions
  const handleRoomUpdate = useCallback((newRoom) => {
    setRoom(newRoom);

    // Sync voting timer
    if (newRoom.status === 'voting' && newRoom.vote_end_time) {
      votingRef.current.syncTimer(newRoom.vote_end_time);
    }
  }, []);

  const handlePlayerJoin = useCallback((newPlayer) => {
    setPlayers((prev) => {
      if (prev.find((p) => p.id === newPlayer.id)) return prev;
      return [...prev, newPlayer];
    });
  }, []);

  const handlePlayerLeave = useCallback((leftPlayer) => {
    setPlayers((prev) => prev.filter((p) => p.id !== leftPlayer.id));

    // Check if current player was kicked (by comparing auth_user_id)
    if (leftPlayer.auth_user_id === userId) {
      setRoom(null);
      setPlayers([]);
      setCurrentPlayer(null);
      setWasKicked(true); // Show kicked modal instead of immediate redirect
    }
  }, [userId]);

  const handlePlayerUpdate = useCallback((updatedPlayer) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === updatedPlayer.id ? updatedPlayer : p))
    );

    // Update current player if it's us (by comparing auth_user_id)
    if (updatedPlayer.auth_user_id === userId) {
      setCurrentPlayer(updatedPlayer);
      setHasRevealed(updatedPlayer.has_revealed);
    }
  }, [userId]);

  // Setup realtime subscriptions
  useRealtime(room?.id, {
    onRoomUpdate: handleRoomUpdate,
    onPlayerJoin: handlePlayerJoin,
    onPlayerLeave: handlePlayerLeave,
    onPlayerUpdate: handlePlayerUpdate,
  });

  // Setup presence tracking
  usePresence(room?.id, currentPlayer?.id, currentPlayer?.name);

  // Check if all players revealed
  useEffect(() => {
    if (players.length > 0) {
      const allRevealed = players.every((p) => p.has_revealed);
      setAllPlayersRevealed(allRevealed);
    }
  }, [players]);

  // Check chameleon status when room/player changes
  useEffect(() => {
    if (room && currentPlayer) {
      setIsChameleon(room.chameleon_id === currentPlayer.id);
    }
  }, [room, currentPlayer]);

  /**
   * Create a new room and become host
   */
  const createRoom = useCallback(async (hostName, filipino = false) => {
    if (!userId) {
      return { success: false, error: 'Not authenticated' };
    }

    setLoading(true);
    setError(null);

    const { room: newRoom, player, error: err } = await createRoomApi(userId, hostName, filipino);

    if (err) {
      setError(err);
      setLoading(false);
      return { success: false, error: err };
    }

    setRoom(newRoom);
    setCurrentPlayer(player);
    setPlayers([player]);
    setIsHost(true);
    setIsFilipino(filipino);
    setLoading(false);

    return { success: true, roomCode: newRoom.code };
  }, [userId, createRoomApi]);

  /**
   * Join an existing room
   */
  const joinRoom = useCallback(async (code, playerName) => {
    if (!userId) {
      return { success: false, error: 'Not authenticated' };
    }

    setLoading(true);
    setError(null);

    const { room: joinedRoom, player, error: err } = await joinRoomApi(userId, code, playerName);

    if (err) {
      setError(err);
      setLoading(false);
      return { success: false, error: err };
    }

    // Fetch all players
    const { players: allPlayers } = await getRoomByCode(userId, code);

    setRoom(joinedRoom);
    setCurrentPlayer(player);
    setPlayers(allPlayers);
    setIsHost(player.is_host);
    setIsFilipino(joinedRoom.is_filipino);
    setLoading(false);

    return { success: true };
  }, [userId, joinRoomApi, getRoomByCode]);

  /**
   * Rejoin a room (reconnection)
   */
  const rejoinRoom = useCallback(async (code) => {
    if (!userId) {
      return { success: false, error: 'Not authenticated' };
    }

    setLoading(true);
    setError(null);

    const { room: foundRoom, players: foundPlayers, currentPlayer: ourPlayer, error: err } =
      await getRoomByCode(userId, code);

    if (err) {
      setError(err);
      setLoading(false);
      return { success: false, error: err };
    }

    if (!ourPlayer) {
      setError('You are not in this room. Please join first.');
      setLoading(false);
      return { success: false, error: 'Not in room' };
    }

    // Update connection status
    await updateConnectionStatus(ourPlayer.id, true);

    setRoom(foundRoom);
    setCurrentPlayer(ourPlayer);
    setPlayers(foundPlayers);
    setIsHost(ourPlayer.is_host);
    setIsFilipino(foundRoom.is_filipino);
    setHasRevealed(ourPlayer.has_revealed);
    setLoading(false);

    return { success: true };
  }, [userId, getRoomByCode, updateConnectionStatus]);

  /**
   * Leave the current room
   */
  const leaveRoom = useCallback(async () => {
    if (!currentPlayer) return;

    setLoading(true);
    await leaveRoomApi(currentPlayer.id);

    setRoom(null);
    setPlayers([]);
    setCurrentPlayer(null);
    setIsHost(false);
    setHasRevealed(false);
    setAllPlayersRevealed(false);
    setIsChameleon(false);
    voting.resetVoting();
    setLoading(false);

    navigate('/', { replace: true });
  }, [currentPlayer, leaveRoomApi, navigate, voting]);

  /**
   * Kick a player (host only)
   */
  const kickPlayer = useCallback(async (playerId) => {
    if (!isHost || !currentPlayer) return { success: false, error: 'Not authorized' };

    const result = await kickPlayerApi(playerId, currentPlayer.id);

    // Manually remove from local state as fallback (don't rely solely on realtime)
    if (result.success) {
      setPlayers((prev) => prev.filter((p) => p.id !== playerId));
    }

    return result;
  }, [isHost, currentPlayer, kickPlayerApi]);

  /**
   * Toggle Filipino mode (host only, lobby only)
   */
  const toggleFilipino = useCallback(async () => {
    if (!isHost || !room || room.status !== 'lobby') return;

    const newValue = !isFilipino;
    setIsFilipino(newValue);
    setSelectedTopic(null);

    await updateRoomSettings(room.id, { is_filipino: newValue });
  }, [isHost, room, isFilipino, updateRoomSettings]);

  /**
   * Start the game (host only)
   */
  const startGame = useCallback(async () => {
    if (!isHost || !room) return { success: false, error: 'Not authorized' };

    if (players.length < 3) {
      return { success: false, error: 'Need at least 3 players to start' };
    }

    const result = await startGameApi(room.id, selectedTopic, isFilipino);

    if (result.success) {
      setHasRevealed(false);
      setAllPlayersRevealed(false);
      voting.resetVoting();
    }

    return result;
  }, [isHost, room, players.length, selectedTopic, isFilipino, startGameApi, voting]);

  /**
   * Reveal role for current player
   */
  const reveal = useCallback(async () => {
    if (!currentPlayer || hasRevealed) return;

    const result = await revealRole(currentPlayer.id);
    if (result.success) {
      setHasRevealed(true);
    }
    return result;
  }, [currentPlayer, hasRevealed, revealRole]);

  /**
   * Start voting phase (host only)
   */
  const startVotingPhase = useCallback(async (durationSeconds = 60) => {
    if (!isHost) return { success: false, error: 'Not authorized' };
    return await voting.startVoting(durationSeconds);
  }, [isHost, voting]);

  /**
   * End voting and show results (host only)
   */
  const endVotingPhase = useCallback(async () => {
    if (!isHost) return { success: false, error: 'Not authorized' };
    return await voting.endVoting();
  }, [isHost, voting]);

  /**
   * Go back to lobby for new round
   */
  const newRound = useCallback(async () => {
    if (!isHost || !room) return { success: false, error: 'Not authorized' };

    await updateRoomSettings(room.id, {
      status: 'lobby',
      topic_category: null,
      secret_word: null,
      dice_result: null,
      chameleon_id: null,
      vote_end_time: null,
    });

    // Reset all players
    const { error: resetError } = await supabase
      .from('players')
      .update({ has_revealed: false, vote_target_id: null })
      .eq('room_id', room.id);

    if (!resetError) {
      setHasRevealed(false);
      setAllPlayersRevealed(false);
      setIsChameleon(false);
      voting.resetVoting();
    }

    return { success: !resetError };
  }, [isHost, room, updateRoomSettings, voting]);

  const value = {
    // Auth
    userId,
    authLoading,

    // State
    room,
    players,
    currentPlayer,
    isHost,
    isFilipino,
    selectedTopic,
    loading,
    error,
    hasRevealed,
    allPlayersRevealed,
    isChameleon,

    // Computed
    getCurrentTopic,
    secretWord: room?.secret_word,
    diceResult: room?.dice_result,
    roomCode: room?.code,
    roomStatus: room?.status || 'lobby',

    // Actions
    createRoom,
    joinRoom,
    rejoinRoom,
    leaveRoom,
    kickPlayer,
    toggleFilipino,
    setSelectedTopic,
    startGame,
    reveal,

    // Voting
    voting,
    startVotingPhase,
    endVotingPhase,
    newRound,

    // Kicked state
    wasKicked,
    dismissKicked: () => {
      setWasKicked(false);
      navigate('/', { replace: true });
    },

    // Helpers
    setError,
    clearError: () => setError(null),
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};
