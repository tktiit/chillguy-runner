import { CONFIG, isMobile } from "./config.js";
import { generateInitialPlatforms } from "./platforms.js";
import { playBackgroundMusic } from "./sound.js";

// Initialize game state
// We define gameState as a global variable to avoid circular dependencies
window.gameState = {
  initialized: false,
  vibeTokens: [],
  obstacles: [],
  chillMeter: 100, // Initialize chill meter to 100%
  canvas: null,
  ctx: null,
  gameOver: false,
  score: 0,
  highScore: 0,
  platforms: [], // Array to store platforms
  onPlatform: false, // Flag to track if player is on a platform
  skyObjects: [],
  skyObjectType: CONFIG.SKY_OBJECTS.TYPE, // Get from config: clouds, asteroids, or rockets
  showMountains: CONFIG.SHOW_MOUNTAINS,
  groundPattern: null,
  images: {},
  hud: {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  },
  player: null,
  frameCount: 0,
  lastFrameTime: 0,
};

// Initialize game state
function initializeGame() {
  // Set canvas size
  if (!gameState.canvas) {
    gameState.canvas = document.getElementById("gameCanvas");
    gameState.ctx = gameState.canvas.getContext("2d");
  }
  gameState.canvas.width = window.innerWidth;
  gameState.canvas.height = window.innerHeight;

  // Reset arrays
  gameState.vibeTokens = [];
  gameState.obstacles = [];
  gameState.chillMeter = 100; // Reset chill meter to 100%

  // Initialize base sizes
  const smallerDimension = Math.min(
    gameState.canvas.width,
    gameState.canvas.height
  );
  const baseSize = Math.round(
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
    spriteWidth: gameState.images.player?.width || 0,
    spriteHeight: gameState.images.player?.height || 0,
  };

  // Clear and initialize sky objects (clouds, asteroids, or rockets)
  gameState.skyObjects = [];
  for (let i = 0; i < CONFIG.SKY_OBJECTS.COUNT; i++) {
    gameState.skyObjects.push({
      x: Math.random() * gameState.canvas.width,
      y: Math.random() * (gameState.canvas.height / 2),
      speed: CONFIG.SKY_OBJECTS.MIN_SPEED + Math.random() * (CONFIG.SKY_OBJECTS.MAX_SPEED - CONFIG.SKY_OBJECTS.MIN_SPEED),
      size: (CONFIG.SKY_OBJECTS.SIZE_RATIO.MIN + Math.random() * (CONFIG.SKY_OBJECTS.SIZE_RATIO.MAX - CONFIG.SKY_OBJECTS.SIZE_RATIO.MIN)) * Math.min(gameState.canvas.width, gameState.canvas.height),
      rotation: Math.random() * Math.PI * 2, // For asteroids and rockets
      opacity: CONFIG.SKY_OBJECTS.MIN_OPACITY + Math.random() * (CONFIG.SKY_OBJECTS.MAX_OPACITY - CONFIG.SKY_OBJECTS.MIN_OPACITY),
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

  // Resize canvas
  gameState.canvas.width = window.innerWidth;
  gameState.canvas.height = window.innerHeight;

  // Calculate HUD dimensions and position
  const minSpacing = CONFIG.HUD.MIN_SPACING || 20;
  const spacingRatio = CONFIG.HUD.SPACING_RATIO || 0.05;
  const spacing = Math.max(
    minSpacing,
    Math.min(gameState.canvas.width, gameState.canvas.height) * spacingRatio
  );

  // Set HUD position and size
  gameState.hud.x = spacing;
  gameState.hud.y = spacing;
  gameState.hud.width = gameState.canvas.width - spacing * 2;
  gameState.hud.height = CONFIG.HUD.METER_HEIGHT || 30;
  gameState.hud.padding = spacing;

  // Calculate font sizes based on canvas dimensions
  const baseFontSize = Math.min(
    gameState.canvas.width,
    gameState.canvas.height
  );
  gameState.hud.scoreFontSize = Math.max(16, Math.round(baseFontSize * 0.05));
  gameState.hud.chillFontSize = Math.max(14, Math.round(baseFontSize * 0.04));
  gameState.hud.gameOverFontSize = Math.max(
    24,
    Math.round(baseFontSize * 0.08)
  );

  // Regenerate platforms if device type changed
  if (wasIsMobile !== newIsMobile) {
    generateInitialPlatforms();
  }
}

// Function to change sky object type
function changeSkyObjectType(type) {
  if (type !== "clouds" && type !== "asteroids" && type !== "rockets") {
    console.error("Invalid sky object type. Use 'clouds', 'asteroids', or 'rockets'.");
    return;
  }
  
  // Set the new type
  gameState.skyObjectType = type;
  console.log("Changed skyObjectType to:", type);
  
  // Reset sky objects with the new type
  gameState.skyObjects = [];
  for (let i = 0; i < CONFIG.SKY_OBJECTS.COUNT; i++) {
    gameState.skyObjects.push({
      x: Math.random() * gameState.canvas.width,
      y: Math.random() * (gameState.canvas.height / 2),
      speed: CONFIG.SKY_OBJECTS.MIN_SPEED + Math.random() * (CONFIG.SKY_OBJECTS.MAX_SPEED - CONFIG.SKY_OBJECTS.MIN_SPEED),
      size: (CONFIG.SKY_OBJECTS.SIZE_RATIO.MIN + Math.random() * (CONFIG.SKY_OBJECTS.SIZE_RATIO.MAX - CONFIG.SKY_OBJECTS.SIZE_RATIO.MIN)) * Math.min(gameState.canvas.width, gameState.canvas.height),
      rotation: Math.random() * Math.PI * 2,
      opacity: CONFIG.SKY_OBJECTS.MIN_OPACITY + Math.random() * (CONFIG.SKY_OBJECTS.MAX_OPACITY - CONFIG.SKY_OBJECTS.MIN_OPACITY),
    });
  }
}

// Reset game state
function resetGame() {
  const smallerDimension = Math.min(
    gameState.canvas.width,
    gameState.canvas.height
  );
  const baseSize = Math.round(
    smallerDimension * CONFIG.SIZES.PLAYER.BASE_RATIO
  );

  gameState.gameOver = false;
  gameState.score = 0;
  gameState.chillMeter = 100;
  gameState.vibeTokens = [];
  gameState.obstacles = [];
  gameState.player.y =
    gameState.canvas.height * CONFIG.GROUND_HEIGHT_RATIO - baseSize;
  gameState.player.jumping = false;
  gameState.player.yVelocity = 0;
  gameState.onPlatform = false;

  // Reset sky objects
  gameState.skyObjects = [];
  // Re-initialize sky objects with current skyObjectType
  for (let i = 0; i < CONFIG.SKY_OBJECTS.COUNT; i++) {
    gameState.skyObjects.push({
      x: Math.random() * gameState.canvas.width,
      y: Math.random() * (gameState.canvas.height / 2),
      speed: CONFIG.SKY_OBJECTS.MIN_SPEED + Math.random() * (CONFIG.SKY_OBJECTS.MAX_SPEED - CONFIG.SKY_OBJECTS.MIN_SPEED),
      size: (CONFIG.SKY_OBJECTS.SIZE_RATIO.MIN + Math.random() * (CONFIG.SKY_OBJECTS.SIZE_RATIO.MAX - CONFIG.SKY_OBJECTS.SIZE_RATIO.MIN)) * Math.min(gameState.canvas.width, gameState.canvas.height),
      rotation: Math.random() * Math.PI * 2,
      opacity: CONFIG.SKY_OBJECTS.MIN_OPACITY + Math.random() * (CONFIG.SKY_OBJECTS.MAX_OPACITY - CONFIG.SKY_OBJECTS.MIN_OPACITY),
    });
  }

  // Re-initialize platforms
  generateInitialPlatforms();

  // Restart background music
  playBackgroundMusic();
}

// Game loop
function gameLoop(timestamp) {
  // Calculate delta time
  const deltaTime = timestamp - (gameState.lastFrameTime || timestamp);
  gameState.lastFrameTime = timestamp;

  // Increment frame counter
  gameState.frameCount++;

  // Update game state
  update();

  // Draw everything
  draw();

  // Continue the game loop
  requestAnimationFrame(gameLoop);
}

// Start the game
function startGame() {
  // Load images
  gameState.images = {
    player: document.getElementById("playerImage"),
    token: document.getElementById("tokenImage"),
    obstacle: document.getElementById("obstacleImage"),
    sky: document.getElementById("skyImage"),
    mountains: document.getElementById("mountainsImage"),
    ground: document.getElementById("groundImage"),
    platform: document.getElementById("platformImage"),
  };

  // Initialize game
  initializeGame();

  // Set up event listeners
  window.addEventListener("resize", handleResize);

  // Touch events for mobile
  gameState.canvas.addEventListener("touchstart", handleInteraction);

  // Mouse events for desktop
  gameState.canvas.addEventListener("mousedown", handleInteraction);

  // Keyboard events
  window.addEventListener("keydown", (event) => {
    if (event.code === "Space" || event.key === " ") {
      handleInteraction(event);
    }
  });

  // Start game loop
  gameLoop();
}

// Export functions
export { initializeGame, handleResize, resetGame, gameLoop, startGame, changeSkyObjectType };

// Also expose gameState for modules that need to import it directly
export const gameState = window.gameState;
