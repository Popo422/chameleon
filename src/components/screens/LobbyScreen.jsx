import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Copy, Check, Share2, Play, LogOut, Settings } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { useSounds } from '../../hooks/useSounds';
import PlayerList from '../PlayerList';
import topicsData from '../../data/topics.json';

const LobbyScreen = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const rejoinAttemptedRef = useRef(false);

  const {
    room,
    players,
    isHost,
    isFilipino,
    selectedTopic,
    loading,
    roomCode,
    roomStatus,
    authLoading,
    rejoinRoom,
    leaveRoom,
    toggleFilipino,
    setSelectedTopic,
    startGame,
  } = useGame();

  const { playClickSound, playSuccessSound } = useSounds();

  // Handle rejoining if we're authenticated but not in room yet
  useEffect(() => {
    if (authLoading) return; // Wait for auth
    if (!code) {
      // No room code in URL - redirect to home
      navigate('/', { replace: true });
      return;
    }
    if (!room && !rejoinAttemptedRef.current) {
      rejoinAttemptedRef.current = true;
      rejoinRoom(code)
        .then((result) => {
          if (!result.success) {
            navigate(`/join/${code}`, { replace: true });
          }
        })
        .catch(() => {
          navigate(`/join/${code}`, { replace: true });
        });
    }
  }, [code, room, rejoinRoom, navigate, authLoading]);

  // Navigate when game starts (only when room is loaded)
  useEffect(() => {
    if (!room || !roomCode) return; // Don't navigate until room is loaded

    if (roomStatus === 'playing') {
      navigate(`/room/${roomCode}/game`, { replace: true });
    }
  }, [room, roomStatus, roomCode, navigate]);

  const shareUrl = `${window.location.origin}/room/${roomCode}`;
  const availableTopics = isFilipino ? topicsData.filipinoTopics : topicsData.topics;

  const handleCopyCode = async () => {
    playClickSound();
    await navigator.clipboard.writeText(roomCode);
    setCopied(true);
    toast.success('Room code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    playClickSound();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my Chameleon game!',
          text: `Join my game with code: ${roomCode}`,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or share failed
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link copied!');
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied!');
    }
  };

  const handleStartGame = async () => {
    if (players.length < 3) {
      toast.error('Need at least 3 players to start');
      return;
    }

    playClickSound();
    const result = await startGame();

    if (result.success) {
      playSuccessSound();
    } else {
      toast.error(result.error || 'Failed to start game');
    }
  };

  const handleLeave = () => {
    playClickSound();
    if (window.confirm('Are you sure you want to leave the room?')) {
      leaveRoom();
    }
  };

  if (authLoading || !room) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Connecting to room...</p>
      </div>
    );
  }

  return (
    <motion.div
      className="lobby-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="lobby-header">
        <motion.button
          className="leave-btn"
          onClick={handleLeave}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <LogOut size={18} />
        </motion.button>

        <div className="room-code-display">
          <span className="room-code-label">Room Code</span>
          <div className="room-code-value">
            <span>{roomCode}</span>
            <motion.button
              className="copy-btn"
              onClick={handleCopyCode}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </motion.button>
          </div>
        </div>

        <motion.button
          className="share-btn"
          onClick={handleShare}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Share2 size={18} />
        </motion.button>
      </div>

      <div className="lobby-content">
        <div className="players-section">
          <h3>Players ({players.length}/8)</h3>
          <PlayerList showKickButton={isHost} />

          {players.length < 3 && (
            <p className="min-players-warning">
              Need at least 3 players to start
            </p>
          )}
        </div>

        {isHost && (
          <motion.div
            className="settings-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="settings-header" onClick={() => setShowSettings(!showSettings)}>
              <Settings size={18} />
              <span>Game Settings</span>
            </div>

            {showSettings && (
              <motion.div
                className="settings-content"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
              >
                <div className="setting-item">
                  <label>Language</label>
                  <div className="language-toggle">
                    <button
                      className={`lang-btn ${!isFilipino ? 'active' : ''}`}
                      onClick={() => {
                        playClickSound();
                        if (isFilipino) toggleFilipino();
                      }}
                    >
                      English
                    </button>
                    <button
                      className={`lang-btn ${isFilipino ? 'active' : ''}`}
                      onClick={() => {
                        playClickSound();
                        if (!isFilipino) toggleFilipino();
                      }}
                    >
                      Filipino
                    </button>
                  </div>
                </div>

                <div className="setting-item">
                  <label>Topic</label>
                  <select
                    className="topic-dropdown"
                    value={selectedTopic === null ? 'random' : selectedTopic}
                    onChange={(e) => {
                      playClickSound();
                      const value = e.target.value;
                      setSelectedTopic(value === 'random' ? null : parseInt(value));
                    }}
                  >
                    <option value="random">Random Topic</option>
                    {availableTopics.map((topic, index) => (
                      <option key={index} value={index}>
                        {topic.category}
                      </option>
                    ))}
                  </select>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        <div className="lobby-actions">
          {isHost ? (
            <motion.button
              className="start-game-btn"
              onClick={handleStartGame}
              disabled={players.length < 3 || loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Play size={20} />
              {loading ? 'Starting...' : 'Start Game'}
            </motion.button>
          ) : (
            <div className="waiting-message">
              <div className="waiting-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <p>Waiting for host to start the game...</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default LobbyScreen;
