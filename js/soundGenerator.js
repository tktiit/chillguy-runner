// Sound generator for Chillguy Runner game
// This file creates programmatic sound effects using Web Audio API

// Create audio context
let audioContext;

// Initialize audio context on first user interaction
function initAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
}

/**
 * Generate a jump sound effect
 * @returns {HTMLAudioElement} - Audio element with the generated sound
 */
function generateJumpSound() {
  const context = initAudioContext();
  const audioBuffer = createAudioBuffer(0.3, (t) => {
    // Jump sound: descending frequency with quick decay
    return Math.sin(440 * 2 * Math.PI * t * (1 - t * 2)) * Math.exp(-10 * t);
  });
  
  return createAudioElementFromBuffer(audioBuffer, 'jump.wav');
}

/**
 * Generate a token collection sound effect
 * @returns {HTMLAudioElement} - Audio element with the generated sound
 */
function generateTokenSound() {
  const context = initAudioContext();
  const audioBuffer = createAudioBuffer(0.2, (t) => {
    // Token sound: ascending bright tone
    return Math.sin(880 * 2 * Math.PI * t * (1 + t)) * Math.exp(-5 * t);
  });
  
  return createAudioElementFromBuffer(audioBuffer, 'token.wav');
}

/**
 * Generate an obstacle hit sound effect
 * @returns {HTMLAudioElement} - Audio element with the generated sound
 */
function generateObstacleSound() {
  const context = initAudioContext();
  const audioBuffer = createAudioBuffer(0.3, (t) => {
    // Obstacle sound: low frequency impact
    return (
      Math.sin(150 * 2 * Math.PI * t) * Math.exp(-8 * t) +
      Math.sin(100 * 2 * Math.PI * t) * Math.exp(-5 * t) * 0.5
    );
  });
  
  return createAudioElementFromBuffer(audioBuffer, 'obstacle.wav');
}

/**
 * Generate a game over sound effect
 * @returns {HTMLAudioElement} - Audio element with the generated sound
 */
function generateGameOverSound() {
  const context = initAudioContext();
  const audioBuffer = createAudioBuffer(1.0, (t) => {
    // Game over sound: descending sad tone
    return (
      Math.sin(440 * 2 * Math.PI * t * (1 - t * 0.5)) * Math.exp(-3 * t) +
      Math.sin(220 * 2 * Math.PI * t * (1 - t * 0.5)) * Math.exp(-3 * t) * 0.5
    );
  });
  
  return createAudioElementFromBuffer(audioBuffer, 'game_over.wav');
}

/**
 * Generate a background music loop
 * @returns {HTMLAudioElement} - Audio element with the generated sound
 */
function generateBackgroundSound() {
  const context = initAudioContext();
  const duration = 4.0; // 4 second loop
  const audioBuffer = createAudioBuffer(duration, (t) => {
    // Simple background music with a repeating pattern
    const baseFreq = 220;
    const t2 = t % 1.0; // Create a repeating pattern every second
    
    // Create a simple melody
    let note = 0;
    if (t2 < 0.25) note = 0;
    else if (t2 < 0.5) note = 2;
    else if (t2 < 0.75) note = 4;
    else note = 2;
    
    // Convert note to frequency multiplier
    const freq = baseFreq * Math.pow(2, note / 12);
    
    // Generate sound
    return (
      Math.sin(freq * 2 * Math.PI * t) * 0.2 +
      Math.sin(freq * 2 * 2 * Math.PI * t) * 0.1
    ) * (0.7 + Math.sin(2 * Math.PI * t2) * 0.3);
  });
  
  return createAudioElementFromBuffer(audioBuffer, 'background.wav');
}

/**
 * Create an audio buffer with the given duration and generator function
 * @param {number} duration - Duration of the sound in seconds
 * @param {Function} generator - Function that generates the waveform
 * @returns {AudioBuffer} - Generated audio buffer
 */
function createAudioBuffer(duration, generator) {
  const context = initAudioContext();
  const sampleRate = context.sampleRate;
  const bufferSize = duration * sampleRate;
  const buffer = context.createBuffer(1, bufferSize, sampleRate);
  const data = buffer.getChannelData(0);
  
  for (let i = 0; i < bufferSize; i++) {
    const t = i / sampleRate;
    data[i] = generator(t);
  }
  
  return buffer;
}

/**
 * Create an audio element from an audio buffer
 * @param {AudioBuffer} buffer - Audio buffer
 * @param {string} filename - Filename for the Blob URL
 * @returns {HTMLAudioElement} - Audio element with the buffer as source
 */
function createAudioElementFromBuffer(buffer, filename) {
  const context = initAudioContext();
  
  // Convert buffer to wave file
  const wavFile = bufferToWave(buffer, buffer.length);
  
  // Create blob URL
  const blob = new Blob([wavFile], { type: 'audio/wav' });
  const url = URL.createObjectURL(blob);
  
  // Create audio element
  const audio = new Audio(url);
  audio.dataset.filename = filename;
  
  return audio;
}

/**
 * Convert an audio buffer to a WAV file
 * @param {AudioBuffer} abuffer - Audio buffer
 * @param {number} len - Length of the buffer
 * @returns {Uint8Array} - WAV file as Uint8Array
 */
function bufferToWave(abuffer, len) {
  const numOfChan = abuffer.numberOfChannels;
  const length = len * numOfChan * 2 + 44;
  const buffer = new ArrayBuffer(length);
  const view = new DataView(buffer);
  const channels = [];
  let i, sample, offset = 0;

  // Write WAVE header
  setUint32(0x46464952);                         // "RIFF"
  setUint32(length - 8);                         // file length - 8
  setUint32(0x45564157);                         // "WAVE"
  setUint32(0x20746d66);                         // "fmt " chunk
  setUint32(16);                                 // length = 16
  setUint16(1);                                  // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(abuffer.sampleRate);
  setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2);                      // block-align
  setUint16(16);                                 // 16-bit
  setUint32(0x61746164);                         // "data" chunk
  setUint32(len * numOfChan * 2);                // chunk length

  // Write interleaved data
  for (i = 0; i < abuffer.numberOfChannels; i++) {
    channels.push(abuffer.getChannelData(i));
  }

  while (offset < len) {
    for (i = 0; i < numOfChan; i++) {
      // Clamp the sample to the [-1, 1] range, then scale to 16-bit
      sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (sample < 0 ? sample * 0x8000 : sample * 0x7FFF);
      view.setInt16(44 + offset * numOfChan * 2 + i * 2, sample, true);
    }
    offset++;
  }

  return new Uint8Array(buffer);

  function setUint16(data) {
    view.setUint16(offset, data, true);
    offset += 2;
  }

  function setUint32(data) {
    view.setUint32(offset, data, true);
    offset += 4;
  }
}

/**
 * Generate all sound effects
 * @returns {Object} - Object containing all generated sounds
 */
function generateAllSounds() {
  return {
    jump: generateJumpSound(),
    token: generateTokenSound(),
    obstacle: generateObstacleSound(),
    gameOver: generateGameOverSound(),
    background: generateBackgroundSound()
  };
}

// Export sound generator functions
export { 
  initAudioContext, 
  generateAllSounds, 
  generateJumpSound, 
  generateTokenSound, 
  generateObstacleSound, 
  generateGameOverSound, 
  generateBackgroundSound 
};
