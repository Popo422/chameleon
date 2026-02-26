import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserX } from 'lucide-react';

const AUTO_REDIRECT_SECONDS = 10;

const KickedModal = ({ isOpen, onClose }) => {
  const [countdown, setCountdown] = useState(AUTO_REDIRECT_SECONDS);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(AUTO_REDIRECT_SECONDS);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="modal-container kicked-modal"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="kicked-icon">
              <UserX size={48} />
            </div>

            <h3>You've Been Kicked</h3>
            <p>The host has removed you from the room.</p>
            <p className="countdown-text">Redirecting in {countdown}s...</p>

            <motion.button
              className="modal-submit-btn"
              onClick={onClose}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Back to Home
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default KickedModal;
