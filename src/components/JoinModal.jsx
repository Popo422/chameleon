import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useSounds } from '../hooks/useSounds';
import { normalizeRoomCode, isValidRoomCode } from '../utils/roomCode';

const JoinModal = ({ isOpen, onClose, onSuccess, initialCode = '' }) => {
  const [roomCode, setRoomCode] = useState(initialCode);
  const [playerName, setPlayerName] = useState('');
  const [joining, setJoining] = useState(false);
  const [localError, setLocalError] = useState('');

  const { joinRoom, error } = useGame();
  const { playClickSound } = useSounds();

  const handleCodeChange = (e) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setRoomCode(value);
    setLocalError('');
  };

  const handleJoin = async () => {
    setLocalError('');

    if (!roomCode.trim()) {
      setLocalError('Please enter a room code');
      return;
    }

    if (!isValidRoomCode(roomCode)) {
      setLocalError('Invalid room code format');
      return;
    }

    if (!playerName.trim()) {
      setLocalError('Please enter your name');
      return;
    }

    setJoining(true);
    playClickSound();

    const normalizedCode = normalizeRoomCode(roomCode);
    const result = await joinRoom(normalizedCode, playerName.trim());

    if (result.success) {
      onSuccess(normalizedCode);
      // Reset form
      setRoomCode('');
      setPlayerName('');
    } else {
      setLocalError(result.error);
    }

    setJoining(false);
  };

  const handleClose = () => {
    setRoomCode(initialCode);
    setPlayerName('');
    setLocalError('');
    onClose();
  };

  const displayError = localError || error;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="modal-container join-modal"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Join Room</h3>
              <button className="modal-close-btn" onClick={handleClose}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Room Code</label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={handleCodeChange}
                  placeholder="Enter 6-character code"
                  maxLength={6}
                  className="room-code-input"
                  autoFocus={!initialCode}
                />
              </div>

              <div className="form-group">
                <label>Your Name</label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => {
                    setPlayerName(e.target.value);
                    setLocalError('');
                  }}
                  placeholder="Enter your name"
                  maxLength={20}
                  autoFocus={!!initialCode}
                />
              </div>

              {displayError && <p className="error-text">{displayError}</p>}

              <motion.button
                className="modal-submit-btn"
                onClick={handleJoin}
                disabled={!roomCode.trim() || !playerName.trim() || joining}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {joining ? 'Joining...' : 'Join Game'}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default JoinModal;
