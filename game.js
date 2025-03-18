// Game Configuration
const CONFIG = {
  JUMP_VELOCITY: -20,
  GRAVITY: 0.5,
  GROUND_HEIGHT_RATIO: 0.75,
  GROUND_COLOR: {
    TOP: "#90EE90",
    BOTTOM: "#228B22",
  },
  HUD: {
    MIN_SPACING: 40,
    SPACING_RATIO: 0.05,
    METER_HEIGHT: 30,
  },
  SPAWN_RATES: {
    TOKEN: 0.03,
    OBSTACLE: 0.015,
  },
  MOVEMENT_SPEED: 10,
  SCORE_INCREMENT: 10,
  CHILL_METER: {
    INCREMENT: 5,
    DECREMENT: 20,
  },
  // New size configurations
  SIZES: {
    PLAYER: {
      BASE_RATIO: 0.2, // 8% of smaller dimension
      MAX_SIZE: 150, // Maximum size in pixels
    },
    TOKEN: {
      BASE_RATIO: 0.1, // 6% of canvas width
      MAX_SIZE: 100, // Maximum size in pixels
    },
    OBSTACLE: {
      BASE_RATIO: 0.1, // 8% of canvas width
      MAX_SIZE: 100, // Maximum size in pixels
    },
  },
};

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
  const tokenSize = Math.min(
    CONFIG.SIZES.TOKEN.MAX_SIZE,
    gameState.canvas.width * CONFIG.SIZES.TOKEN.BASE_RATIO
  );
  return {
    x: gameState.canvas.width,
    y: gameState.canvas.height * CONFIG.GROUND_HEIGHT_RATIO - tokenSize,
    width: tokenSize,
    height: tokenSize,
    spriteWidth: gameState.images.token.width,
    spriteHeight: gameState.images.token.height,
  };
}

function spawnObstacle() {
  const obstacleSize = Math.min(
    CONFIG.SIZES.OBSTACLE.MAX_SIZE,
    gameState.canvas.width * CONFIG.SIZES.OBSTACLE.BASE_RATIO
  );
  return {
    x: gameState.canvas.width,
    y: gameState.canvas.height * CONFIG.GROUND_HEIGHT_RATIO - obstacleSize,
    width: obstacleSize,
    height: obstacleSize,
    spriteWidth: gameState.images.obstacle.width,
    spriteHeight: gameState.images.obstacle.height,
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
function drawCloud(x, y, size) {
  gameState.ctx.save();
  gameState.ctx.fillStyle = "#ffffff";
  gameState.ctx.beginPath();
  gameState.ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
  gameState.ctx.arc(x + size * 0.4, y - size * 0.2, size * 0.3, 0, Math.PI * 2);
  gameState.ctx.arc(x + size * 0.4, y + size * 0.2, size * 0.3, 0, Math.PI * 2);
  gameState.ctx.arc(x + size * 0.7, y, size * 0.4, 0, Math.PI * 2);
  gameState.ctx.fill();
  gameState.ctx.restore();
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
  if (Math.random() < CONFIG.SPAWN_RATES.TOKEN) {
    gameState.vibeTokens.push(spawnToken());
  }
  if (Math.random() < CONFIG.SPAWN_RATES.OBSTACLE) {
    gameState.obstacles.push(spawnObstacle());
  }

  // Move objects
  gameState.vibeTokens.forEach((token) => (token.x -= CONFIG.MOVEMENT_SPEED));
  gameState.obstacles.forEach(
    (obstacle) => (obstacle.x -= CONFIG.MOVEMENT_SPEED)
  );

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

  // Draw background
  gameState.clouds.forEach((cloud) => drawCloud(cloud.x, cloud.y, cloud.size));

  // Draw ground
  const groundHeight = gameState.canvas.height * 0.25;
  const groundGradient = gameState.ctx.createLinearGradient(
    0,
    gameState.canvas.height - groundHeight,
    0,
    gameState.canvas.height
  );
  groundGradient.addColorStop(0, CONFIG.GROUND_COLOR.TOP);
  groundGradient.addColorStop(1, CONFIG.GROUND_COLOR.BOTTOM);
  gameState.ctx.fillStyle = groundGradient;
  gameState.ctx.fillRect(
    0,
    gameState.canvas.height - groundHeight,
    gameState.canvas.width,
    groundHeight
  );

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

  // Draw HUD
  gameState.ctx.fillStyle = "#2C3E50";
  gameState.ctx.font = `bold ${gameState.hud.scoreFontSize}px Arial`;
  gameState.ctx.textAlign = "center";
  gameState.ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
  gameState.ctx.shadowBlur = 5;
  gameState.ctx.shadowOffsetX = 2;
  gameState.ctx.shadowOffsetY = 2;
  gameState.ctx.fillText(
    `Score: ${gameState.score}`,
    gameState.canvas.width / 2,
    gameState.hud.y
  );

  // Draw chill meter
  gameState.ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  gameState.ctx.fillRect(
    gameState.hud.x,
    gameState.hud.y + gameState.hud.padding * 2,
    gameState.hud.width,
    CONFIG.HUD.METER_HEIGHT
  );

  const chillGradient = gameState.ctx.createLinearGradient(
    gameState.hud.x,
    0,
    gameState.hud.x + gameState.hud.width,
    0
  );
  chillGradient.addColorStop(0, "#00FF87");
  chillGradient.addColorStop(1, "#60efff");
  gameState.ctx.fillStyle = chillGradient;
  gameState.ctx.fillRect(
    gameState.hud.x,
    gameState.hud.y + gameState.hud.padding * 2,
    (gameState.hud.width * gameState.chillMeter) / 100,
    CONFIG.HUD.METER_HEIGHT
  );

  // Draw chill percentage
  gameState.ctx.font = `bold ${gameState.hud.chillFontSize}px Arial`;
  gameState.ctx.fillStyle = "#1a1a1a";
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

  function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
  }

  gameLoop();
}

startGame();
