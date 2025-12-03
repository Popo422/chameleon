import { useCallback } from 'react';

export const useSounds = () => {
  const playClickSound = useCallback(() => {
    // Create a simple click sound using Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  }, []);

  const playRevealSound = useCallback(() => {
    // Create a magical reveal sound
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator1 = audioContext.createOscillator();
    const oscillator2 = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator1.frequency.setValueAtTime(400, audioContext.currentTime);
    oscillator1.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.3);
    
    oscillator2.frequency.setValueAtTime(600, audioContext.currentTime);
    oscillator2.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.3);
    
    gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
    
    oscillator1.start(audioContext.currentTime);
    oscillator2.start(audioContext.currentTime);
    oscillator1.stop(audioContext.currentTime + 0.3);
    oscillator2.stop(audioContext.currentTime + 0.3);
  }, []);

  const playSuccessSound = useCallback(() => {
    // Create a success/completion sound
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    
    notes.forEach((freq, index) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + index * 0.1);
      
      gainNode.gain.setValueAtTime(0.05, audioContext.currentTime + index * 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + index * 0.1 + 0.2);
      
      oscillator.start(audioContext.currentTime + index * 0.1);
      oscillator.stop(audioContext.currentTime + index * 0.1 + 0.2);
    });
  }, []);

  return {
    playClickSound,
    playRevealSound,
    playSuccessSound
  };
};