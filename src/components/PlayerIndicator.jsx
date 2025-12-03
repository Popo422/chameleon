import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const PlayerIndicator = ({ currentPlayer, totalPlayers, onPreviousPlayer, onNextPlayer, onReturnToSummary, showReturnToSummary }) => {
  return (
    <motion.div 
      className="player-indicator"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="player-number">
        <motion.span
          key={currentPlayer}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          {currentPlayer + 1}
        </motion.span>
      </div>
      <div className="player-info">
        <h2>Player {currentPlayer + 1}</h2>
        <div className="player-controls">
          <button 
            className="nav-btn-small prev-btn"
            onClick={onPreviousPlayer}
            disabled={totalPlayers <= 1}
          >
            <ChevronLeft size={16} />
          </button>
          <p>Your turn to reveal</p>
          <button 
            className="nav-btn-small next-btn"
            onClick={onNextPlayer}
            disabled={totalPlayers <= 1}
          >
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="players-dots">
          {Array.from({ length: totalPlayers }, (_, index) => (
            <motion.div
              key={index}
              className={`dot ${index === currentPlayer ? 'active' : ''}`}
              animate={{
                scale: index === currentPlayer ? 1.2 : 1,
                backgroundColor: index === currentPlayer ? '#10b981' : '#6b7280'
              }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>
        {showReturnToSummary && (
          <motion.button
            className="return-summary-btn"
            onClick={onReturnToSummary}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Back to Summary
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

export default PlayerIndicator;