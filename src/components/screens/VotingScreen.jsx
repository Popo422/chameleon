import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Clock, Check, AlertCircle } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { useSounds } from '../../hooks/useSounds';

const VotingScreen = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [confirming, setConfirming] = useState(false);

  const {
    room,
    players,
    currentPlayer,
    isHost,
    isChameleon,
    roomCode,
    roomStatus,
    authLoading,
    voting,
    rejoinRoom,
    endVotingPhase,
  } = useGame();

  const { timeRemaining, hasVoted, votedFor, castVote, loading } = voting;
  const { playClickSound, playSuccessSound } = useSounds();

  // Handle rejoining
  useEffect(() => {
    if (authLoading) return;
    if (!room && code) {
      rejoinRoom(code).then((result) => {
        if (!result.success) {
          navigate('/');
        }
      });
    }
  }, [code, room, rejoinRoom, navigate, authLoading]);

  // Navigate based on room status (only when room is loaded)
  useEffect(() => {
    if (!room || !roomCode) return; // Don't navigate until room is loaded

    if (roomStatus === 'lobby') {
      navigate(`/room/${roomCode}/lobby`, { replace: true });
    } else if (roomStatus === 'playing') {
      navigate(`/room/${roomCode}/game`, { replace: true });
    } else if (roomStatus === 'results') {
      navigate(`/room/${roomCode}/results`, { replace: true });
    }
  }, [room, roomStatus, roomCode, navigate]);

  // Auto-end voting when timer reaches 0 (only host triggers to prevent race conditions)
  useEffect(() => {
    if (timeRemaining === 0 && roomStatus === 'voting' && isHost) {
      // Only host ends voting to prevent multiple clients from calling simultaneously
      const timeout = setTimeout(() => {
        if (roomStatus === 'voting') {
          endVotingPhase();
        }
      }, 500); // Small delay to ensure all votes are processed

      return () => clearTimeout(timeout);
    }
  }, [timeRemaining, roomStatus, endVotingPhase, isHost]);

  const formatTime = (ms) => {
    if (ms === null) return '--:--';
    const seconds = Math.ceil(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectPlayer = (playerId) => {
    if (hasVoted || playerId === currentPlayer?.id) return;
    playClickSound();
    setSelectedPlayer(playerId);
    setConfirming(true);
  };

  const handleConfirmVote = async () => {
    if (!selectedPlayer || hasVoted) return;

    playClickSound();
    const result = await castVote(selectedPlayer);

    if (result.success) {
      playSuccessSound();
      toast.success('Vote submitted!');
      setConfirming(false);
    } else {
      toast.error(result.error || 'Failed to submit vote');
    }
  };

  const handleCancelVote = () => {
    playClickSound();
    setSelectedPlayer(null);
    setConfirming(false);
  };

  const handleEndVoting = async () => {
    playClickSound();
    const result = await endVotingPhase();
    if (!result.success) {
      toast.error(result.error || 'Failed to end voting');
    }
  };

  const votedCount = players.filter((p) => p.vote_target_id !== null).length;
  const otherPlayers = players.filter((p) => p.id !== currentPlayer?.id);
  const votedForPlayer = players.find((p) => p.id === votedFor);

  if (authLoading || !room) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <motion.div
      className="voting-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Timer Header */}
      <div className="voting-header">
        <div className={`timer ${timeRemaining !== null && timeRemaining < 10000 ? 'urgent' : ''}`}>
          <Clock size={24} />
          <span>{formatTime(timeRemaining)}</span>
        </div>

        <h2>Who is the Chameleon?</h2>

        <div className="vote-progress">
          {votedCount}/{players.length} voted
        </div>
      </div>

      {/* Voting Content */}
      <div className="voting-content">
        {hasVoted ? (
          // Already voted - show waiting state
          <motion.div
            className="voted-section"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="vote-confirmed">
              <Check size={48} className="check-icon" />
              <h3>Vote Submitted!</h3>
              <p>You voted for <strong>{votedForPlayer?.name}</strong></p>
            </div>

            <div className="waiting-others">
              <div className="waiting-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <p>Waiting for other players...</p>
              <p className="vote-count">{votedCount}/{players.length} have voted</p>
            </div>

            {isChameleon && (
              <div className="chameleon-reminder">
                <AlertCircle size={20} />
                <span>Remember: You're the Chameleon!</span>
              </div>
            )}
          </motion.div>
        ) : (
          // Voting interface
          <motion.div
            className="vote-section"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="vote-instruction">
              Select who you think is the Chameleon
            </p>

            <div className="vote-options">
              <AnimatePresence mode="popLayout">
                {otherPlayers.map((player, index) => (
                  <motion.button
                    key={player.id}
                    className={`vote-option ${selectedPlayer === player.id ? 'selected' : ''}`}
                    onClick={() => handleSelectPlayer(player.id)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    layout
                  >
                    <div className="vote-avatar">
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="vote-name">{player.name}</span>
                    {selectedPlayer === player.id && (
                      <motion.div
                        className="selected-indicator"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      >
                        <Check size={16} />
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>

            {isChameleon && (
              <div className="chameleon-hint">
                <AlertCircle size={16} />
                <span>Tip: Vote for someone to avoid suspicion!</span>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Confirm Vote Modal */}
      <AnimatePresence>
        {confirming && !hasVoted && (
          <motion.div
            className="confirm-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCancelVote}
          >
            <motion.div
              className="confirm-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Confirm Vote</h3>
              <p>
                Vote for <strong>{players.find((p) => p.id === selectedPlayer)?.name}</strong>?
              </p>
              <p className="confirm-warning">You cannot change your vote!</p>

              <div className="confirm-actions">
                <motion.button
                  className="cancel-btn"
                  onClick={handleCancelVote}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  className="confirm-btn"
                  onClick={handleConfirmVote}
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {loading ? 'Voting...' : 'Confirm Vote'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Host Controls */}
      {isHost && (
        <motion.div
          className="host-controls"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.button
            className="end-voting-btn"
            onClick={handleEndVoting}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            End Voting Now
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default VotingScreen;
