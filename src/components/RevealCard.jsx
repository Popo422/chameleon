import { motion } from 'framer-motion';
import { Eye, EyeOff, Grid3X3 } from 'lucide-react';

const RevealCard = ({ gameState, onNextPlayer, onViewBoard }) => {
  const currentPlayerData = gameState.players[gameState.currentPlayer];
  const isChameleon = currentPlayerData?.isChameleon;

  return (
    <motion.div 
      className="reveal-card"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3 }}
    >
      <div className="card-content">
        {isChameleon ? (
          <motion.div 
            className="chameleon-reveal"
            initial={{ rotateY: -90 }}
            animate={{ rotateY: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="role-icon chameleon">
              <EyeOff size={48} />
            </div>
            <h2>You are the CHAMELEON!</h2>
            <p>You don't know the secret word.</p>
            <p>Try to blend in and figure out what it is!</p>
            <div className="topic-info">
              <strong>Topic: {gameState.currentTopic.category}</strong>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            className="word-reveal"
            initial={{ rotateY: -90 }}
            animate={{ rotateY: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="role-icon normal">
              <Eye size={48} />
            </div>
            <h2>You know the word!</h2>
            <div className="secret-word">
              {gameState.secretWord}
            </div>
            <p>Give clues without being too obvious!</p>
            <div className="topic-info">
              <strong>Topic: {gameState.currentTopic.category}</strong>
            </div>
          </motion.div>
        )}
        
        <motion.div
          className="reveal-actions"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <button
            className="view-board-btn"
            onClick={onViewBoard}
          >
            <Grid3X3 size={18} />
            View Word Board
          </button>
          
          <button
            className="next-btn"
            onClick={onNextPlayer}
          >
            Pass to Next Player
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default RevealCard;