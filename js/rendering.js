import { CONFIG, isMobile } from './config.js';
import { drawPlatforms } from './platforms.js';
import { drawTokens, drawObstacles, updateGameObjects } from './obstacles.js';
import { updatePlayerPhysics, checkGameObjectCollisions } from './physics.js';
import { roundedRect, drawImageCover, drawImageCoverAlignTop } from './utils.js';
import { updatePlatforms, spawnPlatform } from './platforms.js';
import { updateEffects, drawEffects, getChillMeterPulseColor } from './effects.js';

// We'll access gameState via a global reference to avoid circular imports

// Draw the sky (background)
function drawSky() {
  if (
    gameState.images.sky &&
    gameState.images.sky.complete &&
    gameState.images.sky.naturalWidth !== 0
  ) {
    // Use sky image if available
    drawImageCover(
      gameState.images.sky,
      0,
      0,
      gameState.canvas.width,
      gameState.canvas.height * CONFIG.GROUND_HEIGHT_RATIO
    );
  } else {
    // Fallback to gradient
    const skyGradient = gameState.ctx.createLinearGradient(
      0,
      0,
      0,
      gameState.canvas.height * CONFIG.GROUND_HEIGHT_RATIO
    );
    skyGradient.addColorStop(0, "#87CEEB"); // Sky blue at top
    skyGradient.addColorStop(1, "#E0F7FF"); // Lighter blue at horizon

    gameState.ctx.fillStyle = skyGradient;
    gameState.ctx.fillRect(
      0,
      0,
      gameState.canvas.width,
      gameState.canvas.height * CONFIG.GROUND_HEIGHT_RATIO
    );
  }
}

// Draw mountains in the background
function drawMountains() {
  if (
    gameState.images.mountains &&
    gameState.images.mountains.complete &&
    gameState.images.mountains.naturalWidth !== 0
  ) {
    // Use mountains image if available
    drawImageCoverAlignTop(
      gameState.images.mountains,
      0,
      0,
      gameState.canvas.width,
      gameState.canvas.height * CONFIG.GROUND_HEIGHT_RATIO
    );
  } else {
    // Fallback to drawing mountains
    const mountainHeight = gameState.canvas.height * 0.3;
    const mountainY = gameState.canvas.height * CONFIG.GROUND_HEIGHT_RATIO - mountainHeight;

    // Create mountain gradient
    const mountainGradient = gameState.ctx.createLinearGradient(
      0,
      mountainY,
      0,
      mountainY + mountainHeight
    );
    mountainGradient.addColorStop(0, "#6B8E23"); // Olive green at top
    mountainGradient.addColorStop(1, "#556B2F"); // Darker green at bottom

    // Draw distant mountains
    gameState.ctx.fillStyle = mountainGradient;

    // First mountain range (furthest)
    gameState.ctx.beginPath();
    gameState.ctx.moveTo(0, gameState.canvas.height * CONFIG.GROUND_HEIGHT_RATIO);

    // Create a series of mountain peaks
    const numPeaks = Math.ceil(gameState.canvas.width / 100);
    const peakWidth = gameState.canvas.width / numPeaks;

    for (let i = 0; i <= numPeaks; i++) {
      const x = i * peakWidth;
      const heightVariation = Math.sin(i * 0.5) * 0.3 + 0.7;
      const y = mountainY + mountainHeight * (1 - heightVariation);
      
      if (i === 0) {
        gameState.ctx.lineTo(x, y);
      } else {
        gameState.ctx.quadraticCurveTo(
          x - peakWidth / 2,
          mountainY + mountainHeight * (1 - (heightVariation + 0.2)),
          x,
          y
        );
      }
    }

    gameState.ctx.lineTo(gameState.canvas.width, gameState.canvas.height * CONFIG.GROUND_HEIGHT_RATIO);
    gameState.ctx.closePath();
    gameState.ctx.fill();

    // Add snow caps to mountains
    gameState.ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    gameState.ctx.beginPath();
    gameState.ctx.moveTo(0, mountainY + mountainHeight * 0.1);

    for (let i = 0; i <= numPeaks; i++) {
      const x = i * peakWidth;
      const heightVariation = Math.sin(i * 0.5) * 0.3 + 0.7;
      const y = mountainY + mountainHeight * (1 - heightVariation);
      
      if (i === 0) {
        gameState.ctx.lineTo(x, y);
      } else {
        gameState.ctx.quadraticCurveTo(
          x - peakWidth / 2,
          mountainY + mountainHeight * (1 - (heightVariation + 0.2)),
          x,
          y
        );
      }
    }

    gameState.ctx.lineTo(gameState.canvas.width, mountainY + mountainHeight * 0.1);
    gameState.ctx.closePath();
    gameState.ctx.fill();
  }
}

// Draw grass details on the ground
function drawGrassDetails() {
  // Only draw grass details if no ground image is available
  if (!gameState.images.ground || 
      !gameState.images.ground.complete || 
      gameState.images.ground.naturalWidth === 0) {
    
    const groundY = gameState.canvas.height * CONFIG.GROUND_HEIGHT_RATIO;
    const grassHeight = 15;
    
    gameState.ctx.fillStyle = "#7CFC00"; // Bright green
    
    // Draw individual grass blades
    for (let x = 0; x < gameState.canvas.width; x += 20) {
      const randomHeight = grassHeight * (0.5 + Math.random() * 0.5);
      const randomWidth = 3 + Math.random() * 2;
      
      gameState.ctx.beginPath();
      gameState.ctx.moveTo(x, groundY);
      gameState.ctx.lineTo(x + randomWidth / 2, groundY - randomHeight);
      gameState.ctx.lineTo(x + randomWidth, groundY);
      gameState.ctx.closePath();
      gameState.ctx.fill();
    }
  }
}

// Draw the ground
function drawGround() {
  const groundY = gameState.canvas.height * CONFIG.GROUND_HEIGHT_RATIO;
  
  if (
    gameState.images.ground &&
    gameState.images.ground.complete &&
    gameState.images.ground.naturalWidth !== 0
  ) {
    // Use ground image if available
    drawImageCoverAlignTop(
      gameState.images.ground,
      0,
      groundY,
      gameState.canvas.width,
      gameState.canvas.height - groundY
    );
  } else {
    // Fallback to gradient
    const groundGradient = gameState.ctx.createLinearGradient(
      0,
      groundY,
      0,
      gameState.canvas.height
    );
    groundGradient.addColorStop(0, CONFIG.GROUND_COLOR.TOP);
    groundGradient.addColorStop(1, CONFIG.GROUND_COLOR.BOTTOM);

    gameState.ctx.fillStyle = groundGradient;
    gameState.ctx.fillRect(
      0,
      groundY,
      gameState.canvas.width,
      gameState.canvas.height - groundY
    );
  }
}

// Draw ground texture
function drawGroundTexture() {
  // Only add ground texture if no ground image is available
  if (!gameState.images.ground || 
      !gameState.images.ground.complete || 
      gameState.images.ground.naturalWidth === 0) {
    
    const groundY = gameState.canvas.height * CONFIG.GROUND_HEIGHT_RATIO;
    
    // Draw a line at the top of the ground for definition
    gameState.ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
    gameState.ctx.lineWidth = 2;
    gameState.ctx.beginPath();
    gameState.ctx.moveTo(0, groundY);
    gameState.ctx.lineTo(gameState.canvas.width, groundY);
    gameState.ctx.stroke();
    
    // Add some random dots for texture
    gameState.ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * gameState.canvas.width;
      const y = groundY + Math.random() * (gameState.canvas.height - groundY);
      const size = 1 + Math.random() * 3;
      
      gameState.ctx.beginPath();
      gameState.ctx.arc(x, y, size, 0, Math.PI * 2);
      gameState.ctx.fill();
    }
  }
}

// Draw sky objects (clouds, asteroids, rockets)
function drawSkyObject(x, y, size, opacity = 0.9, rotation = 0) {
  gameState.ctx.save();
  gameState.ctx.globalAlpha = opacity;
  
  // Debug: Log the current skyObjectType
  console.log("Current skyObjectType:", gameState.skyObjectType);
  
  if (gameState.skyObjectType === "clouds") {
    drawCloud(x, y, size, opacity);
  } else if (gameState.skyObjectType === "asteroids") {
    drawAsteroid(x, y, size, opacity, rotation);
  } else if (gameState.skyObjectType === "rockets") {
    drawRocket(x, y, size, opacity, rotation);
  }
  
  gameState.ctx.restore();
}

// Draw a cloud
function drawCloud(x, y, size, opacity = 0.9) {
  gameState.ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
  
  // Draw main cloud body
  gameState.ctx.beginPath();
  gameState.ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
  gameState.ctx.arc(x + size * 0.4, y, size * 0.4, 0, Math.PI * 2);
  gameState.ctx.arc(x - size * 0.4, y, size * 0.4, 0, Math.PI * 2);
  gameState.ctx.arc(x + size * 0.2, y - size * 0.3, size * 0.3, 0, Math.PI * 2);
  gameState.ctx.arc(x - size * 0.2, y - size * 0.3, size * 0.3, 0, Math.PI * 2);
  gameState.ctx.closePath();
  gameState.ctx.fill();
  
  // Add highlight
  gameState.ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.7})`;
  gameState.ctx.beginPath();
  gameState.ctx.arc(x, y - size * 0.2, size * 0.3, 0, Math.PI * 2);
  gameState.ctx.closePath();
  gameState.ctx.fill();
}

// Draw an asteroid
function drawAsteroid(x, y, size, opacity = 0.9, rotation = 0) {
  gameState.ctx.save();
  gameState.ctx.translate(x, y);
  gameState.ctx.rotate(rotation);
  
  // Create asteroid shape
  gameState.ctx.beginPath();
  const points = 8;
  const angleStep = (Math.PI * 2) / points;
  
  for (let i = 0; i < points; i++) {
    const radius = size * (0.7 + Math.sin(i * 3) * 0.3);
    const angle = i * angleStep;
    const px = Math.cos(angle) * radius;
    const py = Math.sin(angle) * radius;
    
    if (i === 0) {
      gameState.ctx.moveTo(px, py);
    } else {
      gameState.ctx.lineTo(px, py);
    }
  }
  
  gameState.ctx.closePath();
  
  // Fill with gradient
  const gradient = gameState.ctx.createRadialGradient(0, 0, 0, 0, 0, size);
  gradient.addColorStop(0, `rgba(120, 120, 120, ${opacity})`);
  gradient.addColorStop(1, `rgba(80, 80, 80, ${opacity})`);
  gameState.ctx.fillStyle = gradient;
  gameState.ctx.fill();
  
  // Add craters
  gameState.ctx.fillStyle = `rgba(60, 60, 60, ${opacity})`;
  for (let i = 0; i < 5; i++) {
    const craterSize = size * (0.1 + Math.random() * 0.1);
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * size * 0.5;
    const cx = Math.cos(angle) * distance;
    const cy = Math.sin(angle) * distance;
    
    gameState.ctx.beginPath();
    gameState.ctx.arc(cx, cy, craterSize, 0, Math.PI * 2);
    gameState.ctx.fill();
  }
  
  gameState.ctx.restore();
}

// Draw a rocket
function drawRocket(x, y, size, opacity = 0.9, rotation = 0) {
  gameState.ctx.save();
  gameState.ctx.translate(x, y);
  gameState.ctx.rotate(rotation);
  
  // Rocket body
  gameState.ctx.fillStyle = `rgba(200, 200, 200, ${opacity})`;
  gameState.ctx.beginPath();
  gameState.ctx.moveTo(0, -size);
  gameState.ctx.lineTo(size * 0.3, 0);
  gameState.ctx.lineTo(size * 0.3, size * 0.7);
  gameState.ctx.lineTo(-size * 0.3, size * 0.7);
  gameState.ctx.lineTo(-size * 0.3, 0);
  gameState.ctx.closePath();
  gameState.ctx.fill();
  
  // Rocket fins
  gameState.ctx.fillStyle = `rgba(150, 150, 150, ${opacity})`;
  
  // Left fin
  gameState.ctx.beginPath();
  gameState.ctx.moveTo(-size * 0.3, size * 0.3);
  gameState.ctx.lineTo(-size * 0.6, size * 0.7);
  gameState.ctx.lineTo(-size * 0.3, size * 0.7);
  gameState.ctx.closePath();
  gameState.ctx.fill();
  
  // Right fin
  gameState.ctx.beginPath();
  gameState.ctx.moveTo(size * 0.3, size * 0.3);
  gameState.ctx.lineTo(size * 0.6, size * 0.7);
  gameState.ctx.lineTo(size * 0.3, size * 0.7);
  gameState.ctx.closePath();
  gameState.ctx.fill();
  
  // Window
  gameState.ctx.fillStyle = `rgba(100, 200, 255, ${opacity})`;
  gameState.ctx.beginPath();
  gameState.ctx.arc(0, -size * 0.2, size * 0.15, 0, Math.PI * 2);
  gameState.ctx.fill();
  
  // Rocket exhaust
  gameState.ctx.fillStyle = `rgba(255, 100, 0, ${opacity * Math.random() * 0.5 + 0.5})`;
  gameState.ctx.beginPath();
  gameState.ctx.moveTo(-size * 0.2, size * 0.7);
  gameState.ctx.lineTo(0, size * 1.2);
  gameState.ctx.lineTo(size * 0.2, size * 0.7);
  gameState.ctx.closePath();
  gameState.ctx.fill();
  
  gameState.ctx.restore();
}

// Draw the player
function drawPlayer() {
  if (gameState.gameOver) return;

  if (
    gameState.images.player &&
    gameState.images.player.complete &&
    gameState.images.player.naturalWidth !== 0
  ) {
    // Use player sprite if available
    // If the image doesn't have multiple frames, just use the whole image
    if (gameState.images.player.width < gameState.images.player.height * 2) {
      // Single frame image
      gameState.ctx.drawImage(
        gameState.images.player,
        0,
        0,
        gameState.images.player.width,
        gameState.images.player.height,
        gameState.player.x,
        gameState.player.y,
        gameState.player.width,
        gameState.player.height
      );
    } else {
      // Multi-frame sprite sheet
      const frameWidth = gameState.images.player.width / 4; // 4 frames of animation
      const frameHeight = gameState.images.player.height;
      
      gameState.ctx.drawImage(
        gameState.images.player,
        gameState.player.frame * frameWidth,
        0,
        frameWidth,
        frameHeight,
        gameState.player.x,
        gameState.player.y,
        gameState.player.width,
        gameState.player.height
      );
    }
  } else {
    // Fallback to drawing a simple player
    gameState.ctx.fillStyle = "#3498db"; // Blue
    gameState.ctx.fillRect(
      gameState.player.x,
      gameState.player.y,
      gameState.player.width,
      gameState.player.height
    );
    
    // Add some details
    gameState.ctx.fillStyle = "#2980b9"; // Darker blue
    gameState.ctx.fillRect(
      gameState.player.x + gameState.player.width * 0.2,
      gameState.player.y + gameState.player.height * 0.2,
      gameState.player.width * 0.6,
      gameState.player.height * 0.6
    );
  }
}

// Draw the HUD (score, chill meter, etc.)
function drawHUD() {
  // Draw score
  gameState.ctx.fillStyle = "#333";
  gameState.ctx.font = `bold ${gameState.hud.scoreFontSize}px Arial`;
  gameState.ctx.textAlign = "left";
  gameState.ctx.fillText(
    `Score: ${gameState.score}`,
    gameState.hud.x,
    gameState.hud.y + gameState.hud.scoreFontSize
  );

  // Draw high score
  gameState.ctx.fillText(
    `High Score: ${gameState.highScore}`,
    gameState.hud.x,
    gameState.hud.y + gameState.hud.scoreFontSize * 2.2
  );

  // Draw chill meter
  gameState.ctx.save();
  
  // Meter background
  gameState.ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
  const meterY = gameState.hud.y + gameState.hud.scoreFontSize * 3;
  const meterHeight = gameState.hud.height;
  const cornerRadius = meterHeight / 2;
  
  roundedRect(
    gameState.ctx,
    gameState.hud.x,
    meterY,
    gameState.hud.width,
    meterHeight,
    cornerRadius
  );
  gameState.ctx.fill();
  
  // Meter fill
  const chillGradient = gameState.ctx.createLinearGradient(
    gameState.hud.x,
    meterY,
    gameState.hud.x + gameState.hud.width,
    meterY
  );
  
  let baseColor1, baseColor2;
  
  if (gameState.chillMeter > 70) {
    // High chill - cool colors
    baseColor1 = "#00BFFF";
    baseColor2 = "#1E90FF";
  } else if (gameState.chillMeter > 30) {
    // Medium chill - neutral colors
    baseColor1 = "#FFD700";
    baseColor2 = "#FFA500";
  } else {
    // Low chill - hot colors
    baseColor1 = "#FF5722";
    baseColor2 = "#F44336";
  }
  
  // Apply pulse effect if active
  const pulseColor1 = getChillMeterPulseColor(baseColor1);
  const pulseColor2 = getChillMeterPulseColor(baseColor2);
  
  chillGradient.addColorStop(0, pulseColor1);
  chillGradient.addColorStop(1, pulseColor2);
  
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
  gameState.ctx.font = `bold ${gameState.hud.chillFontSize}px Arial`;
  gameState.ctx.textAlign = "center";
  gameState.ctx.fillStyle = "#FFF";
  gameState.ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
  gameState.ctx.shadowBlur = 3;
  gameState.ctx.fillText(
    `${Math.round(gameState.chillMeter)}% CHILL`,
    gameState.hud.x + gameState.hud.width / 2,
    meterY + meterHeight / 2 + gameState.hud.chillFontSize / 3
  );
  gameState.ctx.restore();
  
  // Draw game over message if game is over
  if (gameState.gameOver) {
    renderGameOverScreen();
  }
}

// Render game over screen
function renderGameOverScreen() {
  gameState.ctx.save();
  
  // Semi-transparent overlay
  gameState.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  gameState.ctx.fillRect(0, 0, gameState.canvas.width, gameState.canvas.height);
  
  // Game over text
  gameState.ctx.font = `bold ${gameState.hud.gameOverFontSize}px ${CONFIG.GAME_OVER.FONT}`;
  gameState.ctx.textAlign = "center";
  gameState.ctx.fillStyle = CONFIG.GAME_OVER.TITLE_COLOR;
  gameState.ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
  gameState.ctx.shadowBlur = 5;
  gameState.ctx.fillText(
    "GAME OVER",
    gameState.canvas.width / 2,
    gameState.canvas.height / 2 - gameState.hud.gameOverFontSize
  );
  
  // Score text
  gameState.ctx.font = `bold ${gameState.hud.scoreFontSize * 1.2}px ${CONFIG.GAME_OVER.FONT}`;
  gameState.ctx.fillStyle = CONFIG.GAME_OVER.SCORE_COLOR;
  gameState.ctx.fillText(
    `Score: ${gameState.score}`,
    gameState.canvas.width / 2,
    gameState.canvas.height / 2 + gameState.hud.scoreFontSize
  );
  
  // High score text
  gameState.ctx.fillText(
    `High Score: ${gameState.highScore}`,
    gameState.canvas.width / 2,
    gameState.canvas.height / 2 + gameState.hud.scoreFontSize * 2.5
  );
  
  // Draw restart button
  const buttonWidth = Math.min(200, gameState.canvas.width * 0.4);
  const buttonHeight = Math.min(50, gameState.canvas.height * 0.08);
  const buttonX = gameState.canvas.width / 2 - buttonWidth / 2;
  const buttonY = gameState.canvas.height / 2 + gameState.hud.scoreFontSize * 4;
  const buttonRadius = CONFIG.GAME_OVER.BUTTON.CORNER_RADIUS;
  
  // Store button position and dimensions for click detection
  gameState.restartButton = {
    x: buttonX,
    y: buttonY,
    width: buttonWidth,
    height: buttonHeight
  };
  
  // Button background
  gameState.ctx.fillStyle = CONFIG.GAME_OVER.BUTTON.BACKGROUND_COLOR;
  roundedRect(
    gameState.ctx,
    buttonX,
    buttonY,
    buttonWidth,
    buttonHeight,
    buttonRadius
  );
  gameState.ctx.fill();
  
  // Button border
  gameState.ctx.strokeStyle = CONFIG.GAME_OVER.BUTTON.BORDER_COLOR;
  gameState.ctx.lineWidth = CONFIG.GAME_OVER.BUTTON.BORDER_WIDTH;
  roundedRect(
    gameState.ctx,
    buttonX,
    buttonY,
    buttonWidth,
    buttonHeight,
    buttonRadius
  );
  gameState.ctx.stroke();
  
  // Button text
  gameState.ctx.font = `bold ${gameState.hud.scoreFontSize}px ${CONFIG.GAME_OVER.FONT}`;
  gameState.ctx.fillStyle = CONFIG.GAME_OVER.BUTTON.TEXT_COLOR;
  gameState.ctx.textAlign = "center";
  gameState.ctx.textBaseline = "middle";
  gameState.ctx.fillText(
    CONFIG.GAME_OVER.BUTTON.TEXT,
    gameState.canvas.width / 2,
    buttonY + buttonHeight / 2
  );
  
  gameState.ctx.restore();
}

// Main update function
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

  // Update player physics
  updatePlayerPhysics();

  // Spawn objects
  updateGameObjects();
  
  // Spawn platforms with configured rate
  if (Math.random() < CONFIG.PLATFORM.SPAWN_RATE) {
    spawnPlatform();
  }
  
  // Update platforms
  updatePlatforms();

  // Check for collisions
  checkGameObjectCollisions();
  
  // Update visual effects
  updateEffects();
}

// Main draw function
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
  
  // Draw tokens and obstacles
  drawTokens();
  drawObstacles();
  
  // Draw player
  drawPlayer();
  
  // Draw visual effects (particles, score popups)
  drawEffects(gameState.ctx);
  
  // Draw HUD
  drawHUD();
  
  // Draw game over screen if game is over
  if (gameState.gameOver) {
    renderGameOverScreen();
  }
}

export { 
  update, 
  draw, 
  drawPlayer, 
  drawHUD, 
  drawSky, 
  drawMountains, 
  drawGround, 
  drawGroundTexture, 
  drawSkyObject,
  renderGameOverScreen
};
