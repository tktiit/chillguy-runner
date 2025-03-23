import { CONFIG } from './config.js';

// We'll access gameState via a global reference to avoid circular imports

// Generate initial platforms at the start of the game
function generateInitialPlatforms() {
  // Clear existing platforms
  gameState.platforms = [];
  
  // Calculate playable area height (from ground to a bit above)
  const groundY = gameState.canvas.height * CONFIG.GROUND_HEIGHT_RATIO;
  const playableHeight = groundY * 0.7; // Use 70% of the ground height for platforms
  
  // Generate 3-5 initial platforms at different heights
  const numPlatforms = 3 + Math.floor(Math.random() * 3);
  console.log(`Generating ${numPlatforms} initial platforms`);
  
  for (let i = 0; i < numPlatforms; i++) {
    const platformWidth = CONFIG.PLATFORM.MIN_WIDTH + 
      Math.random() * (CONFIG.PLATFORM.MAX_WIDTH - CONFIG.PLATFORM.MIN_WIDTH);
    
    // Distribute platforms across the screen width
    const segmentWidth = gameState.canvas.width / numPlatforms;
    const platformX = i * segmentWidth + Math.random() * (segmentWidth - platformWidth);
    
    // Vary platform heights
    const minHeight = groundY - playableHeight * CONFIG.PLATFORM.MAX_HEIGHT_RATIO;
    const maxHeight = groundY - playableHeight * CONFIG.PLATFORM.MIN_HEIGHT_RATIO;
    const platformY = minHeight + Math.random() * (maxHeight - minHeight);
    
    gameState.platforms.push({
      x: platformX,
      y: platformY,
      width: platformWidth,
      height: CONFIG.PLATFORM.HEIGHT,
    });
  }
  
  console.log('Platforms after initialization:', gameState.platforms);
}

// Spawn a new platform at the right edge of the screen
function spawnPlatform() {
  const platformWidth = CONFIG.PLATFORM.MIN_WIDTH + 
    Math.random() * (CONFIG.PLATFORM.MAX_WIDTH - CONFIG.PLATFORM.MIN_WIDTH);
  
  const groundY = gameState.canvas.height * CONFIG.GROUND_HEIGHT_RATIO;
  const playableHeight = groundY * 0.7;
  
  // Vary platform heights
  const minHeight = groundY - playableHeight * CONFIG.PLATFORM.MAX_HEIGHT_RATIO;
  const maxHeight = groundY - playableHeight * CONFIG.PLATFORM.MIN_HEIGHT_RATIO;
  const platformY = minHeight + Math.random() * (maxHeight - minHeight);
  
  gameState.platforms.push({
    x: gameState.canvas.width + 50, // Start just off-screen
    y: platformY,
    width: platformWidth,
    height: CONFIG.PLATFORM.HEIGHT,
  });
}

// Update platforms (move them and remove off-screen ones)
function updatePlatforms() {
  // Move platforms to the left
  const movementSpeed = CONFIG.MOVEMENT_SPEED * 0.8; // Slightly slower than obstacles
  
  // Filter out platforms that have moved off-screen
  gameState.platforms = gameState.platforms.filter(platform => {
    platform.x -= movementSpeed;
    return platform.x + platform.width > 0; // Keep if still visible
  });
}

// Draw all platforms
function drawPlatforms() {
  // Debug - log platform count
  if (gameState.frameCount % 60 === 0) {
    console.log(`Drawing ${gameState.platforms.length} platforms`);
  }
  
  gameState.platforms.forEach(platform => {
    // Check if platform image is available and loaded
    if (
      gameState.images.platform &&
      gameState.images.platform.complete &&
      gameState.images.platform.naturalWidth !== 0
    ) {
      // Draw platform image with proper scaling
      gameState.ctx.drawImage(
        gameState.images.platform,
        platform.x,
        platform.y,
        platform.width,
        platform.height
      );
    } else {
      // Fallback to drawing a styled platform
      // Platform shadow for 3D effect
      gameState.ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
      gameState.ctx.fillRect(
        platform.x + 5,
        platform.y + 5,
        platform.width,
        platform.height
      );
      
      // Main platform
      const platformGradient = gameState.ctx.createLinearGradient(
        platform.x,
        platform.y,
        platform.x,
        platform.y + platform.height
      );
      platformGradient.addColorStop(0, CONFIG.PLATFORM.COLOR);
      platformGradient.addColorStop(1, "#5D3A1A"); // Darker brown at bottom
      
      gameState.ctx.fillStyle = platformGradient;
      gameState.ctx.fillRect(
        platform.x,
        platform.y,
        platform.width,
        platform.height
      );
      
      // Platform top highlight
      gameState.ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
      gameState.ctx.fillRect(
        platform.x,
        platform.y,
        platform.width,
        platform.height / 3
      );
    }
  });
}

export { 
  generateInitialPlatforms, 
  spawnPlatform, 
  updatePlatforms, 
  drawPlatforms 
};
