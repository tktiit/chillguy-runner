import { CONFIG } from './config.js';
import { playSound } from './sound.js';
import { createSparkleEffect, createScorePopup, activateChillMeterPulse, applyTokenMagnetism, effects } from './effects.js';

// We'll access gameState via a global reference to avoid circular imports

// Collision detection between two objects
function checkCollision(obj1, obj2) {
  const bounds1 = {
    x: obj1.x,
    y: obj1.y,
    width: obj1.actualWidth || obj1.width,
    height: obj1.actualHeight || obj1.height,
  };
  const bounds2 = {
    x: obj2.x,
    y: obj2.y,
    width: obj2.actualWidth || obj2.width,
    height: obj2.actualHeight || obj2.height,
  };
  return (
    bounds1.x < bounds2.x + bounds2.width &&
    bounds1.x + bounds1.width > bounds2.x &&
    bounds1.y < bounds2.y + bounds2.height &&
    bounds1.y + bounds1.height > bounds2.y
  );
}

// Handle player jumping
function jump() {
  if (!gameState.player.jumping) {
    gameState.player.jumping = true;
    gameState.player.yVelocity = CONFIG.JUMP_VELOCITY;
    
    // Play jump sound
    playSound('jump');
    gameState.onPlatform = false; // No longer on platform when jumping
  }
}

// Update player physics
function updatePlayerPhysics() {
  if (gameState.player.jumping) {
    gameState.player.y += gameState.player.yVelocity;
    gameState.player.yVelocity += CONFIG.GRAVITY;
    
    // Check for platform collisions
    let onAnyPlatform = false;
    gameState.platforms.forEach(platform => {
      // Only check for platform collision if player is falling (moving downward)
      if (gameState.player.yVelocity > 0) {
        // Check if player's feet are at or slightly above platform level
        const playerFeet = gameState.player.y + gameState.player.height;
        const platformTop = platform.y;
        
        // Check if player's feet are within 10 pixels above the platform
        const feetNearPlatform = playerFeet >= platformTop - 10 && playerFeet <= platformTop + 5;
        
        // Check if player is horizontally within the platform bounds
        const horizontallyAligned = 
          gameState.player.x + gameState.player.width * 0.3 < platform.x + platform.width &&
          gameState.player.x + gameState.player.width * 0.7 > platform.x;
        
        // If player is falling onto a platform, land on it
        if (feetNearPlatform && horizontallyAligned) {
          gameState.player.y = platform.y - gameState.player.height;
          gameState.player.jumping = false;
          gameState.player.yVelocity = 0;
          gameState.onPlatform = true;
          onAnyPlatform = true;
          // Add a small score bonus for landing on a platform
          gameState.score += 2;
        }
      }
    });
    
    // If player is not on any platform, check for ground collision
    if (!onAnyPlatform) {
      // Check for ground collision
      if (
        gameState.player.y >=
        gameState.canvas.height * CONFIG.GROUND_HEIGHT_RATIO -
          gameState.player.height
      ) {
        gameState.player.y =
          gameState.canvas.height * CONFIG.GROUND_HEIGHT_RATIO -
          gameState.player.height;
        gameState.player.jumping = false;
        gameState.player.yVelocity = 0;
        gameState.onPlatform = false;
      }
    }
  } else if (gameState.onPlatform) {
    // If player is on a platform, check if they're still on it
    let stillOnPlatform = false;
    
    gameState.platforms.forEach(platform => {
      // Check if player is still horizontally within the platform bounds
      const horizontallyAligned = 
        gameState.player.x + gameState.player.width * 0.3 < platform.x + platform.width &&
        gameState.player.x + gameState.player.width * 0.7 > platform.x;
      
      // Check if player's feet are at platform level
      const onPlatformLevel = 
        Math.abs((gameState.player.y + gameState.player.height) - platform.y) < 5;
      
      if (horizontallyAligned && onPlatformLevel) {
        stillOnPlatform = true;
      }
    });
    
    // If player walked off the platform, start falling
    if (!stillOnPlatform) {
      gameState.player.jumping = true;
      gameState.player.yVelocity = 0; // Start with zero velocity (just falling)
      gameState.onPlatform = false;
    }
  }
}

// Check for collisions with tokens and obstacles
function checkGameObjectCollisions() {
  // Make sure arrays exist
  if (!window.gameState.vibeTokens) window.gameState.vibeTokens = [];
  if (!window.gameState.obstacles) window.gameState.obstacles = [];
  
  // Apply token magnetism effect if enabled
  if (effects.magnetism.active) {
    applyTokenMagnetism(window.gameState.player, window.gameState.vibeTokens);
  } else {
    // Check if player is close to any token for magnetism effect
    for (let i = 0; i < window.gameState.vibeTokens.length; i++) {
      const token = window.gameState.vibeTokens[i];
      if (token.collected) continue;
      
      const dx = window.gameState.player.x + window.gameState.player.width / 2 - (token.x + token.width / 2);
      const dy = window.gameState.player.y + window.gameState.player.height / 2 - (token.y + token.height / 2);
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Enable magnetism when player gets close to tokens
      if (distance < effects.magnetism.radius * 1.5) {
        effects.magnetism.active = true;
        break;
      }
    }
  }

  // Handle collisions with tokens
  for (let i = 0; i < window.gameState.vibeTokens.length; i++) {
    const token = window.gameState.vibeTokens[i];
    if (!token.collected && checkCollision(window.gameState.player, token)) {
      // Mark token as collected
      token.collected = true;
      
      // Increase score when collecting a token
      window.gameState.score += CONFIG.SCORE_INCREMENT;
      window.gameState.chillMeter = Math.min(
        window.gameState.chillMeter + (CONFIG.CHILL_METER?.INCREMENT || 10),
        100
      );
      
      // Play token collection sound
      playSound('token');
      
      // Create visual effects
      createSparkleEffect(token.x + token.width / 2, token.y + token.height / 2);
      createScorePopup(token.x + token.width / 2, token.y, CONFIG.SCORE_INCREMENT);
      activateChillMeterPulse();
      
      // Remove token after a short delay (for animation if needed)
      setTimeout(() => {
        const index = window.gameState.vibeTokens.indexOf(token);
        if (index !== -1) {
          window.gameState.vibeTokens.splice(index, 1);
        }
      }, 100);
    }
  }

  // Handle collisions with obstacles
  for (let i = 0; i < window.gameState.obstacles.length; i++) {
    const obstacle = window.gameState.obstacles[i];
    if (!obstacle.hit && checkCollision(window.gameState.player, obstacle)) {
      // Mark obstacle as hit
      obstacle.hit = true;
      
      // Decrease chill meter
      window.gameState.chillMeter -= CONFIG.CHILL_METER?.DECREMENT || 20;
      
      // Play obstacle hit sound
      playSound('obstacle');
      
      // Remove obstacle after a short delay (for animation if needed)
      setTimeout(() => {
        const index = window.gameState.obstacles.indexOf(obstacle);
        if (index !== -1) {
          window.gameState.obstacles.splice(index, 1);
        }
      }, 100);
    }
  }

  // Check if game over (chill meter depleted)
  if (window.gameState.chillMeter <= 0) {
    window.gameState.gameOver = true;
    window.gameState.chillMeter = 0;
    
    // Update high score if current score is higher
    if (window.gameState.score > window.gameState.highScore) {
      window.gameState.highScore = window.gameState.score;
      localStorage.setItem("highScore", window.gameState.highScore);
    }
  }
}

export { 
  checkCollision, 
  jump, 
  updatePlayerPhysics, 
  checkGameObjectCollisions 
};
