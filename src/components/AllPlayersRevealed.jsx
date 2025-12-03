import { motion } from 'framer-motion';
import { Users, MessageCircle, Eye } from 'lucide-react';

const AllPlayersRevealed = ({ gameState, onStartDiscussion, onCheckRoles }) => {
  const chameleonCount = gameState.players.filter(p => p.isChameleon).length;
  const regularPlayerCount = gameState.players.length - chameleonCount;

  return (
    <motion.div 
      className="all-players-revealed"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="summary-content">
        <motion.div
          className="summary-icon"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
        >
          <Users size={48} />
        </motion.div>

        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          All Players Revealed!
        </motion.h2>

        <motion.div 
          className="game-summary"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="summary-stats">
            <div className="stat">
              <span className="stat-number">{regularPlayerCount}</span>
              <span className="stat-label">Know the word</span>
            </div>
            <div className="stat chameleon-stat">
              <span className="stat-number">{chameleonCount}</span>
              <span className="stat-label">Chameleon{chameleonCount !== 1 ? 's' : ''}</span>
            </div>
          </div>
          
          <div className="topic-reminder">
            <strong>Topic: {gameState.currentTopic?.category}</strong>
          </div>
        </motion.div>

        <motion.div
          className="instructions"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p>Everyone knows their role!</p>
          <p>Ready to start giving clues and find the chameleon?</p>
        </motion.div>

        <motion.div
          className="summary-actions"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <button
            className="check-roles-btn"
            onClick={onCheckRoles}
          >
            <Eye size={18} />
            Check Roles Again
          </button>
          
          <button
            className="start-discussion-btn"
            onClick={onStartDiscussion}
          >
            <MessageCircle size={18} />
            Start Discussion Phase
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AllPlayersRevealed;