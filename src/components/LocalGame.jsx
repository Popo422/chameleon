import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { RotateCcw, Volume2, VolumeX, Home } from 'lucide-react';

import { useGameState } from '../hooks/useGameState';
import { useSounds } from '../hooks/useSounds';
import { useBackgroundMusic } from '../hooks/useBackgroundMusic';
import GameSetup from './GameSetup';
import PlayerIndicator from './PlayerIndicator';
import ChameleonIcon from './ChameleonIcon';
import RevealCard from './RevealCard';
import AllPlayersRevealed from './AllPlayersRevealed';
import DiscussionPhase from './DiscussionPhase';
import WordBoardModal from './WordBoardModal';

function LocalGame() {
  const navigate = useNavigate();
  const {
    gameState,
    initializeGame,
    nextPlayer,
    previousPlayer,
    revealForCurrentPlayer,
    startDiscussion,
    reviewRoles,
    returnToSummary,
    toggleBoardView,
    resetGame,
    toggleFilipino
  } = useGameState();

  const { playClickSound, playSuccessSound } = useSounds();
  const { isPlaying, toggleMusic, startMusic, stopMusic } = useBackgroundMusic();

  const handleLongPress = () => {
    if (gameState.isRevealed) return;

    revealForCurrentPlayer();
    toast.success(`Player ${gameState.currentPlayer + 1} revealed their role!`, {
      duration: 2000,
      position: 'top-center',
    });
  };

  const handleNextPlayer = () => {
    playClickSound();
    nextPlayer();
    toast.success('Passed to next player', {
      duration: 1500,
      position: 'top-center',
    });
  };

  const handleReset = () => {
    playClickSound();
    resetGame();
    stopMusic();
    toast.success('Game reset!', {
      duration: 1500,
      position: 'top-center',
    });
  };

  const handleStartDiscussion = () => {
    playSuccessSound();
    startDiscussion();
    toast.success('Discussion phase started!', {
      duration: 2000,
      position: 'top-center',
    });
  };

  const handleReviewRoles = () => {
    playClickSound();
    reviewRoles();
    toast.success('Back to role review', {
      duration: 1500,
      position: 'top-center',
    });
  };

  const handleViewBoard = () => {
    toggleBoardView();
  };

  const handleCloseModal = () => {
    if (gameState.showBoardDuringReveal) {
      toggleBoardView();
    }
  };

  const handleStartGame = (playerCount, selectedTopic) => {
    initializeGame(playerCount, selectedTopic);
    startMusic();
  };

  const handleGoHome = () => {
    playClickSound();
    if (gameState.gameStarted) {
      if (window.confirm('Leave the game? Progress will be lost.')) {
        resetGame();
        stopMusic();
        navigate('/');
      }
    } else {
      navigate('/');
    }
  };

  if (!gameState.gameStarted) {
    return (
      <>
        <GameSetup
          onStartGame={handleStartGame}
          onToggleFilipino={toggleFilipino}
          isFilipino={gameState.isFilipino}
          onBack={() => navigate('/')}
        />
      </>
    );
  }

  return (
    <>
      <div className="game-screen">
        <div className="game-controls">
          <motion.button
            className="home-btn-small"
            onClick={handleGoHome}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Back to Home"
          >
            <Home size={16} />
          </motion.button>

          <motion.button
            className="music-btn"
            onClick={toggleMusic}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isPlaying ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </motion.button>

          <motion.button
            className="reset-btn"
            onClick={handleReset}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RotateCcw size={16} />
            Reset
          </motion.button>
        </div>

        {/* Show different content based on game phase */}
        {gameState.discussionStarted ? (
          // Discussion Phase: Show word board with review option
          <DiscussionPhase
            gameState={gameState}
            onReviewRoles={handleReviewRoles}
          />
        ) : gameState.allPlayersRevealed && !gameState.isRevealed ? (
          // All players revealed: Show summary and start discussion button
          <AllPlayersRevealed
            gameState={gameState}
            onStartDiscussion={handleStartDiscussion}
            onCheckRoles={handleReviewRoles}
          />
        ) : (
          // Role reveal phase: Show player indicator and reveal system
          <>
            <PlayerIndicator
              currentPlayer={gameState.currentPlayer}
              totalPlayers={gameState.players.length}
              onPreviousPlayer={previousPlayer}
              onNextPlayer={nextPlayer}
              onReturnToSummary={returnToSummary}
              showReturnToSummary={gameState.hasSeenSummary && !gameState.allPlayersRevealed}
            />

            <AnimatePresence mode="wait">
              {!gameState.isRevealed ? (
                <motion.div
                  key="chameleon-icon"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChameleonIcon
                    onLongPress={handleLongPress}
                    disabled={gameState.isRevealed}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="reveal-card"
                  initial={{ opacity: 0, rotateY: -90 }}
                  animate={{ opacity: 1, rotateY: 0 }}
                  exit={{ opacity: 0, rotateY: 90 }}
                  transition={{ duration: 0.5 }}
                >
                  <RevealCard
                    gameState={gameState}
                    onNextPlayer={handleNextPlayer}
                    onViewBoard={handleViewBoard}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Word Board Modal */}
            <WordBoardModal
              isOpen={gameState.showBoardDuringReveal}
              onClose={handleCloseModal}
              gameState={gameState}
            />
          </>
        )}

        <motion.div
          className="game-info"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{
            marginTop: 'auto',
            textAlign: 'center',
            color: 'var(--text-light)',
            fontSize: '0.875rem'
          }}
        >
          <p>Topic: <strong>{gameState.currentTopic?.category}</strong></p>
          <p>{gameState.players.length} players • Local Game</p>
        </motion.div>
      </div>
    </>
  );
}

export default LocalGame;
