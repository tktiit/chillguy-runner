// Input handling for Chillguy Runner game
import { jump } from './physics.js';

// We'll access gameState via a global reference to avoid circular imports

/**
 * Handle user interaction (mouse click, touch, or keyboard press)
 * @param {Event} e - The event object
 */
function handleInteraction(e) {
  // Prevent default behavior
  if (e) {
    e.preventDefault();
  }
  
  // If game is over, check if restart button was clicked
  if (window.gameState.gameOver) {
    // Get click/touch coordinates
    let x, y;
    
    if (e.type === 'touchstart') {
      // Touch event
      const touch = e.touches[0];
      const rect = window.gameState.canvas.getBoundingClientRect();
      x = touch.clientX - rect.left;
      y = touch.clientY - rect.top;
    } else {
      // Mouse event
      const rect = window.gameState.canvas.getBoundingClientRect();
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }
    
    // Check if click/touch is within restart button
    const button = window.gameState.restartButton;
    if (button && 
        x >= button.x && 
        x <= button.x + button.width && 
        y >= button.y && 
        y <= button.y + button.height) {
      // Reset the game
      window.resetGame();
      // Reset score increment timer (in main.js)
      if (window.resetScoreTimer) {
        window.resetScoreTimer();
      }
    }
    return;
  }
  
  // Otherwise, make the player jump
  jump();
}

/**
 * Initialize input event listeners
 */
function initInputHandlers() {
  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (isMobileDevice) {
    // Mobile controls
    window.gameState.canvas.addEventListener('touchstart', handleInteraction, { passive: false });
  } else {
    // Desktop controls
    window.gameState.canvas.addEventListener('click', handleInteraction);
    
    // Keyboard controls
    document.addEventListener('keydown', function(e) {
      if (e.code === 'Space' || e.key === ' ' || e.key === 'ArrowUp') {
        handleInteraction(e);
      }
    });
  }
}

export { handleInteraction, initInputHandlers };
