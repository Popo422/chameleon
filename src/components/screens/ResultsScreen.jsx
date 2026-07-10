import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Trophy, Frown, RotateCcw, Home, Eye } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { useSounds } from '../../hooks/useSounds';
import confetti from 'canvas-confetti';

const ResultsScreen = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  const {
    room,
    players,
    currentPlayer,
    isHost,
    roomCode,
    roomStatus,
    authLoading,
    voting,
    rejoinRoom,
    newRound,
    leaveRoom,
  } = useGame();

  const { playSuccessSound } = useSounds();

  // getResults()/voting change identity every render; keep a stable ref so the
  // results effect can depend only on the room id and run exactly once.
  const votingRef = useRef(voting);
  useEffect(() => {
    votingRef.current = voting;
  });
  const fetchedRef = useRef(false);

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

  // Fetch results once when the room is available. Guarded so it never loops
  // (previously re-fired on every render because `voting` identity changed,
  // spamming DB reads + confetti/sound).
  useEffect(() => {
    if (!room || !currentPlayer || fetchedRef.current) return;
    fetchedRef.current = true;

    (async () => {
      const { results: voteResults } = await votingRef.current.getResults();
      setResults(voteResults);
      setLoading(false);

      if (voteResults) {
        // Derive chameleon status from the authoritative results payload, not
        // from context isChameleon (which can be stale/false on a refresh).
        const iAmChameleon = voteResults.chameleonId === currentPlayer.id;
        const playerWon = (iAmChameleon && !voteResults.chameleonCaught) ||
                         (!iAmChameleon && voteResults.chameleonCaught);
        if (playerWon) {
          playSuccessSound();
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
      }
    })();
  }, [room?.id, currentPlayer?.id, playSuccessSound]);

  // Navigate based on room status (only when room is loaded)
  useEffect(() => {
    if (!room || !roomCode) return; // Don't navigate until room is loaded

    if (roomStatus === 'lobby') {
      navigate(`/room/${roomCode}/lobby`, { replace: true });
    } else if (roomStatus === 'playing') {
      navigate(`/room/${roomCode}/game`, { replace: true });
    } else if (roomStatus === 'voting') {
      navigate(`/room/${roomCode}/vote`, { replace: true });
    }
  }, [room, roomStatus, roomCode, navigate]);

  const handleNewRound = async () => {
    const result = await newRound();
    if (result.success) {
      toast.success('New round starting!');
    } else {
      toast.error('Failed to start new round');
    }
  };

  const handleGoHome = () => {
    if (window.confirm('Leave the room?')) {
      leaveRoom();
    }
  };

  if (authLoading || !room || loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Calculating results...</p>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="error-screen">
        <p>Error loading results</p>
        <button onClick={() => navigate(`/room/${roomCode || code}/lobby`)}>
          Return to Lobby
        </button>
      </div>
    );
  }

  const {
    accusedPlayers,
    isTie,
    chameleonName,
    chameleonCaught,
    secretWord,
    voteCounts,
  } = results;

  // Use the authoritative results payload for the current player's role so a
  // refresh/late-mount can't show the wrong "You Won/Lost" (stale isChameleon).
  const iAmChameleon = results.chameleonId === currentPlayer?.id;
  const playerWon = (iAmChameleon && !chameleonCaught) || (!iAmChameleon && chameleonCaught);

  return (
    <motion.div
      className="results-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Result Header */}
      <motion.div
        className={`result-header ${chameleonCaught ? 'caught' : 'escaped'}`}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {chameleonCaught ? (
          <>
            <Trophy size={60} className="result-icon" />
            <h2>Chameleon Caught!</h2>
            <p>The team found the Chameleon!</p>
          </>
        ) : (
          <>
            <Eye size={60} className="result-icon" />
            <h2>Chameleon Escapes!</h2>
            <p>The Chameleon stayed hidden!</p>
          </>
        )}
      </motion.div>

      {/* Personal Result */}
      <motion.div
        className={`personal-result ${playerWon ? 'won' : 'lost'}`}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {playerWon ? (
          <>
            <Trophy size={24} />
            <span>You Won!</span>
          </>
        ) : (
          <>
            <Frown size={24} />
            <span>You Lost</span>
          </>
        )}
      </motion.div>

      {/* Reveal Section */}
      <motion.div
        className="reveal-section"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <div className="chameleon-reveal">
          <h3>The Chameleon was...</h3>
          <div className="chameleon-name">
            <div className="avatar chameleon-avatar">
              {chameleonName.charAt(0).toUpperCase()}
            </div>
            <span>{chameleonName}</span>
            {iAmChameleon && <span className="you-tag">(You)</span>}
          </div>
        </div>

        <div className="secret-reveal">
          <h3>The Secret Word was...</h3>
          <div className="secret-word-display">
            {secretWord}
          </div>
        </div>
      </motion.div>

      {/* Vote Breakdown */}
      <motion.div
        className="vote-breakdown"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <h3>Vote Results</h3>
        {isTie && <p className="tie-notice">It was a tie!</p>}

        <div className="vote-bars">
          {players.map((player) => {
            const voteCount = voteCounts[player.id] || 0;
            // Bar width is share of votes actually cast (not of player count),
            // so the leader's bar fills. Guard against divide-by-zero.
            const percentage = results.totalVotes > 0
              ? (voteCount / results.totalVotes) * 100
              : 0;
            const isAccused = accusedPlayers.some((a) => a.id === player.id);
            const isChameleonPlayer = player.id === results.chameleonId;

            return (
              <motion.div
                key={player.id}
                className={`vote-bar-item ${isAccused ? 'accused' : ''} ${isChameleonPlayer ? 'is-chameleon' : ''}`}
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
              >
                <div className="vote-bar-info">
                  <span className="vote-player-name">
                    {player.name}
                    {isChameleonPlayer && ' (Chameleon)'}
                    {player.id === currentPlayer?.id && ' (You)'}
                  </span>
                  <span className="vote-count">{voteCount} votes</span>
                </div>
                <div className="vote-bar-bg">
                  <motion.div
                    className="vote-bar-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ delay: 1, duration: 0.5 }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        className="result-actions"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1 }}
      >
        {isHost ? (
          <motion.button
            className="new-round-btn"
            onClick={handleNewRound}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <RotateCcw size={20} />
            New Round
          </motion.button>
        ) : (
          <p className="host-note">Waiting for host to start new round...</p>
        )}

        <motion.button
          className="home-btn"
          onClick={handleGoHome}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Home size={20} />
          Leave Game
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default ResultsScreen;
