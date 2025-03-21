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
  PLATFORM: {
    MIN_WIDTH: 100,
    MAX_WIDTH: 200,
    HEIGHT: 20,
    MIN_GAP: 200,
    MAX_GAP: 400,
    MIN_HEIGHT_RATIO: 0.4, // Minimum height from ground (as ratio of playable area)
    MAX_HEIGHT_RATIO: 0.65, // Maximum height from ground (as ratio of playable area)
    SPAWN_RATE: 0.01, // Chance to spawn a platform each frame
    COLOR: "#8B4513", // Brown color for platforms
  },
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
    OBSTACLE: 0.015,
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
    sky: document.getElementById("skyImage"),
    mountains: document.getElementById("mountainsImage"),
    ground: document.getElementById("groundImage"),
    platform: document.getElementById("platformImage"), // Platform image (optional)
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
  platforms: [], // Array to store platforms
  skyObjects: [], // Renamed from clouds to be more generic
  skyObjectType: "asteroids", // Can be 'clouds', 'asteroids', or 'rockets'
  score: 0,
  gameOver: false,
  showMountains: false, // Flag to control mountain visibility
  frameCount: 0,
  lastFrameTime: 0,
  onPlatform: false, // Flag to track if player is on a platform
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

  // Initialize sky objects (clouds, asteroids, or rockets)
  for (let i = 0; i < 5; i++) {
    gameState.skyObjects.push({
      x: Math.random() * gameState.canvas.width,
      y: Math.random() * (gameState.canvas.height / 2),
      speed: 0.5 + Math.random() * 0.5,
      size: 30 + Math.random() * 40,
      rotation: Math.random() * Math.PI * 2, // For asteroids and rockets
      opacity: 0.7 + Math.random() * 0.3,
    });
  }
  
  // Initialize platforms
  generateInitialPlatforms();

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
    y:
      gameState.canvas.height * CONFIG.GROUND_HEIGHT_RATIO -
      tokenSize +
      yVariation,
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
    gameState.onPlatform = false; // No longer on platform when jumping
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
function drawSkyObject(x, y, size, opacity = 0.9, rotation = 0) {
  gameState.ctx.save();

  // Choose drawing method based on skyObjectType
  switch (gameState.skyObjectType) {
    case "asteroids":
      drawAsteroid(x, y, size, opacity, rotation);
      break;
    case "rockets":
      drawRocket(x, y, size, opacity, rotation);
      break;
    case "clouds":
    default:
      drawCloud(x, y, size, opacity);
      break;
  }

  gameState.ctx.restore();
}

function drawCloud(x, y, size, opacity = 0.9) {
  // Cloud shadow
  gameState.ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
  gameState.ctx.beginPath();
  gameState.ctx.ellipse(
    x + size * 0.4,
    y + size * 0.6,
    size * 0.7,
    size * 0.2,
    0,
    0,
    Math.PI * 2
  );
  gameState.ctx.fill();

  // Main cloud
  gameState.ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
  gameState.ctx.beginPath();
  gameState.ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
  gameState.ctx.arc(x + size * 0.4, y - size * 0.2, size * 0.3, 0, Math.PI * 2);
  gameState.ctx.arc(x + size * 0.4, y + size * 0.2, size * 0.3, 0, Math.PI * 2);
  gameState.ctx.arc(x + size * 0.7, y, size * 0.4, 0, Math.PI * 2);

  // Additional details for fluffier clouds
  gameState.ctx.arc(
    x + size * 0.2,
    y + size * 0.3,
    size * 0.25,
    0,
    Math.PI * 2
  );
  gameState.ctx.arc(x + size * 0.6, y + size * 0.1, size * 0.3, 0, Math.PI * 2);

  gameState.ctx.fill();

  // Add subtle highlight
  gameState.ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  gameState.ctx.beginPath();
  gameState.ctx.arc(
    x + size * 0.2,
    y - size * 0.1,
    size * 0.15,
    0,
    Math.PI * 2
  );
  gameState.ctx.fill();
}

function drawAsteroid(x, y, size, opacity = 0.9, rotation = 0) {
  gameState.ctx.translate(x, y);
  gameState.ctx.rotate(rotation);

  // Asteroid shadow
  gameState.ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
  gameState.ctx.beginPath();
  gameState.ctx.ellipse(
    size * 0.1,
    size * 0.1,
    size * 0.5,
    size * 0.5,
    0,
    0,
    Math.PI * 2
  );
  gameState.ctx.fill();

  // Main asteroid body - irregular shape
  gameState.ctx.fillStyle = `rgba(120, 120, 120, ${opacity})`;
  gameState.ctx.beginPath();

  // Create irregular asteroid shape
  const points = 8;
  const angleStep = (Math.PI * 2) / points;

  for (let i = 0; i < points; i++) {
    const angle = i * angleStep;
    const radiusVariation = 0.7 + Math.sin(i * 3) * 0.3;
    const radius = size * 0.5 * radiusVariation;
    const px = Math.cos(angle) * radius;
    const py = Math.sin(angle) * radius;

    if (i === 0) {
      gameState.ctx.moveTo(px, py);
    } else {
      gameState.ctx.lineTo(px, py);
    }
  }

  gameState.ctx.closePath();
  gameState.ctx.fill();

  // Asteroid craters
  gameState.ctx.fillStyle = `rgba(80, 80, 80, ${opacity})`;
  for (let i = 0; i < 3; i++) {
    const craterX = (Math.random() - 0.5) * size * 0.5;
    const craterY = (Math.random() - 0.5) * size * 0.5;
    const craterSize = size * (0.1 + Math.random() * 0.1);

    gameState.ctx.beginPath();
    gameState.ctx.arc(craterX, craterY, craterSize, 0, Math.PI * 2);
    gameState.ctx.fill();
  }
}

// Platform functions
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

function updatePlatforms() {
  // Move platforms to the left
  const movementSpeed = CONFIG.MOVEMENT_SPEED * 0.8; // Slightly slower than obstacles
  
  // Filter out platforms that have moved off-screen
  gameState.platforms = gameState.platforms.filter(platform => {
    platform.x -= movementSpeed;
    return platform.x + platform.width > 0; // Keep if still visible
  });
}

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

function drawRocket(x, y, size, opacity = 0.9, rotation = 0) {
  gameState.ctx.translate(x, y);
  gameState.ctx.rotate(rotation);

  // Rocket body
  gameState.ctx.fillStyle = `rgba(220, 60, 60, ${opacity})`;
  gameState.ctx.beginPath();
  gameState.ctx.ellipse(0, 0, size * 0.2, size * 0.5, 0, 0, Math.PI * 2);
  gameState.ctx.fill();

  // Rocket nose cone
  gameState.ctx.fillStyle = `rgba(180, 180, 180, ${opacity})`;
  gameState.ctx.beginPath();
  gameState.ctx.moveTo(0, -size * 0.5);
  gameState.ctx.lineTo(size * 0.2, -size * 0.3);
  gameState.ctx.lineTo(-size * 0.2, -size * 0.3);
  gameState.ctx.closePath();
  gameState.ctx.fill();

  // Rocket fins
  gameState.ctx.fillStyle = `rgba(100, 100, 220, ${opacity})`;

  // Left fin
  gameState.ctx.beginPath();
  gameState.ctx.moveTo(-size * 0.2, size * 0.2);
  gameState.ctx.lineTo(-size * 0.4, size * 0.5);
  gameState.ctx.lineTo(-size * 0.1, size * 0.2);
  gameState.ctx.closePath();
  gameState.ctx.fill();

  // Right fin
  gameState.ctx.beginPath();
  gameState.ctx.moveTo(size * 0.2, size * 0.2);
  gameState.ctx.lineTo(size * 0.4, size * 0.5);
  gameState.ctx.lineTo(size * 0.1, size * 0.2);
  gameState.ctx.closePath();
  gameState.ctx.fill();

  // Rocket window
  gameState.ctx.fillStyle = `rgba(200, 230, 255, ${opacity})`;
  gameState.ctx.beginPath();
  gameState.ctx.arc(0, -size * 0.1, size * 0.1, 0, Math.PI * 2);
  gameState.ctx.fill();

  // Rocket exhaust/flame
  if (Math.random() > 0.3) {
    // Flicker effect
    const flameSize = 0.7 + Math.random() * 0.3;

    // Outer flame
    gameState.ctx.fillStyle = `rgba(255, 100, 0, ${opacity * 0.7})`;
    gameState.ctx.beginPath();
    gameState.ctx.moveTo(-size * 0.15, size * 0.5);
    gameState.ctx.lineTo(0, size * (0.8 * flameSize));
    gameState.ctx.lineTo(size * 0.15, size * 0.5);
    gameState.ctx.closePath();
    gameState.ctx.fill();

    // Inner flame
    gameState.ctx.fillStyle = `rgba(255, 200, 0, ${opacity})`;
    gameState.ctx.beginPath();
    gameState.ctx.moveTo(-size * 0.08, size * 0.5);
    gameState.ctx.lineTo(0, size * (0.7 * flameSize));
    gameState.ctx.lineTo(size * 0.08, size * 0.5);
    gameState.ctx.closePath();
    gameState.ctx.fill();
  }
}

function drawSky() {
  const skyHeight = gameState.canvas.height * CONFIG.GROUND_HEIGHT_RATIO;

  // Check if sky image is available and loaded
  if (
    gameState.images.sky &&
    gameState.images.sky.complete &&
    gameState.images.sky.naturalWidth !== 0
  ) {
    // Draw sky image with aspect ratio preservation (cover mode)
    drawImageCover(
      gameState.images.sky,
      0,
      0,
      gameState.canvas.width,
      skyHeight
    );
  } else {
    // Fallback to gradient sky
    const skyGradient = gameState.ctx.createLinearGradient(0, 0, 0, skyHeight);
    skyGradient.addColorStop(0, "#87CEEB"); // Sky blue at top
    skyGradient.addColorStop(1, "#C9E9F6"); // Lighter blue near ground
    gameState.ctx.fillStyle = skyGradient;
    gameState.ctx.fillRect(0, 0, gameState.canvas.width, skyHeight);
  }
}

function drawMountains() {
  // Draw distant mountains for parallax effect
  const mountainHeight = gameState.canvas.height * 0.2;
  const baseY = gameState.canvas.height * CONFIG.GROUND_HEIGHT_RATIO;

  // Check if mountains image is available and loaded
  if (
    gameState.images.mountains &&
    gameState.images.mountains.complete &&
    gameState.images.mountains.naturalWidth !== 0
  ) {
    // Draw mountains image with aspect ratio preservation (cover mode)
    drawImageCover(
      gameState.images.mountains,
      0,
      baseY - mountainHeight,
      gameState.canvas.width,
      mountainHeight
    );
  } else {
    // Fallback to programmatically drawn mountains
    // First mountain range (furthest)
    const mountainGradient1 = gameState.ctx.createLinearGradient(
      0,
      baseY - mountainHeight,
      0,
      baseY
    );
    mountainGradient1.addColorStop(0, "#8BB9DD"); // Light blue-gray
    mountainGradient1.addColorStop(1, "#6A8CAD"); // Darker blue-gray
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
    const mountainGradient2 = gameState.ctx.createLinearGradient(
      0,
      baseY - mountainHeight * 0.7,
      0,
      baseY
    );
    mountainGradient2.addColorStop(0, "#6A8CAD"); // Match the darker color from first range
    mountainGradient2.addColorStop(1, "#5D7E9C"); // Even darker blue-gray
    gameState.ctx.fillStyle = mountainGradient2;

    gameState.ctx.beginPath();
    gameState.ctx.moveTo(0, baseY);

    // Create jagged mountain silhouette with different pattern
    for (let i = 0; i <= segments; i++) {
      const x = i * segmentWidth - 100; // Offset for variation
      // Different sine pattern for second range
      const heightVariation = Math.sin(i * 1.2 + 2) * 0.4 + 0.6;
      const y = baseY - mountainHeight * 0.7 * heightVariation;
      gameState.ctx.lineTo(x, y);
    }

    gameState.ctx.lineTo(mountainWidth, baseY);
    gameState.ctx.closePath();
    gameState.ctx.fill();
  }
}

function drawGrassDetails() {
  // Only draw grass details if we're not using a ground image
  if (
    !gameState.images.ground ||
    !gameState.images.ground.complete ||
    gameState.images.ground.naturalWidth === 0
  ) {
    const groundY = gameState.canvas.height * CONFIG.GROUND_HEIGHT_RATIO;
    const grassHeight = Math.min(15, gameState.canvas.height * 0.02);

    gameState.ctx.fillStyle = "#90EE90"; // Light green

    // Draw individual grass blades
    for (let x = 0; x < gameState.canvas.width; x += 15) {
      const randomHeight = grassHeight * (0.7 + Math.random() * 0.6);
      const randomWidth = 2 + Math.random() * 3;

      gameState.ctx.beginPath();
      gameState.ctx.moveTo(x, groundY);
      gameState.ctx.lineTo(x + randomWidth / 2, groundY - randomHeight);
      gameState.ctx.lineTo(x + randomWidth, groundY);
      gameState.ctx.closePath();
      gameState.ctx.fill();
    }
  }
}

function drawGround() {
  const groundY = gameState.canvas.height * CONFIG.GROUND_HEIGHT_RATIO;
  const groundHeight = gameState.canvas.height * 0.25;

  // Check if ground image is available and loaded
  if (
    gameState.images.ground &&
    gameState.images.ground.complete &&
    gameState.images.ground.naturalWidth !== 0
  ) {
    // Draw ground image with aspect ratio preservation (cover mode)
    // But align to top instead of center to prevent overlapping with player
    drawImageCoverAlignTop(
      gameState.images.ground,
      0,
      groundY,
      gameState.canvas.width,
      groundHeight
    );
  } else {
    // Fallback to gradient ground
    const groundGradient = gameState.ctx.createLinearGradient(
      0,
      groundY,
      0,
      gameState.canvas.height
    );
    groundGradient.addColorStop(0, CONFIG.GROUND_COLOR.TOP);
    groundGradient.addColorStop(0.3, "#7BC47F"); // Middle tone
    groundGradient.addColorStop(1, CONFIG.GROUND_COLOR.BOTTOM);
    gameState.ctx.fillStyle = groundGradient;
    gameState.ctx.fillRect(0, groundY, gameState.canvas.width, groundHeight);
  }
}

function drawGroundTexture() {
  const groundY = gameState.canvas.height * CONFIG.GROUND_HEIGHT_RATIO;
  const groundHeight = gameState.canvas.height * 0.25;

  // Only add texture if we're not using an image (to avoid overlaying texture on the image)
  if (
    !gameState.images.ground ||
    !gameState.images.ground.complete ||
    gameState.images.ground.naturalWidth === 0
  ) {
    // Add subtle texture to ground
    gameState.ctx.fillStyle = "rgba(0, 0, 0, 0.05)";

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

// Helper function to draw images in "cover" mode (like CSS background-size: cover)
// This maintains aspect ratio while ensuring the image covers the entire target area
function drawImageCover(img, targetX, targetY, targetWidth, targetHeight) {
  // Get the image dimensions
  const imgWidth = img.naturalWidth;
  const imgHeight = img.naturalHeight;

  // Calculate the scaling ratio to cover the target area
  const widthRatio = targetWidth / imgWidth;
  const heightRatio = targetHeight / imgHeight;
  const scale = Math.max(widthRatio, heightRatio);

  // Calculate the scaled dimensions
  const scaledWidth = imgWidth * scale;
  const scaledHeight = imgHeight * scale;

  // Calculate position to center the image in the target area
  const x = targetX + (targetWidth - scaledWidth) / 2;
  const y = targetY + (targetHeight - scaledHeight) / 2;

  // Draw the image
  gameState.ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
}

// Helper function similar to drawImageCover but aligns the image to the top
// This is useful for ground images to prevent them from overlapping with the player
function drawImageCoverAlignTop(
  img,
  targetX,
  targetY,
  targetWidth,
  targetHeight
) {
  // Get the image dimensions
  const imgWidth = img.naturalWidth;
  const imgHeight = img.naturalHeight;

  // Calculate the scaling ratio to cover the target area
  const widthRatio = targetWidth / imgWidth;
  const heightRatio = targetHeight / imgHeight;
  const scale = Math.max(widthRatio, heightRatio);

  // Calculate the scaled dimensions
  const scaledWidth = imgWidth * scale;
  const scaledHeight = imgHeight * scale;

  // Calculate position to center horizontally but align to top vertically
  const x = targetX + (targetWidth - scaledWidth) / 2;
  // Use targetY directly instead of centering vertically
  const y = targetY;

  // Draw the image
  gameState.ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
}

// Game loop functions
function update() {
  if (gameState.gameOver) return;

  // Update sky objects (clouds, asteroids, or rockets)
  gameState.skyObjects.forEach((obj) => {
    obj.x -= obj.speed;

    // Rotate asteroids and rockets slowly
    if (gameState.skyObjectType !== "clouds") {
      obj.rotation += 0.01;
    }

    if (obj.x + obj.size < 0) {
      obj.x = gameState.canvas.width;
      obj.y = Math.random() * (gameState.canvas.height / 2);
      obj.speed = 0.5 + Math.random() * 0.5;
      obj.rotation = Math.random() * Math.PI * 2;
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

  // Spawn objects
  if (Math.random() < (CONFIG.SPAWN_RATES.TOKEN || 0.03)) {
    gameState.vibeTokens.push(spawnToken());
  }
  if (Math.random() < (CONFIG.SPAWN_RATES.OBSTACLE || 0.015)) {
    gameState.obstacles.push(spawnObstacle());
  }
  
  // Spawn platforms with configured rate
  if (Math.random() < CONFIG.PLATFORM.SPAWN_RATE) {
    spawnPlatform();
  }
  
  // Update platforms
  updatePlatforms();

  // Debug log for spawning
  if (gameState.frameCount % 60 === 0) {
    console.log(
      `Current tokens: ${gameState.vibeTokens.length}, obstacles: ${gameState.obstacles.length}`
    );
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

  // Draw sky (image or gradient)
  drawSky();

  // Draw distant mountains for depth only if showMountains is true
  if (gameState.showMountains) {
    drawMountains();
  }

  // Draw sky objects with parallax effect
  gameState.skyObjects.forEach((obj) =>
    drawSkyObject(obj.x, obj.y, obj.size, obj.opacity, obj.rotation)
  );
  
  // Draw platforms
  drawPlatforms();

  // Draw ground
  drawGround();

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
  const hudBackdropHeight =
    gameState.hud.scoreFontSize * 1.2 +
    gameState.hud.padding * 3 +
    CONFIG.HUD.METER_HEIGHT;

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
  const fillWidth = Math.max(
    cornerRadius * 2,
    (gameState.hud.width * gameState.chillMeter) / 100
  );
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
    gameState.hud.x + fillWidth,
    meterY,
    gameState.hud.x + fillWidth,
    meterY + cornerRadius
  );
  gameState.ctx.lineTo(gameState.hud.x + fillWidth, meterY + meterHeight / 3);
  gameState.ctx.lineTo(
    gameState.hud.x + cornerRadius,
    meterY + meterHeight / 3
  );
  gameState.ctx.quadraticCurveTo(
    gameState.hud.x,
    meterY + meterHeight / 3,
    gameState.hud.x,
    meterY + cornerRadius
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
