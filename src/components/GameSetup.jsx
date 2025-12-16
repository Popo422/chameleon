import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSounds } from '../hooks/useSounds';
import topicsData from '../data/topics.json';

const GameSetup = ({ onStartGame, onToggleFilipino, isFilipino }) => {
  const [playerCount, setPlayerCount] = useState(4);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const { playClickSound, playSuccessSound } = useSounds();

  const availableTopics = isFilipino ? topicsData.filipinoTopics : topicsData.topics;

  const handleStart = () => {
    playSuccessSound();
    onStartGame(playerCount, selectedTopic);
  };

  const handlePlayerSelect = (num) => {
    playClickSound();
    setPlayerCount(num);
  };

  const handleFilipinoToggle = () => {
    playClickSound();
    setSelectedTopic(null); // Reset topic selection when language changes
    onToggleFilipino();
  };

  const handleTopicChange = (e) => {
    playClickSound();
    const value = e.target.value;
    setSelectedTopic(value === 'random' ? null : parseInt(value));
  };

  return (
    <motion.div 
      className="game-setup"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="setup-content">
        <div className="header-container">
          <motion.h1
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <img src="/chameleon.png" alt="Chameleon" className="chameleon-logo" />
            Chameleon Game
          </motion.h1>
          
          <motion.button
            className={`filipino-flag-btn ${isFilipino ? 'active' : ''}`}
            onClick={handleFilipinoToggle}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            title={isFilipino ? "Switch to English" : "Switch to Filipino"}
          >
            <svg viewBox="0 0 120 60" className="filipino-flag-svg">
              {/* Blue stripe */}
              <rect x="0" y="0" width="120" height="30" fill="#0038a8"/>
              
              {/* Red stripe */}
              <rect x="0" y="30" width="120" height="30" fill="#ce1126"/>
              
              {/* White triangle */}
              <polygon points="0,0 60,30 0,60" fill="white"/>
              
              {/* Sun */}
              <g transform="translate(20, 30)">
                <circle r="8" fill="#fcd116"/>
                {/* Sun rays */}
                {Array.from({length: 8}, (_, i) => {
                  const angle = (i * 45) * Math.PI / 180;
                  const x1 = Math.cos(angle) * 10;
                  const y1 = Math.sin(angle) * 10;
                  const x2 = Math.cos(angle) * 14;
                  const y2 = Math.sin(angle) * 14;
                  return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fcd116" strokeWidth="1.5"/>;
                })}
              </g>
              
              {/* Stars */}
              <g fill="#fcd116">
                <polygon points="8,12 9.5,9 11,12 13,11 11.5,13.5 13,16 11,15 9.5,17.5 8,15 6,16 7.5,13.5 6,11" transform="scale(0.6)"/>
                <polygon points="35,12 36.5,9 38,12 40,11 38.5,13.5 40,16 38,15 36.5,17.5 35,15 33,16 34.5,13.5 33,11" transform="scale(0.6)"/>
                <polygon points="21,45 22.5,42 24,45 26,44 24.5,46.5 26,49 24,48 22.5,50.5 21,48 19,49 20.5,46.5 19,44" transform="scale(0.6)"/>
              </g>
            </svg>
          </motion.button>
        </div>
        
        <motion.div 
          className="player-selector"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h3>Number of Players</h3>
          <div className="player-buttons">
            {[3, 4, 5, 6, 7, 8].map(num => (
              <motion.button
                key={num}
                className={`player-btn ${playerCount === num ? 'active' : ''}`}
                onClick={() => handlePlayerSelect(num)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {num}
              </motion.button>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="topic-selector"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <h3>{isFilipino ? "Piliin ang Topic" : "Select Topic"}</h3>
          <select 
            className="topic-dropdown"
            value={selectedTopic === null ? 'random' : selectedTopic}
            onChange={handleTopicChange}
          >
            <option value="random">{isFilipino ? "Random Topic" : "Random Topic"}</option>
            {availableTopics.map((topic, index) => (
              <option key={index} value={index}>
                {topic.category}
              </option>
            ))}
          </select>
        </motion.div>

        <motion.div
          className="game-rules"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <h4>{isFilipino ? "Paano Maglaro:" : "How to Play:"}</h4>
          <ul>
            <li>{isFilipino ? "Ipasa ang phone sa mga players" : "Pass the phone between players"}</li>
            <li>{isFilipino ? "Hawakan ang chameleon icon para makita ang role" : "Each player holds the chameleon icon to reveal their role"}</li>
            <li>{isFilipino ? "Isang player ang chameleon (hindi nakikita ang salita)" : "One player is the chameleon (doesn't see the word)"}</li>
            <li>{isFilipino ? "Iba nakakakita ng secret word para sa topic" : "Others see the secret word for the topic"}</li>
            <li>{isFilipino ? "Magbigay ng clues at hanapin ang chameleon!" : "Give clues and find the chameleon!"}</li>
          </ul>
        </motion.div>

        <motion.button
          className="start-btn"
          onClick={handleStart}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isFilipino ? "Simulan ang Laro" : "Start Game"}
        </motion.button>
      </div>
    </motion.div>
  );
};

export default GameSetup;