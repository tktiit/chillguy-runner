// Utility functions for the Chillguy Runner game
import { CONFIG } from './config.js';

/**
 * Draw a rounded rectangle
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} width - Width of rectangle
 * @param {number} height - Height of rectangle
 * @param {number} radius - Corner radius
 */
function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Draw an image with cover sizing (like CSS background-size: cover)
 * @param {HTMLImageElement} img - Image to draw
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} width - Width to cover
 * @param {number} height - Height to cover
 */
function drawImageCover(img, x, y, width, height) {
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const containerRatio = width / height;
  
  let drawWidth, drawHeight, offsetX, offsetY;
  
  if (imgRatio > containerRatio) {
    // Image is wider than container (relative to their heights)
    drawHeight = height;
    drawWidth = height * imgRatio;
    offsetX = (width - drawWidth) / 2;
    offsetY = 0;
  } else {
    // Image is taller than container (relative to their widths)
    drawWidth = width;
    drawHeight = width / imgRatio;
    offsetX = 0;
    offsetY = (height - drawHeight) / 2;
  }
  
  // Draw the image
  try {
    // Handle potential errors with image drawing
    if (img && img.complete && img.naturalWidth !== 0) {
      // Draw the image centered
      const ctx = document.getElementById('gameCanvas').getContext('2d');
      ctx.drawImage(img, x + offsetX, y + offsetY, drawWidth, drawHeight);
    }
  } catch (e) {
    console.error("Error drawing image:", e);
  }
}

/**
 * Draw an image with cover sizing but align to the top (useful for ground/mountains)
 * @param {HTMLImageElement} img - Image to draw
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} width - Width to cover
 * @param {number} height - Height to cover
 */
function drawImageCoverAlignTop(img, x, y, width, height) {
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const containerRatio = width / height;
  
  let drawWidth, drawHeight, offsetX;
  
  if (imgRatio > containerRatio) {
    // Image is wider than container (relative to their heights)
    drawHeight = height;
    drawWidth = height * imgRatio;
    offsetX = (width - drawWidth) / 2;
  } else {
    // Image is taller than container (relative to their widths)
    drawWidth = width;
    drawHeight = width / imgRatio;
    offsetX = 0;
  }
  
  // Draw the image
  try {
    // Handle potential errors with image drawing
    if (img && img.complete && img.naturalWidth !== 0) {
      // Draw the image aligned to the top
      const ctx = document.getElementById('gameCanvas').getContext('2d');
      ctx.drawImage(img, x + offsetX, y, drawWidth, drawHeight);
    }
  } catch (e) {
    console.error("Error drawing image:", e);
  }
}

/**
 * Load an image with multiple format fallbacks
 * @param {string} basePath - Base path to the image without extension
 * @param {function} callback - Callback function when image is loaded
 * @returns {HTMLImageElement} - The image element
 */
function loadImageWithFallbacks(basePath, callback) {
  const img = new Image();
  const formats = ['webp', 'png', 'jpg', 'jpeg', 'avif', 'gif'];
  let currentFormatIndex = 0;
  
  function tryNextFormat() {
    if (currentFormatIndex >= formats.length) {
      console.warn(`Could not load image: ${basePath}`);
      if (callback) callback(null);
      return;
    }
    
    const format = formats[currentFormatIndex];
    img.src = `${basePath}.${format}`;
    currentFormatIndex++;
  }
  
  img.onload = function() {
    if (callback) callback(img);
  };
  
  img.onerror = function() {
    tryNextFormat();
  };
  
  tryNextFormat();
  return img;
}

/**
 * Preload all game images with format fallbacks
 * @param {Object} gameState - Game state object to store loaded images
 * @param {function} callback - Callback function when all images are loaded
 */
function preloadImages(gameState, callback) {
  // Default images to load if not provided as custom images
  const imagesToLoad = [
    { name: 'player', path: 'assets/player' },
    { name: 'sky', path: 'assets/sky' },
    { name: 'mountains', path: 'assets/mountains' },
    { name: 'ground', path: 'assets/ground' },
    { name: 'token', path: 'assets/token' },
    { name: 'obstacle', path: 'assets/obstacle' },
    { name: 'platform', path: 'assets/platform' }
  ];
  
  // Filter out any images that are already loaded as custom images
  const imagesToLoadFiltered = imagesToLoad.filter(img => !gameState.customImages || !gameState.customImages[img.name]);
  
  // If all images are already loaded as custom images, call callback immediately
  if (imagesToLoadFiltered.length === 0) {
    if (callback) callback();
    return;
  }
  
  let loadedCount = 0;
  
  function onImageLoaded() {
    loadedCount++;
    if (loadedCount >= imagesToLoadFiltered.length) {
      if (callback) callback();
    }
  }
  
  imagesToLoadFiltered.forEach(img => {
    gameState.images[img.name] = loadImageWithFallbacks(img.path, (loadedImg) => {
      gameState.images[img.name] = loadedImg;
      onImageLoaded();
    });
  });
}

/**
 * Detect if the device is mobile
 * @returns {boolean} - True if mobile device
 */
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Get a random number between min and max
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} - Random number between min and max
 */
function getRandomNumber(min, max) {
  return Math.random() * (max - min) + min;
}

/**
 * Get a random integer between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} - Random integer between min and max
 */
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Ease in out function for smooth animations
 * @param {number} t - Current time (0-1)
 * @returns {number} - Eased value
 */
function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

/**
 * Clamp a value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} - Clamped value
 */
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Save high score to local storage
 * @param {number} score - Score to save
 */
function saveHighScore(score) {
  if (!CONFIG.HIGH_SCORE.ENABLED) return;
  
  try {
    localStorage.setItem(CONFIG.HIGH_SCORE.STORAGE_KEY, score.toString());
  } catch (e) {
    console.error("Could not save high score:", e);
  }
}

/**
 * Load high score from local storage
 * @returns {number} - Loaded high score or 0 if not found
 */
function loadHighScore() {
  if (!CONFIG.HIGH_SCORE.ENABLED) return 0;
  
  try {
    const score = localStorage.getItem(CONFIG.HIGH_SCORE.STORAGE_KEY);
    return score ? parseInt(score, 10) : 0;
  } catch (e) {
    console.error("Could not load high score:", e);
    return 0;
  }
}

// Export all utility functions
export {
  roundedRect,
  drawImageCover,
  drawImageCoverAlignTop,
  loadImageWithFallbacks,
  preloadImages,
  isMobileDevice,
  getRandomNumber,
  getRandomInt,
  easeInOut,
  clamp,
  saveHighScore,
  loadHighScore
};
