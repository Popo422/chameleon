import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Users, Plus, LogIn, WifiOff, ArrowRight, ArrowLeft } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { useAuth } from '../../context/AuthContext';
import { useSounds } from '../../hooks/useSounds';
import { getStoredSession } from '../../lib/supabase';
import JoinModal from '../JoinModal';

const HomeScreen = () => {
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [hostName, setHostName] = useState('');
  const [isFilipino, setIsFilipino] = useState(false);
  const [creating, setCreating] = useState(false);

  const { createRoom, error, clearError, authLoading } = useGame();
  const { isAuthenticated } = useAuth();
  const { playClickSound, playSuccessSound } = useSounds();
  const navigate = useNavigate();

  // If anonymous auth failed (e.g. backend unreachable), rooms can't be
  // created or joined — tell the user instead of letting clicks do nothing.
  const backendDown = !authLoading && !isAuthenticated;

  // If the player navigated back here while still in a room (stored session),
  // offer to jump back in rather than silently stranding them.
  const activeSession = getStoredSession();

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setHostName('');
    clearError();
  };

  const handleCreateRoom = async () => {
    if (!hostName.trim()) return;

    setCreating(true);
    playClickSound();

    const result = await createRoom(hostName.trim(), isFilipino);

    if (result.success) {
      playSuccessSound();
      navigate(`/room/${result.roomCode}/lobby`);
    } else {
      toast.error(result.error || 'Failed to create room');
    }

    setCreating(false);
  };

  const handleJoinSuccess = (roomCode) => {
    playSuccessSound();
    navigate(`/room/${roomCode}/lobby`);
  };

  // Show loading while auth initializes
  if (authLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <motion.div
      className="home-screen"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="home-content">
        <button
          className="back-btn"
          onClick={() => {
            playClickSound();
            navigate('/');
          }}
        >
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>

        <motion.div
          className="home-header"
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <img src="/chameleon.png" alt="Chameleon" className="home-logo" />
          <h1>Chameleon</h1>
          <p>The Party Game of Hidden Identities</p>
        </motion.div>

        {activeSession?.roomCode && !backendDown && (
          <motion.button
            className="resume-session-banner"
            onClick={() => {
              playClickSound();
              navigate(`/room/${activeSession.roomCode}/lobby`);
            }}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span>Rejoin room {activeSession.roomCode}</span>
            <ArrowRight size={18} />
          </motion.button>
        )}

        {backendDown && (
          <motion.div
            className="connection-error"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            role="alert"
          >
            <WifiOff size={18} />
            <span>Can't reach the game server. Check your connection and try again.</span>
          </motion.div>
        )}

        <motion.div
          className="home-actions"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <motion.button
            className="home-btn create-btn"
            onClick={() => {
              playClickSound();
              setShowCreateModal(true);
            }}
            disabled={backendDown}
            whileHover={{ scale: backendDown ? 1 : 1.02 }}
            whileTap={{ scale: backendDown ? 1 : 0.98 }}
          >
            <Plus size={24} />
            <span>Create Room</span>
          </motion.button>

          <motion.button
            className="home-btn join-btn"
            onClick={() => {
              playClickSound();
              setShowJoinModal(true);
            }}
            disabled={backendDown}
            whileHover={{ scale: backendDown ? 1 : 1.02 }}
            whileTap={{ scale: backendDown ? 1 : 0.98 }}
          >
            <LogIn size={24} />
            <span>Join Room</span>
          </motion.button>
        </motion.div>

        <motion.div
          className="home-info"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <p>
            <Users size={16} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
            3-8 Players
          </p>
        </motion.div>
      </div>

      {/* Create Room Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCreateModal}
          >
            <motion.div
              className="modal-container create-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>Create Room</h3>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Your Name</label>
                  <input
                    type="text"
                    value={hostName}
                    onChange={(e) => setHostName(e.target.value)}
                    placeholder="Enter your name"
                    maxLength={20}
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label>Language</label>
                  <div className="language-toggle">
                    <button
                      className={`lang-btn ${!isFilipino ? 'active' : ''}`}
                      onClick={() => setIsFilipino(false)}
                    >
                      English
                    </button>
                    <button
                      className={`lang-btn ${isFilipino ? 'active' : ''}`}
                      onClick={() => setIsFilipino(true)}
                    >
                      Filipino
                    </button>
                  </div>
                </div>

                {error && <p className="error-text">{error}</p>}

                <motion.button
                  className="modal-submit-btn"
                  onClick={handleCreateRoom}
                  disabled={!hostName.trim() || creating}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {creating ? 'Creating...' : 'Create Room'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Join Room Modal */}
      <JoinModal
        isOpen={showJoinModal}
        onClose={() => {
          setShowJoinModal(false);
          clearError();
        }}
        onSuccess={handleJoinSuccess}
      />
    </motion.div>
  );
};

export default HomeScreen;
