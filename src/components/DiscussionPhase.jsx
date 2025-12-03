import { motion } from 'framer-motion';
import { Users, MessageCircle } from 'lucide-react';
import WordBoard from './WordBoard';

const DiscussionPhase = ({ gameState, onReviewRoles }) => {
  return (
    <motion.div 
      className="discussion-phase"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className="discussion-header"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="phase-icon">
          <MessageCircle size={32} />
        </div>
        <h3>Discussion Phase</h3>
        <p>Give clues and find the chameleon!</p>
      </motion.div>

      <WordBoard 
        topic={gameState.currentTopic}
        secretWord={gameState.secretWord}
        diceResult={gameState.diceResult}
        showSecret={false}
      />

      <motion.div 
        className="discussion-controls"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <button
          className="review-roles-btn"
          onClick={onReviewRoles}
        >
          <Users size={18} />
          Review Roles
        </button>
        
        <div className="discussion-tips">
          <p><strong>Tips:</strong></p>
          <ul>
            <li>Give clues related to the secret word</li>
            <li>Don't be too obvious!</li>
            <li>Watch for suspicious behavior</li>
          </ul>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DiscussionPhase;