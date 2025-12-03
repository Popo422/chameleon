import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { RotateCcw } from 'lucide-react';

import { useGameState } from './hooks/useGameState';
import GameSetup from './components/GameSetup';
import PlayerIndicator from './components/PlayerIndicator';
import ChameleonIcon from './components/ChameleonIcon';
import RevealCard from './components/RevealCard';
import WordBoard from './components/WordBoard';
import AllPlayersRevealed from './components/AllPlayersRevealed';
import DiscussionPhase from './components/DiscussionPhase';
import WordBoardModal from './components/WordBoardModal';

function App() {
  const { gameState, initializeGame, nextPlayer, previousPlayer, revealForCurrentPlayer, startDiscussion, reviewRoles, returnToSummary, toggleBoardView, resetGame, toggleFilipino } = useGameState();
  
  const handleLongPress = () => {
    if (gameState.isRevealed) return;
    
    revealForCurrentPlayer();
    toast.success(`Player ${gameState.currentPlayer + 1} revealed their role!`, {
      duration: 2000,
      position: 'top-center',
    });
  };

  const handleNextPlayer = () => {
    nextPlayer();
    toast.success('Passed to next player', {
      duration: 1500,
      position: 'top-center',
    });
  };

  const handleReset = () => {
    resetGame();
    toast.success('Game reset!', {
      duration: 1500,
      position: 'top-center',
    });
  };

  const handleStartDiscussion = () => {
    startDiscussion();
    toast.success('Discussion phase started!', {
      duration: 2000,
      position: 'top-center',
    });
  };

  const handleReviewRoles = () => {
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

  if (!gameState.gameStarted) {
    return (
      <>
        <GameSetup 
          onStartGame={initializeGame} 
          onToggleFilipino={toggleFilipino}
          isFilipino={gameState.isFilipino}
        />
        <Toaster />
      </>
    );
  }

  return (
    <>
      <div className="game-screen">
        <motion.button
          className="reset-btn"
          onClick={handleReset}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{ 
            position: 'absolute', 
            top: '1rem', 
            right: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <RotateCcw size={16} />
          Reset
        </motion.button>

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
          <p>{gameState.players.length} players • Round in progress</p>
        </motion.div>
      </div>
      <Toaster />
    </>
  );
}

export default App;
