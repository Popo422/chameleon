import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Smartphone, Wifi, Users } from 'lucide-react';
import { useSounds } from '../hooks/useSounds';

const ModeSelect = () => {
  const navigate = useNavigate();
  const { playClickSound } = useSounds();

  const handleSelectMode = (mode) => {
    playClickSound();
    navigate(mode === 'local' ? '/local' : '/online');
  };

  return (
    <motion.div
      className="mode-select"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mode-select-content">
        <motion.div
          className="mode-header"
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <img src="/chameleon.png" alt="Chameleon" className="mode-logo" />
          <h1>Chameleon</h1>
          <p>The Party Game of Hidden Identities</p>
        </motion.div>

        <motion.div
          className="mode-options"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <motion.button
            className="mode-card local"
            onClick={() => handleSelectMode('local')}
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="mode-icon">
              <Smartphone size={40} />
            </div>
            <h2>Local Game</h2>
            <p>Pass the phone between players</p>
            <div className="mode-features">
              <span><Users size={14} /> 3-8 Players</span>
              <span>Same Device</span>
            </div>
          </motion.button>

          <motion.button
            className="mode-card online"
            onClick={() => handleSelectMode('online')}
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="mode-icon">
              <Wifi size={40} />
            </div>
            <h2>Online Game</h2>
            <p>Play on your own devices</p>
            <div className="mode-features">
              <span><Users size={14} /> 3-8 Players</span>
              <span>Room Codes</span>
            </div>
          </motion.button>
        </motion.div>

        <motion.p
          className="mode-hint"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          Choose how you want to play!
        </motion.p>
      </div>
    </motion.div>
  );
};

export default ModeSelect;
