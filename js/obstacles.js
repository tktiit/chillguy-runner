import { CONFIG } from './config.js';
import { isMobile } from './config.js';

// We'll access gameState via a global reference to avoid circular imports

// Spawn a new token
function spawnToken() {
  const smallerDimension = Math.min(
    window.gameState.canvas.width,
    window.gameState.canvas.height
  );
  const tokenSize = Math.round(
    smallerDimension * (CONFIG.SIZES?.TOKEN?.BASE_RATIO || 0.05)
  );

  return {
    x: window.gameState.canvas.width,
    y:
      Math.random() *
        (window.gameState.canvas.height * CONFIG.GROUND_HEIGHT_RATIO - tokenSize) *
        0.7 +
      50,
    width: tokenSize,
    height: tokenSize,
    rotation: Math.random() * Math.PI * 2,
    collected: false,
  };
}

// Spawn a new obstacle
function spawnObstacle() {
  const smallerDimension = Math.min(
    window.gameState.canvas.width,
    window.gameState.canvas.height
  );
  const obstacleSize = Math.round(
    smallerDimension * (CONFIG.SIZES?.OBSTACLE?.BASE_RATIO || 0.07)
  );

  return {
    x: window.gameState.canvas.width,
    y:
      window.gameState.canvas.height * CONFIG.GROUND_HEIGHT_RATIO -
      obstacleSize,
    width: obstacleSize,
    height: obstacleSize,
    hit: false,
  };
}

// Update tokens and obstacles
function updateGameObjects() {
  const movementSpeed = CONFIG.MOVEMENT_SPEED || (isMobile ? 5 : 10);

  // Initialize arrays if they don't exist
  if (!window.gameState.vibeTokens) window.gameState.vibeTokens = [];
  if (!window.gameState.obstacles) window.gameState.obstacles = [];

  // Move tokens and obstacles
  window.gameState.vibeTokens.forEach((token, index) => {
    token.x -= movementSpeed;
    token.rotation += 0.02; // Rotate tokens for visual effect
    
    // Remove tokens that are off-screen
    if (token.x + token.width < 0) {
      window.gameState.vibeTokens.splice(index, 1);
    }
  });

  window.gameState.obstacles.forEach((obstacle, index) => {
    obstacle.x -= movementSpeed;
    
    // Remove obstacles that are off-screen
    if (obstacle.x + obstacle.width < 0) {
      window.gameState.obstacles.splice(index, 1);
    }
  });
  
  // Spawn new tokens and obstacles based on probability
  if (Math.random() < (CONFIG.SPAWN_RATES?.TOKEN || 0.03)) {
    window.gameState.vibeTokens.push(spawnToken());
  }
  
  if (Math.random() < (CONFIG.SPAWN_RATES?.OBSTACLE || 0.015)) {
    window.gameState.obstacles.push(spawnObstacle());
  }
}

// Draw tokens
function drawTokens() {
  if (!window.gameState.vibeTokens) window.gameState.vibeTokens = [];
  
  window.gameState.vibeTokens.forEach((token) => {
    if (token.collected) return; // Skip collected tokens
    
    window.gameState.ctx.save();
    window.gameState.ctx.translate(
      token.x + token.width / 2,
      token.y + token.height / 2
    );
    window.gameState.ctx.rotate(token.rotation);
    
    if (
      window.gameState.images.token &&
      window.gameState.images.token.complete &&
      window.gameState.images.token.naturalWidth !== 0
    ) {
      // Ensure we're using source-over composite operation for transparency
      window.gameState.ctx.globalCompositeOperation = 'source-over';
      
      window.gameState.ctx.drawImage(
        window.gameState.images.token,
        -token.width / 2,
        -token.height / 2,
        token.width,
        token.height
      );
    } else {
      // Fallback to drawing a circle if image not available
      window.gameState.ctx.fillStyle = "#FFD700"; // Gold color
      window.gameState.ctx.beginPath();
      window.gameState.ctx.arc(0, 0, token.width / 2, 0, Math.PI * 2);
      window.gameState.ctx.fill();
      
      // Add some detail
      window.gameState.ctx.fillStyle = "#FFF";
      window.gameState.ctx.beginPath();
      window.gameState.ctx.arc(0, 0, token.width / 4, 0, Math.PI * 2);
      window.gameState.ctx.fill();
    }
    
    window.gameState.ctx.restore();
  });
}

// Draw obstacles
function drawObstacles() {
  if (!window.gameState.obstacles) window.gameState.obstacles = [];
  
  window.gameState.obstacles.forEach((obstacle) => {
    if (obstacle.hit) return; // Skip hit obstacles
    
    if (
      window.gameState.images.obstacle &&
      window.gameState.images.obstacle.complete &&
      window.gameState.images.obstacle.naturalWidth !== 0
    ) {
      // Ensure we're using source-over composite operation for transparency
      window.gameState.ctx.globalCompositeOperation = 'source-over';
      
      window.gameState.ctx.drawImage(
        window.gameState.images.obstacle,
        obstacle.x,
        obstacle.y,
        obstacle.width,
        obstacle.height
      );
    } else {
      // Fallback to drawing a simple obstacle
      window.gameState.ctx.fillStyle = "#FF6347"; // Tomato color
      window.gameState.ctx.fillRect(
        obstacle.x,
        obstacle.y,
        obstacle.width,
        obstacle.height
      );
      
      // Add some detail
      gameState.ctx.fillStyle = "#8B0000"; // Dark red
      gameState.ctx.fillRect(
        obstacle.x + obstacle.width * 0.2,
        obstacle.y + obstacle.height * 0.2,
        obstacle.width * 0.6,
        obstacle.height * 0.6
      );
    }
  });
}

export { 
  spawnToken, 
  spawnObstacle, 
  updateGameObjects, 
  drawTokens, 
  drawObstacles 
};
