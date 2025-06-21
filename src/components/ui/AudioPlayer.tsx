import { useEffect, useRef, useState } from 'react';

interface AudioPlayerProps {
  src: string;
  volume?: number;
  autoPlay?: boolean;
  onError?: (error: Error) => void;
  onPlay?: () => void;
  onEnd?: () => void;
}

/**
 * A CSP-compliant audio player component that avoids using eval() or string-based callbacks
 */
export function AudioPlayer({
  src,
  volume = 0.7,
  autoPlay = false,
  onError,
  onPlay,
  onEnd
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Create audio element
    const audio = new Audio(src);
    audioRef.current = audio;
    
    // Set volume
    audio.volume = volume;
    
    // Set up event listeners
    const handlePlay = () => {
      setIsPlaying(true);
      if (onPlay) onPlay();
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
      if (onEnd) onEnd();
    };
    
    const handleError = (e: Event) => {
      const errorMessage = `Audio error: ${(e as ErrorEvent).message || 'Unknown error'}`;
      const audioError = new Error(errorMessage);
      setError(audioError);
      setIsPlaying(false);
      if (onError) onError(audioError);
    };
    
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    
    // Auto-play if requested
    if (autoPlay) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.warn('Auto-play prevented by browser policy:', err);
          if (onError) onError(err);
        });
      }
    }
    
    // Clean up
    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.pause();
      audioRef.current = null;
    };
  }, [src, volume, autoPlay, onError, onPlay, onEnd]);

  // Expose play method
  const play = () => {
    if (audioRef.current) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.warn('Play prevented by browser policy:', err);
          if (onError) onError(err);
        });
      }
    }
  };

  // Expose pause method
  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  return null; // This is a non-visual component
}

/**
 * Utility function to safely play a sound without CSP issues
 */
export function playSoundSafely(src: string, volume = 0.7): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const audio = new Audio(src);
      audio.volume = volume;
      
      const handleEnded = () => {
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('error', handleError);
        resolve();
      };
      
      const handleError = (e: Event) => {
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('error', handleError);
        reject(new Error(`Audio error: ${(e as ErrorEvent).message || 'Unknown error'}`));
      };
      
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('error', handleError);
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.warn('Play prevented by browser policy:', err);
          reject(err);
        });
      }
    } catch (error) {
      console.warn('Failed to play sound:', error);
      reject(error);
    }
  });
}