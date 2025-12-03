import { useState, useRef } from 'react';
import { motion } from 'framer-motion';

const ChameleonIcon = ({ onLongPress, disabled = false }) => {
  const [isPressed, setIsPressed] = useState(false);
  const [pressProgress, setPressProgress] = useState(0);
  const timeoutRef = useRef(null);
  const intervalRef = useRef(null);

  const handlePressStart = () => {
    if (disabled) return;
    
    setIsPressed(true);
    setPressProgress(0);

    let progress = 0;
    intervalRef.current = setInterval(() => {
      progress += 2; // Increase by 2% every interval
      setPressProgress(progress);
      
      if (progress >= 100) {
        clearInterval(intervalRef.current);
        onLongPress();
        setIsPressed(false);
        setPressProgress(0);
      }
    }, 20); // Update every 20ms for smooth animation

    timeoutRef.current = setTimeout(() => {
      setIsPressed(false);
      setPressProgress(0);
    }, 1000);
  };

  const handlePressEnd = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setIsPressed(false);
    setPressProgress(0);
  };

  return (
    <div className="chameleon-container">
      <motion.div
        className={`chameleon-icon ${disabled ? 'disabled' : ''}`}
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onMouseLeave={handlePressEnd}
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
        whileHover={{ scale: disabled ? 1 : 1.05 }}
        whileTap={{ scale: disabled ? 1 : 0.95 }}
        animate={{
          scale: isPressed ? 1.1 : 1,
          rotate: isPressed ? 5 : 0
        }}
        transition={{ duration: 0.1 }}
      >
        {/* Progress ring */}
        <div className="progress-ring">
          <svg className="progress-svg" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="#10b981"
              strokeWidth="3"
              fill="transparent"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - pressProgress / 100)}`}
              className="progress-circle"
            />
          </svg>
        </div>

        {/* Chameleon SVG */}
        <svg
          width="80"
          height="80"
          viewBox="0 0 100 100"
          className="chameleon-svg"
        >
          {/* Chameleon body */}
          <ellipse cx="50" cy="60" rx="25" ry="15" fill="#22c55e" />
          
          {/* Chameleon head */}
          <circle cx="50" cy="35" r="18" fill="#16a34a" />
          
          {/* Eyes */}
          <circle cx="45" cy="30" r="4" fill="#ffffff" />
          <circle cx="55" cy="30" r="4" fill="#ffffff" />
          <circle cx="45" cy="30" r="2" fill="#000000" />
          <circle cx="55" cy="30" r="2" fill="#000000" />
          
          {/* Tail */}
          <path
            d="M 25 65 Q 15 70 20 80 Q 25 85 30 80"
            stroke="#16a34a"
            strokeWidth="8"
            fill="transparent"
            strokeLinecap="round"
          />
          
          {/* Legs */}
          <rect x="35" y="72" width="6" height="15" fill="#16a34a" rx="3" />
          <rect x="59" y="72" width="6" height="15" fill="#16a34a" rx="3" />
          
          {/* Tongue (appears when pressed) */}
          {isPressed && (
            <motion.path
              d="M 50 45 Q 65 50 70 55"
              stroke="#ef4444"
              strokeWidth="3"
              fill="transparent"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.3 }}
            />
          )}
        </svg>

        {/* Press instruction */}
        <div className="press-instruction">
          {disabled ? "Wait..." : "Hold to Reveal"}
        </div>
      </motion.div>
    </div>
  );
};

export default ChameleonIcon;