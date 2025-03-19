// Device detection
const isMobile =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) || window.innerWidth < 768;

// Base configurations
const BASE_CONFIG = {
  GROUND_HEIGHT_RATIO: 0.75,
  GROUND_COLOR: {
    TOP: "#90EE90",
    BOTTOM: "#228B22",
  },
  HUD: {
    SPACING_RATIO: 0.05,
    METER_HEIGHT: 30,
  },
  SCORE_INCREMENT: 10,
};

// Mobile-specific configuration
const MOBILE_CONFIG = {
  ...BASE_CONFIG,
  JUMP_VELOCITY: -15,
  GRAVITY: 0.45,
  HUD: {
    ...BASE_CONFIG.HUD,
    MIN_SPACING: 20,
  },
  SPAWN_RATES: {
    TOKEN: 0.03,
    OBSTACLE: 0.015,
  },
  MOVEMENT_SPEED: 5,
  CHILL_METER: {
    INCREMENT: 5,
    DECREMENT: 20,
  },
  SIZES: {
    PLAYER: {
      BASE_RATIO: 0.22, // Slightly larger relative size for visibility
      MAX_SIZE: 120,
    },
    TOKEN: {
      BASE_RATIO: 0.12,
      MAX_SIZE: 80,
    },
    OBSTACLE: {
      BASE_RATIO: 0.12,
      MAX_SIZE: 80,
    },
  },
};

// Desktop-specific configuration
const DESKTOP_CONFIG = {
  ...BASE_CONFIG,
  JUMP_VELOCITY: -20,
  GRAVITY: 0.5,
  HUD: {
    ...BASE_CONFIG.HUD,
    MIN_SPACING: 40,
  },
  SPAWN_RATES: {
    TOKEN: 0.03,
    OBSTACLE: 0.015,
  },
  MOVEMENT_SPEED: 10,
  CHILL_METER: {
    INCREMENT: 5,
    DECREMENT: 20,
  },
  SIZES: {
    PLAYER: {
      BASE_RATIO: 0.2,
      MAX_SIZE: 150,
    },
    TOKEN: {
      BASE_RATIO: 0.1,
      MAX_SIZE: 100,
    },
    OBSTACLE: {
      BASE_RATIO: 0.1,
      MAX_SIZE: 100,
    },
  },
};

// Select the appropriate configuration based on device
const CONFIG = isMobile ? MOBILE_CONFIG : DESKTOP_CONFIG;

// Ensure spawn rates and movement speed are properly set
if (!CONFIG.SPAWN_RATES) {
  CONFIG.SPAWN_RATES = {
    TOKEN: 0.03,
    OBSTACLE: 0.015
  };
}

if (!CONFIG.MOVEMENT_SPEED) {
  CONFIG.MOVEMENT_SPEED = isMobile ? 5 : 10;
}

// Game State
const gameState = {
  canvas: document.getElementById("gameCanvas"),
  ctx: document.getElementById("gameCanvas").getContext("2d"),
  images: {
    player: document.getElementById("playerImage"),
    token: document.getElementById("tokenImage"),
    obstacle: document.getElementById("obstacleImage"),
  },
  hud: {
    y: 0,
    width: 0,
    x: 0,
    padding: 0,
    scoreFontSize: 0,
    chillFontSize: 0,
    gameOverFontSize: 0,
  },
  player: null,
  chillMeter: 100,
  vibeTokens: [],
  obstacles: [],
  clouds: [],
  score: 0,
  gameOver: false,
  frameCount: 0,
  lastFrameTime: 0,
};

// Initialize game state
function initializeGame() {
  // Set canvas size
  gameState.canvas.width = window.innerWidth;
  gameState.canvas.height = window.innerHeight;

  // Initialize base sizes
  const smallerDimension = Math.min(
    gameState.canvas.width,
    gameState.canvas.height
  );
  const baseSize = Math.min(
    CONFIG.SIZES.PLAYER.MAX_SIZE,
    smallerDimension * CONFIG.SIZES.PLAYER.BASE_RATIO
  );

  // Initialize player
  gameState.player = {
    x: 50,
    y: gameState.canvas.height * CONFIG.GROUND_HEIGHT_RATIO - baseSize,
    width: baseSize,
    height: baseSize,
    speed: 5,
    jumping: false,
    jumpHeight: 100,
    yVelocity: 0,
    frame: 0,
    frameCount: 0,
    spriteWidth: gameState.images.player.width,
    spriteHeight: gameState.images.player.height,
  };

  // Initialize clouds
  for (let i = 0; i < 5; i++) {
    gameState.clouds.push({
      x: Math.random() * gameState.canvas.width,
      y: Math.random() * (gameState.canvas.height / 2),
      speed: 0.5 + Math.random() * 0.5,
      size: 30 + Math.random() * 40,
    });
  }

  // Initial HUD setup
  handleResize();
}

// Handle window resize
function handleResize() {
  // Check if device type has changed (e.g., when rotating from portrait to landscape)
  const wasIsMobile = isMobile;
  const newIsMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) || window.innerWidth < 768;

  // If device type changed, reload the page to apply the correct configuration
  if (wasIsMobile !== newIsMobile) {
    window.location.reload();
    return;
  }

  gameState.canvas.width = window.innerWidth;
  gameState.canvas.height = window.innerHeight;

  const smallerDimension = Math.min(
    gameState.canvas.width,
    gameState.canvas.height
  );
  const baseSize = Math.min(
    CONFIG.SIZES.PLAYER.MAX_SIZE,
    smallerDimension * CONFIG.SIZES.PLAYER.BASE_RATIO
  );

  // Update player
  gameState.player.width = baseSize;
  gameState.player.height = baseSize;
  gameState.player.y =
    gameState.canvas.height * CONFIG.GROUND_HEIGHT_RATIO - baseSize;

  // Update HUD
  gameState.hud.y = smallerDimension * 0.08;
  gameState.hud.width = Math.min(400, gameState.canvas.width * 0.8);
  gameState.hud.x = (gameState.canvas.width - gameState.hud.width) / 2;
  gameState.hud.padding = smallerDimension * 0.03;

  // Update font sizes
  gameState.hud.scoreFontSize = Math.max(24, smallerDimension * 0.05);
  gameState.hud.chillFontSize = Math.max(18, smallerDimension * 0.04);
  gameState.hud.gameOverFontSize = Math.max(36, smallerDimension * 0.08);
}

// Game object spawners
function spawnToken() {
  // Ensure token size is appropriate
  const tokenSize = Math.min(
    CONFIG.SIZES.TOKEN.MAX_SIZE || 100,
    gameState.canvas.width * (CONFIG.SIZES.TOKEN.BASE_RATIO || 0.1)
  );
  
  // Randomize vertical position slightly for variety
  const yVariation = Math.random() * 50 - 25; // -25 to +25 pixels
  
  // Create token with guaranteed position values
  return {
    x: gameState.canvas.width + 20, // Start slightly off-screen
    y: (gameState.canvas.height * CONFIG.GROUND_HEIGHT_RATIO - tokenSize) + yVariation,
    width: tokenSize,
    height: tokenSize,
    spriteWidth: gameState.images.token.width || 32,
    spriteHeight: gameState.images.token.height || 32,
  };
}

function spawnObstacle() {
  // Ensure obstacle size is appropriate
  const obstacleSize = Math.min(
    CONFIG.SIZES.OBSTACLE.MAX_SIZE || 100,
    gameState.canvas.width * (CONFIG.SIZES.OBSTACLE.BASE_RATIO || 0.1)
  );
  
  // Vary the height slightly for visual interest
  const heightVariation = Math.random() * 0.3 + 0.85; // 0.85 to 1.15 multiplier
  const obstacleHeight = obstacleSize * heightVariation;
  
  // Create obstacle with guaranteed position values
  return {
    x: gameState.canvas.width + 20, // Start slightly off-screen
    y: gameState.canvas.height * CONFIG.GROUND_HEIGHT_RATIO - obstacleHeight,
    width: obstacleSize,
    height: obstacleHeight,
    spriteWidth: gameState.images.obstacle.width || 32,
    spriteHeight: gameState.images.obstacle.height || 32,
  };
}

// Game mechanics
function jump() {
  if (!gameState.player.jumping) {
    gameState.player.jumping = true;
    gameState.player.yVelocity = CONFIG.JUMP_VELOCITY;
  }
}

function resetGame() {
  const smallerDimension = Math.min(
    gameState.canvas.width,
    gameState.canvas.height
  );
  const baseSize = Math.min(
    CONFIG.SIZES.PLAYER.MAX_SIZE,
    smallerDimension * CONFIG.SIZES.PLAYER.BASE_RATIO
  );

  gameState.player = {
    x: 50,
    y: gameState.canvas.height * CONFIG.GROUND_HEIGHT_RATIO - baseSize,
    width: baseSize,
    height: baseSize,
    speed: 5,
    jumping: false,
    jumpHeight: 100,
    yVelocity: 0,
    frame: 0,
    frameCount: 0,
    spriteWidth: gameState.images.player.width,
    spriteHeight: gameState.images.player.height,
  };
  gameState.chillMeter = 100;
  gameState.vibeTokens = [];
  gameState.obstacles = [];
  gameState.score = 0;
  gameState.gameOver = false;
}

// Collision detection
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

// Drawing functions
function drawCloud(x, y, size, opacity = 0.9) {
  gameState.ctx.save();
  
  // Create a more fluffy, detailed cloud with shadow
  // Cloud shadow
  gameState.ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
  gameState.ctx.beginPath();
  gameState.ctx.ellipse(x + size * 0.4, y + size * 0.6, size * 0.7, size * 0.2, 0, 0, Math.PI * 2);
  gameState.ctx.fill();
  
  // Main cloud
  gameState.ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
  gameState.ctx.beginPath();
  gameState.ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
  gameState.ctx.arc(x + size * 0.4, y - size * 0.2, size * 0.3, 0, Math.PI * 2);
  gameState.ctx.arc(x + size * 0.4, y + size * 0.2, size * 0.3, 0, Math.PI * 2);
  gameState.ctx.arc(x + size * 0.7, y, size * 0.4, 0, Math.PI * 2);
  
  // Additional details for fluffier clouds
  gameState.ctx.arc(x + size * 0.2, y + size * 0.3, size * 0.25, 0, Math.PI * 2);
  gameState.ctx.arc(x + size * 0.6, y + size * 0.1, size * 0.3, 0, Math.PI * 2);
  
  gameState.ctx.fill();
  
  // Add subtle highlight
  gameState.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  gameState.ctx.beginPath();
  gameState.ctx.arc(x + size * 0.2, y - size * 0.1, size * 0.15, 0, Math.PI * 2);
  gameState.ctx.fill();
  
  gameState.ctx.restore();
}

function drawMountains() {
  // Draw distant mountains for parallax effect
  const mountainHeight = gameState.canvas.height * 0.2;
  const baseY = gameState.canvas.height * CONFIG.GROUND_HEIGHT_RATIO;
  
  // First mountain range (furthest)
  const mountainGradient1 = gameState.ctx.createLinearGradient(0, baseY - mountainHeight, 0, baseY);
  mountainGradient1.addColorStop(0, '#8BB9DD'); // Light blue-gray
  mountainGradient1.addColorStop(1, '#6A8CAD'); // Darker blue-gray
  gameState.ctx.fillStyle = mountainGradient1;
  
  gameState.ctx.beginPath();
  gameState.ctx.moveTo(0, baseY);
  
  // Create jagged mountain silhouette
  const mountainWidth = gameState.canvas.width * 1.5;
  const segments = 10;
  const segmentWidth = mountainWidth / segments;
  
  for (let i = 0; i <= segments; i++) {
    const x = i * segmentWidth;
    // Use sine function for natural-looking mountains
    const heightVariation = Math.sin(i * 0.8) * 0.3 + 0.7;
    const y = baseY - mountainHeight * heightVariation;
    gameState.ctx.lineTo(x, y);
  }
  
  gameState.ctx.lineTo(mountainWidth, baseY);
  gameState.ctx.closePath();
  gameState.ctx.fill();
  
  // Second mountain range (closer)
  const mountainGradient2 = gameState.ctx.createLinearGradient(0, baseY - mountainHeight * 0.7, 0, baseY);
  mountainGradient2.addColorStop(0, '#6A8CAD'); // Match the darker color from first range
  mountainGradient2.addColorStop(1, '#5D7E9C'); // Even darker blue-gray
  gameState.ctx.fillStyle = mountainGradient2;
  
  gameState.ctx.beginPath();
  gameState.ctx.moveTo(0, baseY);
  
  // Create jagged mountain silhouette with different pattern
  for (let i = 0; i <= segments; i++) {
    const x = i * segmentWidth - 100; // Offset for variation
    // Different sine pattern for second range
    const heightVariation = Math.sin(i * 1.2 + 2) * 0.4 + 0.6;
    const y = baseY - (mountainHeight * 0.7) * heightVariation;
    gameState.ctx.lineTo(x, y);
  }
  
  gameState.ctx.lineTo(mountainWidth, baseY);
  gameState.ctx.closePath();
  gameState.ctx.fill();
}

function drawGrassDetails() {
  const groundY = gameState.canvas.height * CONFIG.GROUND_HEIGHT_RATIO;
  const grassHeight = Math.min(15, gameState.canvas.height * 0.02);
  
  gameState.ctx.fillStyle = '#90EE90'; // Light green
  
  // Draw individual grass blades
  for (let x = 0; x < gameState.canvas.width; x += 15) {
    const randomHeight = grassHeight * (0.7 + Math.random() * 0.6);
    const randomWidth = 2 + Math.random() * 3;
    
    gameState.ctx.beginPath();
    gameState.ctx.moveTo(x, groundY);
    gameState.ctx.lineTo(x + randomWidth/2, groundY - randomHeight);
    gameState.ctx.lineTo(x + randomWidth, groundY);
    gameState.ctx.closePath();
    gameState.ctx.fill();
  }
}

function drawGroundTexture() {
  const groundY = gameState.canvas.height * CONFIG.GROUND_HEIGHT_RATIO;
  const groundHeight = gameState.canvas.height * 0.25;
  
  // Add subtle texture to ground
  gameState.ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
  
  // Draw some random dots/specs for texture
  for (let i = 0; i < 100; i++) {
    const x = Math.random() * gameState.canvas.width;
    const y = groundY + Math.random() * groundHeight * 0.7;
    const size = 1 + Math.random() * 3;
    
    gameState.ctx.beginPath();
    gameState.ctx.arc(x, y, size, 0, Math.PI * 2);
    gameState.ctx.fill();
  }
}

function drawScaledImage(
  img,
  x,
  y,
  targetWidth,
  targetHeight,
  centered = false,
  fallbackDraw
) {
  if (img && img.complete && img.naturalWidth !== 0) {
    const scale = Math.min(targetWidth / img.width, targetHeight / img.height);
    const scaledWidth = img.width * scale;
    const scaledHeight = img.height * scale;

    const drawX = centered ? x - scaledWidth / 2 : x;
    const drawY = centered ? y - scaledHeight / 2 : y;

    gameState.ctx.drawImage(img, drawX, drawY, scaledWidth, scaledHeight);

    return {
      x: drawX,
      y: drawY,
      width: scaledWidth,
      height: scaledHeight,
    };
  } else if (fallbackDraw) {
    fallbackDraw(x, y, targetWidth, targetHeight);
    return {
      x: x,
      y: y,
      width: targetWidth,
      height: targetHeight,
    };
  }
  return null;
}

// Helper function to draw rounded rectangles
function roundedRect(ctx, x, y, width, height, radius) {
  if (width < 2 * radius) radius = width / 2;
  if (height < 2 * radius) radius = height / 2;
  
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
  return ctx;
}

// Game loop functions
function update() {
  if (gameState.gameOver) return;

  // Update clouds
  gameState.clouds.forEach((cloud) => {
    cloud.x -= cloud.speed;
    if (cloud.x + cloud.size < 0) {
      cloud.x = gameState.canvas.width;
      cloud.y = Math.random() * (gameState.canvas.height / 2);
    }
  });

  // Animate player
  gameState.player.frameCount++;
  if (gameState.player.frameCount > 5) {
    gameState.player.frame = (gameState.player.frame + 1) % 4;
    gameState.player.frameCount = 0;
  }

  // Update player position
  if (gameState.player.jumping) {
    gameState.player.y += gameState.player.yVelocity;
    gameState.player.yVelocity += CONFIG.GRAVITY;
    if (
      gameState.player.y >=
      gameState.canvas.height * CONFIG.GROUND_HEIGHT_RATIO -
        gameState.player.height
    ) {
      gameState.player.y =
        gameState.canvas.height * CONFIG.GROUND_HEIGHT_RATIO -
        gameState.player.height;
      gameState.player.jumping = false;
    }
  }

  // Spawn objects
  if (Math.random() < (CONFIG.SPAWN_RATES.TOKEN || 0.03)) {
    gameState.vibeTokens.push(spawnToken());
  }
  if (Math.random() < (CONFIG.SPAWN_RATES.OBSTACLE || 0.015)) {
    gameState.obstacles.push(spawnObstacle());
  }
  
  // Debug log for spawning
  if (gameState.frameCount % 60 === 0) {
    console.log(`Current tokens: ${gameState.vibeTokens.length}, obstacles: ${gameState.obstacles.length}`);
  }

  // Move objects with a guaranteed minimum speed
  const movementSpeed = CONFIG.MOVEMENT_SPEED || (isMobile ? 5 : 10);
  
  // Log movement speed for debugging
  if (gameState.frameCount % 60 === 0) {
    console.log(`Movement speed: ${movementSpeed}`);
  }
  
  // Move tokens and obstacles
  gameState.vibeTokens.forEach((token) => {
    token.x -= movementSpeed;
  });
  
  gameState.obstacles.forEach((obstacle) => {
    obstacle.x -= movementSpeed;
  });

  // Handle collisions
  gameState.vibeTokens = gameState.vibeTokens.filter((token) => {
    if (checkCollision(gameState.player, token)) {
      gameState.score += CONFIG.SCORE_INCREMENT;
      gameState.chillMeter = Math.min(
        gameState.chillMeter + CONFIG.CHILL_METER.INCREMENT,
        100
      );
      return false;
    }
    return token.x > -token.width;
  });

  gameState.obstacles = gameState.obstacles.filter((obstacle) => {
    if (checkCollision(gameState.player, obstacle)) {
      gameState.chillMeter -= CONFIG.CHILL_METER.DECREMENT;
      return false;
    }
    return obstacle.x > -obstacle.width;
  });

  // Check game over
  if (gameState.chillMeter <= 0) {
    gameState.gameOver = true;
  }
}

function draw() {
  // Clear canvas
  gameState.ctx.clearRect(
    0,
    0,
    gameState.canvas.width,
    gameState.canvas.height
  );

  // Draw sky with gradient
  const skyGradient = gameState.ctx.createLinearGradient(
    0, 0, 0, gameState.canvas.height * CONFIG.GROUND_HEIGHT_RATIO
  );
  skyGradient.addColorStop(0, '#87CEEB'); // Sky blue at top
  skyGradient.addColorStop(1, '#C9E9F6'); // Lighter blue near ground
  gameState.ctx.fillStyle = skyGradient;
  gameState.ctx.fillRect(0, 0, gameState.canvas.width, gameState.canvas.height * CONFIG.GROUND_HEIGHT_RATIO);
  
  // Draw distant mountains for depth
  drawMountains();
  
  // Draw clouds with parallax effect
  gameState.clouds.forEach((cloud) => drawCloud(cloud.x, cloud.y, cloud.size, cloud.opacity));

  // Draw ground with more detailed gradient
  const groundHeight = gameState.canvas.height * 0.25;
  const groundGradient = gameState.ctx.createLinearGradient(
    0,
    gameState.canvas.height - groundHeight,
    0,
    gameState.canvas.height
  );
  groundGradient.addColorStop(0, CONFIG.GROUND_COLOR.TOP);
  groundGradient.addColorStop(0.3, '#7BC47F'); // Middle tone
  groundGradient.addColorStop(1, CONFIG.GROUND_COLOR.BOTTOM);
  gameState.ctx.fillStyle = groundGradient;
  gameState.ctx.fillRect(
    0,
    gameState.canvas.height - groundHeight,
    gameState.canvas.width,
    groundHeight
  );
  
  // Draw grass details on top of the ground
  drawGrassDetails();
  
  // Draw ground texture
  drawGroundTexture();

  // Draw game elements if not game over
  if (!gameState.gameOver) {
    // Draw player
    const playerBounds = drawScaledImage(
      gameState.images.player,
      gameState.player.x,
      gameState.player.y,
      gameState.player.width,
      gameState.player.height,
      false,
      (x, y, width, height) => {
        gameState.ctx.save();
        gameState.ctx.fillStyle = "#4169E1";
        gameState.ctx.fillRect(x, y, width, height);

        gameState.ctx.fillStyle = "#FFD700";
        gameState.ctx.fillRect(
          x + width * 0.2,
          y + height * 0.3,
          width * 0.6,
          height * 0.16
        );

        gameState.ctx.beginPath();
        gameState.ctx.arc(
          x + width * 0.5,
          y + height * 0.7,
          width * 0.2,
          0,
          Math.PI
        );
        gameState.ctx.stroke();

        if (!gameState.player.jumping) {
          const legOffset =
            Math.sin((gameState.player.frame * Math.PI) / 2) * 10;
          gameState.ctx.fillStyle = "#4169E1";
          gameState.ctx.fillRect(
            x + width * 0.2,
            y + height,
            width * 0.16,
            20 + legOffset
          );
          gameState.ctx.fillRect(
            x + width * 0.6,
            y + height,
            width * 0.16,
            20 - legOffset
          );
        }
        gameState.ctx.restore();
      }
    );

    gameState.player.actualWidth = playerBounds.width;
    gameState.player.actualHeight = playerBounds.height;

    // Draw tokens
    gameState.vibeTokens.forEach((token) => {
      drawScaledImage(
        gameState.images.token,
        token.x,
        token.y,
        token.width,
        token.height,
        true,
        (x, y, width, height) => {
          gameState.ctx.save();
          gameState.ctx.shadowColor = "#FFD700";
          gameState.ctx.shadowBlur = 15;
          gameState.ctx.fillStyle = "#FFD700";
          gameState.ctx.beginPath();
          gameState.ctx.arc(
            x + width / 2,
            y + height / 2,
            width / 2,
            0,
            Math.PI * 2
          );
          gameState.ctx.fill();
          gameState.ctx.fillStyle = "#FFF8DC";
          gameState.ctx.beginPath();
          gameState.ctx.arc(
            x + width / 3,
            y + height / 3,
            width / 6,
            0,
            Math.PI * 2
          );
          gameState.ctx.fill();
          gameState.ctx.restore();
        }
      );
    });

    // Draw obstacles
    gameState.obstacles.forEach((obstacle) => {
      drawScaledImage(
        gameState.images.obstacle,
        obstacle.x,
        obstacle.y,
        obstacle.width,
        obstacle.height,
        false,
        (x, y, width, height) => {
          gameState.ctx.save();
          const obstacleGradient = gameState.ctx.createLinearGradient(
            x,
            y,
            x,
            y + height
          );
          obstacleGradient.addColorStop(0, "#FF4444");
          obstacleGradient.addColorStop(1, "#CC0000");
          gameState.ctx.fillStyle = obstacleGradient;
          gameState.ctx.fillRect(x, y, width, height);

          gameState.ctx.beginPath();
          gameState.ctx.moveTo(x, y);
          gameState.ctx.lineTo(x + width / 2, y - 10);
          gameState.ctx.lineTo(x + width, y);
          gameState.ctx.fillStyle = "#CC0000";
          gameState.ctx.fill();
          gameState.ctx.restore();
        }
      );
    });
  }

  // Draw HUD with enhanced styling
  // First, draw a subtle backdrop for the HUD
  const hudBackdropY = gameState.hud.y - gameState.hud.scoreFontSize * 1.2;
  const hudBackdropHeight = gameState.hud.scoreFontSize * 1.2 + gameState.hud.padding * 3 + CONFIG.HUD.METER_HEIGHT;
  
  // Create a semi-transparent backdrop with rounded corners
  gameState.ctx.save();
  gameState.ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
  roundedRect(
    gameState.ctx,
    gameState.hud.x - gameState.hud.padding,
    hudBackdropY,
    gameState.hud.width + gameState.hud.padding * 2,
    hudBackdropHeight,
    10
  );
  gameState.ctx.fill();
  
  // Add a subtle border
  gameState.ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
  gameState.ctx.lineWidth = 2;
  roundedRect(
    gameState.ctx,
    gameState.hud.x - gameState.hud.padding,
    hudBackdropY,
    gameState.hud.width + gameState.hud.padding * 2,
    hudBackdropHeight,
    10
  );
  gameState.ctx.stroke();
  gameState.ctx.restore();
  
  // Draw score with enhanced styling
  gameState.ctx.save();
  gameState.ctx.font = `bold ${gameState.hud.scoreFontSize}px Poppins, Arial`;
  gameState.ctx.textAlign = "center";
  
  // Text shadow for depth
  gameState.ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
  gameState.ctx.shadowBlur = 5;
  gameState.ctx.shadowOffsetX = 2;
  gameState.ctx.shadowOffsetY = 2;
  
  // Create a gradient for the score text
  const scoreGradient = gameState.ctx.createLinearGradient(
    gameState.canvas.width / 2 - 100, 
    gameState.hud.y - gameState.hud.scoreFontSize, 
    gameState.canvas.width / 2 + 100, 
    gameState.hud.y
  );
  scoreGradient.addColorStop(0, "#4CAF50");
  scoreGradient.addColorStop(1, "#2E7D32");
  gameState.ctx.fillStyle = scoreGradient;
  
  gameState.ctx.fillText(
    `Score: ${gameState.score}`,
    gameState.canvas.width / 2,
    gameState.hud.y
  );
  gameState.ctx.restore();

  // Draw chill meter with enhanced styling
  gameState.ctx.save();
  
  // Meter background with rounded corners
  gameState.ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
  const meterY = gameState.hud.y + gameState.hud.padding * 2;
  const meterHeight = CONFIG.HUD.METER_HEIGHT;
  const cornerRadius = Math.min(8, meterHeight / 2);
  
  roundedRect(
    gameState.ctx,
    gameState.hud.x,
    meterY,
    gameState.hud.width,
    meterHeight,
    cornerRadius
  );
  gameState.ctx.fill();
  
  // Create a dynamic gradient based on chill level
  const chillGradient = gameState.ctx.createLinearGradient(
    gameState.hud.x,
    0,
    gameState.hud.x + gameState.hud.width,
    0
  );
  
  if (gameState.chillMeter > 70) {
    // High chill - cool colors
    chillGradient.addColorStop(0, "#00FF87");
    chillGradient.addColorStop(1, "#60efff");
  } else if (gameState.chillMeter > 30) {
    // Medium chill - warm colors
    chillGradient.addColorStop(0, "#FFC107");
    chillGradient.addColorStop(1, "#FF9800");
  } else {
    // Low chill - hot colors
    chillGradient.addColorStop(0, "#FF5722");
    chillGradient.addColorStop(1, "#F44336");
  }
  
  gameState.ctx.fillStyle = chillGradient;
  
  // Fill meter with rounded corners
  const fillWidth = Math.max(cornerRadius * 2, (gameState.hud.width * gameState.chillMeter) / 100);
  roundedRect(
    gameState.ctx,
    gameState.hud.x,
    meterY,
    fillWidth,
    meterHeight,
    cornerRadius
  );
  gameState.ctx.fill();
  
  // Add a subtle highlight to the top of the meter for 3D effect
  gameState.ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
  gameState.ctx.beginPath();
  gameState.ctx.moveTo(gameState.hud.x + cornerRadius, meterY);
  gameState.ctx.lineTo(gameState.hud.x + fillWidth - cornerRadius, meterY);
  gameState.ctx.quadraticCurveTo(
    gameState.hud.x + fillWidth, meterY,
    gameState.hud.x + fillWidth, meterY + cornerRadius
  );
  gameState.ctx.lineTo(gameState.hud.x + fillWidth, meterY + meterHeight / 3);
  gameState.ctx.lineTo(gameState.hud.x + cornerRadius, meterY + meterHeight / 3);
  gameState.ctx.quadraticCurveTo(
    gameState.hud.x, meterY + meterHeight / 3,
    gameState.hud.x, meterY + cornerRadius
  );
  gameState.ctx.closePath();
  gameState.ctx.fill();
  gameState.ctx.restore();

  // Draw chill percentage with enhanced styling
  gameState.ctx.save();
  gameState.ctx.font = `bold ${gameState.hud.chillFontSize}px Poppins, Arial`;
  gameState.ctx.textAlign = "center";
  
  // Text shadow
  gameState.ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
  gameState.ctx.shadowBlur = 3;
  gameState.ctx.shadowOffsetX = 1;
  gameState.ctx.shadowOffsetY = 1;
  
  // Create gradient for text
  const chillTextGradient = gameState.ctx.createLinearGradient(
    gameState.canvas.width / 2 - 80, 
    0, 
    gameState.canvas.width / 2 + 80, 
    0
  );
  
  if (gameState.chillMeter > 70) {
    chillTextGradient.addColorStop(0, "#2E7D32");
    chillTextGradient.addColorStop(1, "#1B5E20");
  } else if (gameState.chillMeter > 30) {
    chillTextGradient.addColorStop(0, "#F57F17");
    chillTextGradient.addColorStop(1, "#E65100");
  } else {
    chillTextGradient.addColorStop(0, "#C62828");
    chillTextGradient.addColorStop(1, "#B71C1C");
  }
  
  gameState.ctx.fillStyle = chillTextGradient;
  
  const chillTextSpacing = Math.max(
    CONFIG.HUD.MIN_SPACING,
    gameState.canvas.height * CONFIG.HUD.SPACING_RATIO
  );
  
  gameState.ctx.fillText(
    `Chill: ${Math.round(gameState.chillMeter)}%`,
    gameState.canvas.width / 2,
    gameState.hud.y +
      gameState.hud.padding * 2 +
      CONFIG.HUD.METER_HEIGHT +
      chillTextSpacing
  );

  // Reset shadow
  gameState.ctx.shadowBlur = 0;
  gameState.ctx.shadowOffsetX = 0;
  gameState.ctx.shadowOffsetY = 0;

  // Draw game over screen
  if (gameState.gameOver) {
    gameState.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    gameState.ctx.fillRect(
      0,
      0,
      gameState.canvas.width,
      gameState.canvas.height
    );

    gameState.ctx.fillStyle = "#FFFFFF";
    gameState.ctx.font = `bold ${gameState.hud.gameOverFontSize}px Arial`;
    gameState.ctx.textAlign = "center";
    gameState.ctx.fillText(
      "GAME OVER",
      gameState.canvas.width / 2,
      gameState.canvas.height / 2 - gameState.canvas.height * 0.1
    );

    gameState.ctx.font = `bold ${gameState.hud.gameOverFontSize * 0.7}px Arial`;
    gameState.ctx.fillText(
      `Final Score: ${gameState.score}`,
      gameState.canvas.width / 2,
      gameState.canvas.height / 2
    );

    const buttonWidth = Math.min(200, gameState.canvas.width * 0.4);
    const buttonHeight = Math.min(60, gameState.canvas.height * 0.08);
    const buttonX = (gameState.canvas.width - buttonWidth) / 2;
    const buttonY =
      gameState.canvas.height / 2 + gameState.canvas.height * 0.05;

    const buttonGradient = gameState.ctx.createLinearGradient(
      buttonX,
      buttonY,
      buttonX,
      buttonY + buttonHeight
    );
    buttonGradient.addColorStop(0, "#4CAF50");
    buttonGradient.addColorStop(1, "#45a049");
    gameState.ctx.fillStyle = buttonGradient;
    gameState.ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);

    gameState.ctx.fillStyle = "#FFFFFF";
    gameState.ctx.font = `bold ${Math.min(
      24,
      gameState.canvas.width * 0.05
    )}px Arial`;
    gameState.ctx.fillText(
      "Play Again",
      gameState.canvas.width / 2,
      buttonY + buttonHeight * 0.65
    );
  }
}

// Event handlers
function handleInteraction(event) {
  event.preventDefault();

  if (gameState.gameOver) {
    const rect = gameState.canvas.getBoundingClientRect();
    const scaleX = gameState.canvas.width / rect.width;
    const scaleY = gameState.canvas.height / rect.height;

    let clickX, clickY;
    if (event.type === "touchstart") {
      clickX = (event.touches[0].clientX - rect.left) * scaleX;
      clickY = (event.touches[0].clientY - rect.top) * scaleY;
    } else {
      clickX = (event.clientX - rect.left) * scaleX;
      clickY = (event.clientY - rect.top) * scaleY;
    }

    const buttonWidth = Math.min(200, gameState.canvas.width * 0.4);
    const buttonHeight = Math.min(60, gameState.canvas.height * 0.08);
    const buttonX = (gameState.canvas.width - buttonWidth) / 2;
    const buttonY =
      gameState.canvas.height / 2 + gameState.canvas.height * 0.05;

    if (
      clickX >= buttonX &&
      clickX <= buttonX + buttonWidth &&
      clickY >= buttonY &&
      clickY <= buttonY + buttonHeight
    ) {
      resetGame();
    }
  } else {
    jump();
  }
}

// Initialize game and start
function startGame() {
  initializeGame();
  window.addEventListener("resize", handleResize);
  gameState.canvas.addEventListener("mousedown", handleInteraction);
  gameState.canvas.addEventListener("touchstart", handleInteraction);
  document.addEventListener("keydown", (event) => {
    if (event.code === "Space") {
      event.preventDefault();
      if (gameState.gameOver) {
        resetGame();
      } else {
        jump();
      }
    }
  });

  function gameLoop(timestamp) {
    // Calculate delta time for smooth animations
    if (!gameState.lastFrameTime) {
      gameState.lastFrameTime = timestamp;
    }
    const deltaTime = timestamp - gameState.lastFrameTime;
    gameState.lastFrameTime = timestamp;
    
    // Increment frame counter for animations and debugging
    gameState.frameCount++;
    
    // Update game state
    update();
    
    // Draw everything
    draw();
    
    // Continue the game loop
    requestAnimationFrame(gameLoop);
  }

  gameLoop();
}

startGame();

// Log which configuration is being used
console.log(
  `Game running with ${isMobile ? "MOBILE" : "DESKTOP"} configuration`
);
