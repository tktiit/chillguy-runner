// Main entry point for Chillguy Runner game
import { CONFIG } from "./config.js";
import { initializeGame, resetGame, changeSkyObjectType } from "./core.js";
import { update, draw, drawPlayer, drawHUD } from "./rendering.js";
import { preloadImages, loadHighScore, saveHighScore } from "./utils.js";
import { initInputHandlers } from "./input.js";
import { drawTokens, drawObstacles } from "./obstacles.js";
import {
  initSounds,
  playSound,
  playBackgroundMusic,
  stopBackgroundMusic,
  setMuted,
} from "./sound.js";

// We'll use window.gameState to avoid circular dependencies

// Track time for score increment
let lastScoreIncrementTime = 0;

// Main game loop
function gameLoop(timestamp) {
  // Initialize timestamp if it's the first frame
  if (!lastScoreIncrementTime) {
    lastScoreIncrementTime = timestamp;
  }

  if (!window.gameState.paused) {
    // Update game state
    update();

    // Draw game elements
    draw();

    // Draw player
    drawPlayer();

    // Draw tokens and obstacles
    drawTokens();
    drawObstacles();

    // Draw HUD (score, chill meter, etc.)
    drawHUD();

    // Update score - 1 point per second
    if (!window.gameState.gameOver) {
      // Calculate time difference in milliseconds
      const currentTime = timestamp;
      const timeDiff = currentTime - lastScoreIncrementTime;

      // If one second has passed, increment score by 1
      if (timeDiff >= 1000) {
        window.gameState.score += 1;
        lastScoreIncrementTime = currentTime;
      }

      // Game over if chill meter reaches 0
      if (window.gameState.chillMeter <= 0 && !window.gameState.gameOver) {
        window.gameState.gameOver = true;
        // Play game over sound
        playSound("gameOver");
      }

      // Update high score if needed
      if (window.gameState.score > window.gameState.highScore) {
        window.gameState.highScore = window.gameState.score;
        saveHighScore(window.gameState.highScore);
      }
    }
  }

  // Request next frame
  requestAnimationFrame(gameLoop);
}

// Handle window resize
function handleResize() {
  // Get the container element
  const container = document.getElementById("gameContainer");

  // Set canvas dimensions based on container size
  window.gameState.canvas.width = container.clientWidth;
  window.gameState.canvas.height = container.clientHeight;

  // Adjust player position and dimensions based on new canvas size
  if (window.gameState.initialized) {
    // Update ground height based on new canvas dimensions
    const groundY = window.gameState.canvas.height * CONFIG.GROUND_HEIGHT_RATIO;

    // Update player dimensions
    window.gameState.player.width =
      window.gameState.canvas.width * CONFIG.PLAYER.WIDTH_RATIO;
    window.gameState.player.height =
      window.gameState.canvas.height * CONFIG.PLAYER.HEIGHT_RATIO;

    // Update player position
    window.gameState.player.x =
      window.gameState.canvas.width * CONFIG.PLAYER.X_RATIO;
    window.gameState.player.y = groundY - window.gameState.player.height;

    // Update HUD dimensions
    window.gameState.hud.width = window.gameState.canvas.width * 0.2;
    window.gameState.hud.height = window.gameState.canvas.height * 0.03;
    window.gameState.hud.x = window.gameState.canvas.width * 0.05;
    window.gameState.hud.y = window.gameState.canvas.height * 0.05;
    window.gameState.hud.scoreFontSize = Math.max(
      16,
      Math.min(24, window.gameState.canvas.width * 0.02)
    );
    window.gameState.hud.chillFontSize = Math.max(
      12,
      Math.min(18, window.gameState.canvas.width * 0.015)
    );
    window.gameState.hud.gameOverFontSize = Math.max(
      32,
      Math.min(48, window.gameState.canvas.width * 0.05)
    );
  }
}

// Initialize the game when the window loads
window.onload = function () {
  // Get canvas and context
  window.gameState.canvas = document.getElementById("gameCanvas");
  window.gameState.ctx = window.gameState.canvas.getContext("2d");

  // Handle window resize
  handleResize();
  window.addEventListener("resize", handleResize);

  // Load high score from local storage
  window.gameState.highScore = loadHighScore();

  // Initialize sound system first to ensure audio context is created on user interaction
  initSounds().then(() => {
    // Preload images
    preloadImages(window.gameState, function () {
      // Initialize game
      initializeGame();

      // Initialize input handlers
      initInputHandlers();
      
      // Set up sound toggle button
      let soundMuted = false;
      const soundToggle = document.getElementById("soundToggle");
      const soundIcon = document.getElementById("soundIcon");
      
      soundToggle.addEventListener("click", function() {
        soundMuted = !soundMuted;
        setMuted(soundMuted);
        soundIcon.textContent = soundMuted ? "🔇" : "🔊";
      });

      // Start game loop
      gameLoop();

      // Play background music
      playBackgroundMusic();

      // Hide loading screen
      const loadingScreen = document.getElementById("loadingScreen");
      if (loadingScreen) {
        loadingScreen.classList.add("hidden");

        // Remove loading screen from DOM after transition completes
        setTimeout(() => {
          if (loadingScreen.parentNode) {
            loadingScreen.parentNode.removeChild(loadingScreen);
          }
        }, 500);
      }
    });
  });
};

// Function to reset the score increment timer
function resetScoreTimer() {
  lastScoreIncrementTime = 0;
}

// Expose functions to window for debugging and game functionality
window.resetGame = resetGame;
window.resetScoreTimer = resetScoreTimer;
