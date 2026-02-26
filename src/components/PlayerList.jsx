import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Wifi, WifiOff, X } from 'lucide-react';
import { useGame } from '../context/GameContext';

const PlayerList = ({ showKickButton = false, compact = false }) => {
  const { players, currentPlayer, isHost, kickPlayer } = useGame();

  const handleKick = async (playerId, playerName) => {
    if (window.confirm(`Remove ${playerName} from the room?`)) {
      await kickPlayer(playerId);
    }
  };

  if (compact) {
    return (
      <div className="player-list-compact">
        {players.map((player, index) => (
          <motion.div
            key={player.id}
            className={`player-dot ${player.id === currentPlayer?.id ? 'current' : ''} ${
              player.is_connected ? 'online' : 'offline'
            }`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.05 }}
            title={player.name}
          >
            {player.is_host && <Crown size={10} className="host-crown" />}
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div className="player-list">
      <AnimatePresence mode="popLayout">
        {players.map((player, index) => (
          <motion.div
            key={player.id}
            className={`player-item ${player.id === currentPlayer?.id ? 'current' : ''}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ delay: index * 0.05 }}
            layout
          >
            <div className="player-info-row">
              <div className="player-avatar">
                {player.name.charAt(0).toUpperCase()}
              </div>
              <div className="player-details">
                <span className="player-name">
                  {player.name}
                  {player.id === currentPlayer?.id && ' (You)'}
                </span>
                <span className="player-status">
                  {player.is_connected ? (
                    <>
                      <Wifi size={12} className="status-icon online" />
                      Online
                    </>
                  ) : (
                    <>
                      <WifiOff size={12} className="status-icon offline" />
                      Offline
                    </>
                  )}
                </span>
              </div>
              {player.is_host && (
                <div className="host-badge">
                  <Crown size={14} />
                  Host
                </div>
              )}
            </div>

            {showKickButton && isHost && player.id !== currentPlayer?.id && (
              <motion.button
                className="kick-btn"
                onClick={() => handleKick(player.id, player.name)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title={`Remove ${player.name}`}
              >
                <X size={16} />
              </motion.button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default PlayerList;
