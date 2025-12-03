import { motion } from 'framer-motion';

const WordBoard = ({ topic, secretWord, diceResult, showSecret = false }) => {
  if (!topic) return null;

  const getWordStyle = (rowIndex, colIndex, word) => {
    const isSecret = word === secretWord;
    const isDicePosition = (rowIndex + 1) === diceResult.row && (colIndex + 1) === diceResult.col;
    
    let className = "word-cell";
    if (showSecret && isSecret) {
      className += " secret-highlight";
    }
    if (showSecret && isDicePosition && isSecret) {
      className += " dice-highlight";
    }
    
    return className;
  };

  return (
    <motion.div 
      className="word-board"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="board-header">
        <h3>{topic.category}</h3>
        {showSecret && (
          <div className="dice-info">
            <span>Dice: {diceResult.row}-{diceResult.col}</span>
          </div>
        )}
      </div>
      
      <div className="words-grid">
        {topic.words.map((row, rowIndex) => (
          <div key={rowIndex} className="word-row">
            {row.map((word, colIndex) => (
              <motion.div
                key={`${rowIndex}-${colIndex}`}
                className={getWordStyle(rowIndex, colIndex, word)}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ 
                  duration: 0.3, 
                  delay: (rowIndex * 4 + colIndex) * 0.05 
                }}
                whileHover={{ scale: 1.02 }}
              >
                <span className="word-text">{word}</span>
                {showSecret && (rowIndex + 1) === diceResult.row && (colIndex + 1) === diceResult.col && (
                  <div className="dice-marker">🎯</div>
                )}
              </motion.div>
            ))}
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default WordBoard;