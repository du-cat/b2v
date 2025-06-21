/**
 * Utility functions for playing sounds in a CSP-compliant way
 */

/**
 * Play a sound file safely without CSP issues
 * @param soundFile Path to the sound file
 * @param volume Volume level (0.0 to 1.0)
 * @returns Promise that resolves when sound plays or rejects on error
 */
export function playSoundSafely(soundFile: string, volume = 0.7): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const audio = new Audio(soundFile);
      audio.volume = volume;
      
      // Set up event listeners
      const handleEnded = () => {
        cleanup();
        resolve();
      };
      
      const handleError = (e: Event) => {
        cleanup();
        reject(new Error(`Audio error: ${(e as ErrorEvent).message || 'Unknown error'}`));
      };
      
      // Clean up function to remove event listeners
      const cleanup = () => {
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('error', handleError);
      };
      
      // Add event listeners
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('error', handleError);
      
      // Play the sound
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.warn('Play prevented by browser policy:', err);
          cleanup();
          
          // CRITICAL FIX: Fall back to Web Audio API if file playback fails
          try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            createSoundByType(soundFile.includes('alert') ? 'alert' : 
                             soundFile.includes('chime') ? 'chime' : 'default', 
                             audioContext);
            resolve(); // Resolve even though we're using fallback
          } catch (fallbackError) {
            reject(fallbackError);
          }
        });
      }
    } catch (error) {
      console.warn('Failed to play sound:', error);
      reject(error);
    }
  });
}

/**
 * Play a notification sound based on severity
 * @param severity The severity level of the notification
 */
export function playNotificationSound(severity: string): void {
  try {
    let soundFile = '/notification.mp3'; // Default
    
    switch (severity) {
      case 'critical':
      case 'suspicious':
        soundFile = '/sounds/alert.mp3';
        break;
      case 'warning':
      case 'warn':
        soundFile = '/sounds/chime.mp3';
        break;
      default:
        soundFile = '/sounds/default.mp3';
        break;
    }
    
    playSoundSafely(soundFile).catch(error => {
      console.warn(`Failed to play ${severity} notification sound:`, error);
      
      // Fallback to Web Audio API if file playback fails
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        createSoundByType(severity, audioContext);
      } catch (fallbackError) {
        console.warn('Failed to play fallback sound:', fallbackError);
      }
    });
  } catch (error) {
    console.warn('Failed to play notification sound:', error);
  }
}

/**
 * Create different sound types using Web Audio API
 * This is a CSP-compliant alternative to playing audio files
 */
export function createSoundByType(type: string, audioContext: AudioContext): void {
  if (!audioContext) return;
  
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  // Configure different sounds based on type
  switch (type) {
    case 'chime':
    case 'warning':
      // Pleasant chime - multiple tones
      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
      oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
      oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.8);
      break;
      
    case 'alert':
    case 'critical':
    case 'suspicious':
      // Urgent alert - rapid beeps
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
      oscillator.type = 'square';
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      
      // Create rapid beeping pattern
      for (let i = 0; i < 3; i++) {
        const startTime = audioContext.currentTime + (i * 0.3);
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.4, startTime + 0.05);
        gainNode.gain.linearRampToValueAtTime(0, startTime + 0.15);
      }
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 1);
      break;
      
    case 'default':
    case 'info':
    default:
      // Simple notification beep
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
      break;
  }
}