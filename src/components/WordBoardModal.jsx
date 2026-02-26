import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import WordBoard from './WordBoard';

const WordBoardModal = ({
  isOpen,
  onClose,
  // New online mode props
  topic,
  diceResult,
  showSecret,
  // Legacy local mode props
  gameState
}) => {
  if (!isOpen) return null;

  // Support both old and new prop patterns
  const actualTopic = topic ?? gameState?.currentTopic;
  const actualDiceResult = diceResult ?? gameState?.diceResult;

  // For local game mode, derive showSecret from gameState
  // Show secret if: explicit prop is true, OR in local mode and current player is not the chameleon
  const actualShowSecret = showSecret ?? (
    gameState
      ? !gameState.players[gameState.currentPlayer]?.isChameleon
      : false
  );

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        {/* Modal */}
        <motion.div
          className="modal-container"
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ duration: 0.3 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h3>Word Board</h3>
            <button className="modal-close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          <div className="modal-content">
            <WordBoard
              topic={actualTopic}
              diceResult={actualDiceResult}
              showSecret={actualShowSecret}
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default WordBoardModal;
