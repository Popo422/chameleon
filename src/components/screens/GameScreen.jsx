import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { RotateCcw, Volume2, VolumeX, Users, MessageCircle } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { useSounds } from '../../hooks/useSounds';
import { useBackgroundMusic } from '../../hooks/useBackgroundMusic';
import ChameleonIcon from '../ChameleonIcon';
import RevealCard from '../RevealCard';
import WordBoard from '../WordBoard';
import WordBoardModal from '../WordBoardModal';
import PlayerList from '../PlayerList';

const GameScreen = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const [showBoard, setShowBoard] = useState(false);
  const [showPlayerList, setShowPlayerList] = useState(false);

  const {
    room,
    players,
    currentPlayer,
    isHost,
    hasRevealed,
    allPlayersRevealed,
    isChameleon,
    roomCode,
    roomStatus,
    secretWord,
    diceResult,
    authLoading,
    getCurrentTopic,
    rejoinRoom,
    reveal,
    startVotingPhase,
    leaveRoom,
  } = useGame();

  const { playClickSound, playRevealSound, playSuccessSound } = useSounds();
  const { isPlaying, toggleMusic, startMusic } = useBackgroundMusic();

  const topic = getCurrentTopic();

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

  // Start music on game start
  useEffect(() => {
    startMusic();
  }, [startMusic]);

  // Navigate based on room status
  useEffect(() => {
    if (roomStatus === 'lobby') {
      navigate(`/room/${roomCode}/lobby`);
    } else if (roomStatus === 'voting') {
      navigate(`/room/${roomCode}/vote`);
    } else if (roomStatus === 'results') {
      navigate(`/room/${roomCode}/results`);
    }
  }, [roomStatus, roomCode, navigate]);

  const handleReveal = async () => {
    if (hasRevealed) return;

    playRevealSound();
    const result = await reveal();

    if (result.success) {
      toast.success('Role revealed!', { duration: 1500 });
    }
  };

  const handleStartVoting = async () => {
    playClickSound();
    const result = await startVotingPhase(60); // 60 second voting

    if (result.success) {
      playSuccessSound();
      toast.success('Voting started!');
    } else {
      toast.error(result.error || 'Failed to start voting');
    }
  };

  const handleLeave = () => {
    playClickSound();
    if (window.confirm('Leave the game? You can rejoin with the room code.')) {
      leaveRoom();
    }
  };

  const revealedCount = players.filter((p) => p.has_revealed).length;

  if (authLoading || !room || !topic) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading game...</p>
      </div>
    );
  }

  return (
    <motion.div
      className="game-screen online-game"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header Controls */}
      <div className="game-controls">
        <motion.button
          className="music-btn"
          onClick={toggleMusic}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isPlaying ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </motion.button>

        <motion.button
          className="players-btn"
          onClick={() => setShowPlayerList(!showPlayerList)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Users size={16} />
          <span>{revealedCount}/{players.length}</span>
        </motion.button>

        <motion.button
          className="reset-btn"
          onClick={handleLeave}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <RotateCcw size={16} />
          Leave
        </motion.button>
      </div>

      {/* Player List Dropdown */}
      <AnimatePresence>
        {showPlayerList && (
          <motion.div
            className="player-list-dropdown"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <h4>Players</h4>
            <div className="player-reveal-list">
              {players.map((player) => (
                <div
                  key={player.id}
                  className={`player-reveal-item ${player.has_revealed ? 'revealed' : ''}`}
                >
                  <span>{player.name}</span>
                  <span className="reveal-status">
                    {player.has_revealed ? 'Revealed' : 'Waiting...'}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Game Content */}
      <div className="game-content">
        {!hasRevealed ? (
          // Player hasn't revealed yet
          <motion.div
            className="reveal-section"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="reveal-header">
              <h2>Your Turn</h2>
              <p>Hold the chameleon to reveal your role</p>
            </div>

            <ChameleonIcon onLongPress={handleReveal} disabled={hasRevealed} />

            <div className="reveal-progress">
              <p>{revealedCount} of {players.length} players revealed</p>
            </div>
          </motion.div>
        ) : !allPlayersRevealed ? (
          // Player revealed, waiting for others
          <motion.div
            className="waiting-section"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <RevealCard
              isChameleon={isChameleon}
              secretWord={secretWord}
              topic={topic}
              showNextButton={false}
            />

            <div className="waiting-others">
              <div className="waiting-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <p>Waiting for other players to reveal...</p>
              <p className="reveal-count">{revealedCount}/{players.length} revealed</p>
            </div>

            <motion.button
              className="view-board-btn"
              onClick={() => setShowBoard(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              View Word Board
            </motion.button>
          </motion.div>
        ) : (
          // All players revealed - discussion time
          <motion.div
            className="discussion-section"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="discussion-header">
              <MessageCircle size={40} className="discussion-icon" />
              <h2>Discussion Time</h2>
              <p>Talk about the topic and find the Chameleon!</p>
            </div>

            <div className="your-role-reminder">
              {isChameleon ? (
                <div className="role-badge chameleon">
                  You are the Chameleon - Blend in!
                </div>
              ) : (
                <div className="role-badge normal">
                  Secret Word: <strong>{secretWord}</strong>
                </div>
              )}
            </div>

            <WordBoard
              topic={topic}
              diceResult={diceResult}
              showSecret={!isChameleon}
            />

            <div className="discussion-tips">
              <p>Tips:</p>
              <ul>
                <li>Give clues that relate to the secret word</li>
                <li>Watch for players who give vague clues</li>
                <li>The Chameleon wins by staying hidden!</li>
              </ul>
            </div>

            {isHost && (
              <motion.button
                className="start-voting-btn"
                onClick={handleStartVoting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Start Voting
              </motion.button>
            )}

            {!isHost && (
              <p className="host-control-note">
                The host will start voting when ready
              </p>
            )}
          </motion.div>
        )}
      </div>

      {/* Topic Info */}
      <motion.div
        className="game-info"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <p>Topic: <strong>{topic.category}</strong></p>
      </motion.div>

      {/* Word Board Modal */}
      <WordBoardModal
        isOpen={showBoard}
        onClose={() => setShowBoard(false)}
        topic={topic}
        diceResult={diceResult}
        showSecret={!isChameleon && hasRevealed}
      />
    </motion.div>
  );
};

export default GameScreen;
