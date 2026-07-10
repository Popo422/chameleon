import { useEffect, useRef, useState, useCallback } from 'react';

export const useBackgroundMusic = () => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3); // 30% volume by default
  // Once the user explicitly pauses, don't let an auto-start re-enable music.
  const userPausedRef = useRef(false);

  const initializeMusic = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio('/music.mp3');
      audioRef.current.loop = true;
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const startMusic = useCallback(async () => {
    if (userPausedRef.current) return; // respect an explicit pause
    initializeMusic();
    try {
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (error) {
      console.error('Failed to play music:', error);
    }
  }, [initializeMusic]);

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

  const toggleMusic = useCallback(() => {
    initializeMusic();

    if (audioRef.current) {
      if (isPlaying) {
        userPausedRef.current = true; // remember the user's intent
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        userPausedRef.current = false;
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  }, [initializeMusic, isPlaying]);

  const stopMusic = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const changeVolume = useCallback((newVolume) => {
    setVolume(Math.max(0, Math.min(1, newVolume)));
  }, []);

  return {
    isPlaying,
    toggleMusic,
    volume,
    changeVolume,
    startMusic,
    stopMusic
  };
};