// Sound management for Chillguy Runner game
import { initAudioContext, generateAllSounds } from './soundGenerator.js';

// Sound effects object to store all game sounds
const sounds = {
  jump: null,
  token: null,
  obstacle: null,
  gameOver: null,
  background: null
};

// Background music reference
let backgroundMusic = null;

// Volume settings
const VOLUME = {
  MASTER: 0.7,
  EFFECTS: 0.8,
  MUSIC: 0.5
};

/**
 * Load a sound with multiple format fallbacks
 * @param {string} name - Name of the sound
 * @param {string} basePath - Base path to the sound without extension
 * @returns {Promise} - Promise that resolves when the sound is loaded
 */
function loadSound(name, basePath) {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    const formats = ['mp3', 'wav', 'ogg'];
    let currentFormatIndex = 0;
    
    function tryNextFormat() {
      if (currentFormatIndex >= formats.length) {
        console.warn(`Could not load sound file: ${basePath}, using generated sound`);
        resolve(null); // Will use generated sound as fallback
        return;
      }
      
      const format = formats[currentFormatIndex];
      audio.src = `${basePath}.${format}`;
      currentFormatIndex++;
    }
    
    audio.oncanplaythrough = function() {
      sounds[name] = audio;
      resolve(audio);
    };
    
    audio.onerror = function() {
      tryNextFormat();
    };
    
    tryNextFormat();
  });
}

/**
 * Initialize all game sounds
 * @returns {Promise} - Promise that resolves when all sounds are loaded
 */
function initSounds() {
  // Initialize audio context
  initAudioContext();
  
  // Try to load sound files first
  const soundPromises = [
    loadSound('jump', 'assets/sounds/jump'),
    loadSound('token', 'assets/sounds/token'),
    loadSound('obstacle', 'assets/sounds/obstacle'),
    loadSound('gameOver', 'assets/sounds/game_over'),
    loadSound('background', 'assets/sounds/background')
  ];
  
  // After attempting to load files, use generated sounds as fallbacks
  return Promise.all(soundPromises).then(() => {
    // Generate sounds for any that failed to load
    const generatedSounds = generateAllSounds();
    
    // Use generated sounds as fallbacks for any that didn't load
    Object.keys(sounds).forEach(key => {
      if (!sounds[key] && generatedSounds[key]) {
        sounds[key] = generatedSounds[key];
        console.log(`Using generated sound for: ${key}`);
      }
    });
    
    return sounds;
  });
}

/**
 * Play a sound effect
 * @param {string} name - Name of the sound to play
 * @param {boolean} loop - Whether to loop the sound
 * @returns {HTMLAudioElement} - The sound element being played
 */
function playSound(name, loop = false) {
  const sound = sounds[name];
  if (sound) {
    // Create a clone of the audio to allow overlapping sounds
    const soundClone = sound.cloneNode();
    
    // Set volume based on sound type
    if (name === 'background') {
      soundClone.volume = VOLUME.MASTER * VOLUME.MUSIC;
    } else {
      soundClone.volume = VOLUME.MASTER * VOLUME.EFFECTS;
    }
    
    soundClone.loop = loop;
    
    // Play the sound
    soundClone.play().catch(error => {
      console.warn(`Error playing sound ${name}:`, error);
    });
    
    return soundClone;
  }
  return null;
}

/**
 * Stop a sound
 * @param {HTMLAudioElement} sound - Sound to stop
 */
function stopSound(sound) {
  if (sound) {
    sound.pause();
    sound.currentTime = 0;
  }
}

/**
 * Play background music
 */
function playBackgroundMusic() {
  if (backgroundMusic) {
    stopSound(backgroundMusic);
  }
  backgroundMusic = playSound('background', true);
}

/**
 * Stop background music
 */
function stopBackgroundMusic() {
  if (backgroundMusic) {
    stopSound(backgroundMusic);
    backgroundMusic = null;
  }
}

/**
 * Toggle mute for all sounds
 * @param {boolean} muted - Whether sounds should be muted
 */
function setMuted(muted) {
  VOLUME.MASTER = muted ? 0 : 0.7;
  
  // Update background music volume if it's playing
  if (backgroundMusic) {
    backgroundMusic.volume = VOLUME.MASTER * VOLUME.MUSIC;
  }
}

// Export sound functions
export { 
  initSounds, 
  playSound, 
  stopSound, 
  sounds, 
  playBackgroundMusic, 
  stopBackgroundMusic, 
  setMuted 
};
