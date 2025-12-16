import { useEffect, useRef, useState } from 'react';

export const useBackgroundMusic = () => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3); // 30% volume by default
  const [isInitialized, setIsInitialized] = useState(false);

  const initializeMusic = () => {
    if (!isInitialized) {
      audioRef.current = new Audio('/music.mp3');
      audioRef.current.loop = true;
      audioRef.current.volume = volume;
      setIsInitialized(true);
    }
  };

  const startMusic = async () => {
    initializeMusic();
    try {
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (error) {
      console.error('Failed to play music:', error);
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Update volume when it changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const toggleMusic = () => {
    if (!isInitialized) {
      initializeMusic();
    }
    
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };
  
  const stopMusic = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const changeVolume = (newVolume) => {
    setVolume(Math.max(0, Math.min(1, newVolume)));
  };

  return {
    isPlaying,
    toggleMusic,
    volume,
    changeVolume,
    startMusic,
    stopMusic
  };
};