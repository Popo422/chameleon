import { useState, useEffect, useCallback } from 'react';
import topicsData from '../data/topics.json';

export const useGameState = () => {
  const [gameState, setGameState] = useState({
    players: [],
    currentPlayer: 0,
    currentTopic: null,
    secretWord: '',
    chameleonPlayer: null,
    gameStarted: false,
    diceResult: { row: 0, col: 0 },
    isRevealed: false,
    allPlayersRevealed: false,
    discussionStarted: false,
    showBoardDuringReveal: false,
    hasSeenSummary: false,
    isFilipino: false
  });

  const initializeGame = useCallback((playerCount, selectedTopicIndex = null) => {
    // Pick topic based on language preference
    const topicArray = gameState.isFilipino ? topicsData.filipinoTopics : topicsData.topics;
    
    // Use selected topic or pick random
    const topicIndex = selectedTopicIndex !== null ? 
      selectedTopicIndex : 
      Math.floor(Math.random() * topicArray.length);
    
    const selectedTopic = topicArray[topicIndex];
    
    // Generate random dice result (1-4 for both dice)
    const diceRow = Math.floor(Math.random() * 4) + 1;
    const diceCol = Math.floor(Math.random() * 4) + 1;
    
    // Get secret word based on dice result
    const secretWord = selectedTopic.words[diceRow - 1][diceCol - 1];
    
    // Randomly assign chameleon
    const chameleonIndex = Math.floor(Math.random() * playerCount);
    
    // Create players array
    const players = Array.from({ length: playerCount }, (_, index) => ({
      id: index + 1,
      isChameleon: index === chameleonIndex,
      hasRevealed: false
    }));

    setGameState({
      players,
      currentPlayer: 0,
      currentTopic: selectedTopic,
      secretWord,
      chameleonPlayer: chameleonIndex,
      gameStarted: true,
      diceResult: { row: diceRow, col: diceCol },
      isRevealed: false,
      allPlayersRevealed: false,
      discussionStarted: false,
      showBoardDuringReveal: false,
      hasSeenSummary: false,
      isFilipino: gameState.isFilipino
    });
  }, [gameState.isFilipino]);

  const nextPlayer = useCallback(() => {
    setGameState(prev => {
      const newCurrentPlayer = (prev.currentPlayer + 1) % prev.players.length;
      
      return {
        ...prev,
        currentPlayer: newCurrentPlayer,
        isRevealed: false,
        showBoardDuringReveal: false
      };
    });
  }, []);

  const previousPlayer = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      currentPlayer: prev.currentPlayer === 0 ? prev.players.length - 1 : prev.currentPlayer - 1,
      isRevealed: false,
      showBoardDuringReveal: false
    }));
  }, []);

  const skipToPlayer = useCallback((playerIndex) => {
    setGameState(prev => ({
      ...prev,
      currentPlayer: playerIndex,
      isRevealed: false,
      showBoardDuringReveal: false
    }));
  }, []);

  const revealForCurrentPlayer = useCallback(() => {
    setGameState(prev => {
      const updatedPlayers = [...prev.players];
      updatedPlayers[prev.currentPlayer].hasRevealed = true;
      const allRevealed = updatedPlayers.every(player => player.hasRevealed);
      
      return {
        ...prev,
        players: updatedPlayers,
        isRevealed: true,
        allPlayersRevealed: allRevealed,
        hasSeenSummary: allRevealed ? true : prev.hasSeenSummary
      };
    });
  }, []);

  const startDiscussion = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      discussionStarted: true
    }));
  }, []);

  const reviewRoles = useCallback(() => {
    setGameState(prev => {
      // Reset all players' revealed status
      const resetPlayers = prev.players.map(player => ({
        ...player,
        hasRevealed: false
      }));
      
      return {
        ...prev,
        players: resetPlayers,
        discussionStarted: false,
        currentPlayer: 0,
        isRevealed: false,
        allPlayersRevealed: false,
        showBoardDuringReveal: false
      };
    });
  }, []);

  const returnToSummary = useCallback(() => {
    setGameState(prev => {
      // Mark all players as revealed again
      const allRevealedPlayers = prev.players.map(player => ({
        ...player,
        hasRevealed: true
      }));
      
      return {
        ...prev,
        players: allRevealedPlayers,
        discussionStarted: false,
        currentPlayer: 0,
        isRevealed: false,
        allPlayersRevealed: true,
        showBoardDuringReveal: false
      };
    });
  }, []);

  const toggleBoardView = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      showBoardDuringReveal: !prev.showBoardDuringReveal
    }));
  }, []);

  const resetGame = useCallback(() => {
    setGameState(prev => ({
      players: [],
      currentPlayer: 0,
      currentTopic: null,
      secretWord: '',
      chameleonPlayer: null,
      gameStarted: false,
      diceResult: { row: 0, col: 0 },
      isRevealed: false,
      allPlayersRevealed: false,
      discussionStarted: false,
      showBoardDuringReveal: false,
      hasSeenSummary: false,
      isFilipino: prev.isFilipino // Keep language preference
    }));
  }, []);

  return {
    gameState,
    initializeGame,
    nextPlayer,
    previousPlayer,
    skipToPlayer,
    revealForCurrentPlayer,
    startDiscussion,
    reviewRoles,
    returnToSummary,
    toggleBoardView,
    resetGame,
    toggleFilipino: useCallback(() => {
      setGameState(prev => ({
        ...prev,
        isFilipino: !prev.isFilipino
      }));
    }, [])
  };
};