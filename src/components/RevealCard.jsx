import { motion } from 'framer-motion';
import { Eye, EyeOff, Grid3X3 } from 'lucide-react';

const RevealCard = ({
  // New online mode props
  isChameleon,
  secretWord,
  topic,
  showNextButton = true,
  // Legacy local mode props (for backwards compatibility)
  gameState,
  onNextPlayer,
  onViewBoard
}) => {
  // Support both old and new prop patterns
  const isActuallyChameleon = isChameleon ?? gameState?.players[gameState?.currentPlayer]?.isChameleon;
  const actualSecretWord = secretWord ?? gameState?.secretWord;
  const actualTopic = topic ?? gameState?.currentTopic;

  return (
    <motion.div
      className="reveal-card"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3 }}
    >
      <div className="card-content">
        {isActuallyChameleon ? (
          <motion.div
            className="chameleon-reveal"
            initial={{ rotateY: -90 }}
            animate={{ rotateY: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="role-icon chameleon">
              <EyeOff size={32} />
            </div>
            <h2>You are the CHAMELEON!</h2>
            <p>You don't know the secret word.</p>
            <p>Try to blend in and figure out what it is!</p>
            {actualTopic && (
              <div className="topic-info">
                <strong>Topic: {actualTopic.category}</strong>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            className="word-reveal"
            initial={{ rotateY: -90 }}
            animate={{ rotateY: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="role-icon normal">
              <Eye size={32} />
            </div>
            <h2>You know the word!</h2>
            <div className="secret-word">
              {actualSecretWord}
            </div>
            <p>Give clues without being too obvious!</p>
            {actualTopic && (
              <div className="topic-info">
                <strong>Topic: {actualTopic.category}</strong>
              </div>
            )}
          </motion.div>
        )}

        {(showNextButton || onViewBoard || onNextPlayer) && (
          <motion.div
            className="reveal-actions"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {onViewBoard && (
              <button
                className="view-board-btn"
                onClick={onViewBoard}
              >
                <Grid3X3 size={18} />
                View Word Board
              </button>
            )}

            {onNextPlayer && showNextButton && (
              <button
                className="next-btn"
                onClick={onNextPlayer}
              >
                Pass to Next Player
              </button>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default RevealCard;
