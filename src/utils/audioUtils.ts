// Cache for preloaded audio elements
const audioCache: Record<string, HTMLAudioElement> = {};

/**
 * Preload audio files to improve performance
 * @param audioUrls Array of audio URLs to preload
 */
export const preloadAudio = (audioUrls: string[]) => {
  audioUrls.forEach(url => {
    if (!audioCache[url]) {
      const audio = new Audio();
      audio.preload = 'metadata';
      audio.src = url;
      audioCache[url] = audio;
    }
  });
};

/**
 * Create and return a new audio element with error handling
 * @param audioSrc Source URL for audio file
 * @returns HTMLAudioElement or null if creation failed
 */
export const createAudioElement = (audioSrc: string): HTMLAudioElement | null => {
  try {
    // Use cached audio if available
    if (audioCache[audioSrc]) {
      return audioCache[audioSrc];
    }
    
    const audio = new Audio(audioSrc);
    audioCache[audioSrc] = audio; // Cache for future use
    return audio;
  } catch (error) {
    console.error(`Error creating audio element for ${audioSrc}:`, error);
    return null;
  }
};

/**
 * Play audio with error handling
 * @param audio Audio element to play
 * @returns Promise resolving to true if played successfully, false otherwise
 */
export const playAudioSafely = async (audio: HTMLAudioElement): Promise<boolean> => {
  try {
    // Reset audio to beginning to ensure it plays from start
    audio.currentTime = 0;
    await audio.play();
    return true;
  } catch (error) {
    console.error("Audio playback error:", error);
    return false;
  }
};

/**
 * Check if audio file exists
 * @param audioSrc Source URL for audio file
 * @returns Promise resolving to true if file exists, false otherwise
 */
export const checkAudioExists = async (audioSrc: string): Promise<boolean> => {
  try {
    const response = await fetch(audioSrc, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error(`Error checking audio file ${audioSrc}:`, error);
    return false;
  }
};

/**
 * Play prayer notification sound
 * @param prayer Prayer name or type
 * @returns Promise resolving to true if played successfully, false otherwise
 */
export const playPrayerNotificationSound = async (prayer: string = 'fajr'): Promise<boolean> => {
  try {
    // Use the appropriate sound file based on prayer
    let audioPath = '/audio/fajr.mp3';
    
    // Map prayer types to specific audio files
    switch(prayer) {
      case 'fajr':
        audioPath = '/audio/fajr.mp3';
        break;
      case 'dhuhr':
        audioPath = '/audio/fajr.mp3'; 
        break;
      case 'asr':
        audioPath = '/audio/fajr.mp3';
        break;
      case 'maghrib':
        audioPath = '/audio/fajr.mp3';
        break;
      case 'isha':
        audioPath = '/audio/fajr.mp3';
        break;
      default:
        audioPath = '/audio/fajr.mp3';
    }
    
    console.log(`Playing prayer notification sound for ${prayer} from path: ${audioPath}`);
    
    // Try to get from cache first
    let audio = audioCache[audioPath];
    
    if (!audio) {
      audio = new Audio(audioPath);
      audio.volume = 1.0;
      audio.loop = false;
      audioCache[audioPath] = audio;
    }
    
    // Dispatch adhan-play event
    window.dispatchEvent(new Event('adhan-play'));
    // Add event listener to dispatch adhan-stop when audio ends
    audio.onended = () => window.dispatchEvent(new Event('adhan-stop'));
    
    // Try to play the audio
    const result = await playAudioSafely(audio);
    return result;
  } catch (error) {
    console.error(`Error playing prayer notification sound for ${prayer}:`, error);
    window.dispatchEvent(new Event('adhan-stop'));
    return false;
  }
};

/**
 * Preload all prayer notification sounds
 */
export const preloadPrayerSounds = () => {
  preloadAudio([
    '/audio/fajr.mp3',
    '/audio/dhuhr.mp3',
    '/audio/asr.mp3',
    '/audio/maghrib.mp3',
    '/audio/isha.mp3'
  ]);
};

/**
 * Stop all currently playing prayer notification sounds
 */
export const stopPrayerNotificationSound = () => {
  Object.values(audioCache).forEach(audio => {
    if (!audio.paused) {
      audio.pause();
      audio.currentTime = 0;
    }
  });
  window.dispatchEvent(new Event('adhan-stop'));
};
