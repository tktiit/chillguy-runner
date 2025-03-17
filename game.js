// Get canvas and context
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Set canvas size to match window
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Game variables
let chillGuy = {
  x: 50,
  y: canvas.height * 0.75 - 50, // Adjusted to new ground level (75% of height - character height)
  width: 50,
  height: 50,
  speed: 5,
  jumping: false,
  jumpHeight: 100,
  yVelocity: 0,
  frame: 0, // For animation
  frameCount: 0, // For controlling animation speed
};
let chillMeter = 100; // Starts full
let vibeTokens = []; // Array for collectibles
let obstacles = []; // Array for things to dodge
let score = 0;
let gameOver = false;

// Add cloud objects for parallax background
let clouds = [];
for (let i = 0; i < 5; i++) {
  clouds.push({
    x: Math.random() * canvas.width,
    y: Math.random() * (canvas.height / 2),
    speed: 0.5 + Math.random() * 0.5,
    size: 30 + Math.random() * 40,
  });
}

// Game loop
function gameLoop() {
  update(); // Update game state
  draw(); // Draw everything
  requestAnimationFrame(gameLoop); // Keep looping
}

// Start the game
gameLoop();

// Update game state
function update() {
  if (gameOver) return;

  // Update clouds
  clouds.forEach((cloud) => {
    cloud.x -= cloud.speed;
    if (cloud.x + cloud.size < 0) {
      cloud.x = canvas.width;
      cloud.y = Math.random() * (canvas.height / 2);
    }
  });

  // Animate Chill Guy
  chillGuy.frameCount++;
  if (chillGuy.frameCount > 5) {
    chillGuy.frame = (chillGuy.frame + 1) % 4;
    chillGuy.frameCount = 0;
  }

  // Move Chill Guy (basic jump logic)
  if (chillGuy.jumping) {
    chillGuy.y += chillGuy.yVelocity;
    chillGuy.yVelocity += 0.6;
    if (chillGuy.y >= canvas.height * 0.75 - chillGuy.height) {
      // Adjusted ground check
      chillGuy.y = canvas.height * 0.75 - chillGuy.height;
      chillGuy.jumping = false;
    }
  }

  // Spawn vibe tokens and obstacles (randomly)
  if (Math.random() < 0.02) {
    vibeTokens.push({
      x: canvas.width,
      y: canvas.height * 0.75 - 50, // Adjusted token spawn height
      width: 20,
      height: 20,
    });
  }
  if (Math.random() < 0.01) {
    obstacles.push({
      x: canvas.width,
      y: canvas.height * 0.75 - 60, // Adjusted obstacle spawn height
      width: 30,
      height: 30,
    });
  }

  // Move tokens and obstacles
  vibeTokens.forEach((token) => (token.x -= 3));
  obstacles.forEach((obstacle) => (obstacle.x -= 3));

  // Collision detection
  vibeTokens = vibeTokens.filter((token) => {
    if (checkCollision(chillGuy, token)) {
      score += 10;
      chillMeter = Math.min(chillMeter + 5, 100); // Cap at 100
      return false; // Remove collected token
    }
    return token.x > -token.width; // Keep if not off-screen
  });

  obstacles = obstacles.filter((obstacle) => {
    if (checkCollision(chillGuy, obstacle)) {
      chillMeter -= 20;
      return false; // Remove hit obstacle
    }
    return obstacle.x > -obstacle.width;
  });

  // Game over check
  if (chillMeter <= 0) {
    gameOver = true;
    return;
  }
}

// Draw everything
function draw() {
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw clouds
  ctx.fillStyle = "#ffffff";
  clouds.forEach((cloud) => {
    drawCloud(cloud.x, cloud.y, cloud.size);
  });

  // Draw ground (25% of screen height)
  const groundHeight = canvas.height * 0.25; // 25% of screen height
  const groundGradient = ctx.createLinearGradient(
    0,
    canvas.height - groundHeight,
    0,
    canvas.height
  );
  groundGradient.addColorStop(0, "#90EE90"); // Light green
  groundGradient.addColorStop(1, "#228B22"); // Forest green
  ctx.fillStyle = groundGradient;
  ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);

  // Draw game elements if game is not over
  if (!gameOver) {
    // Draw Chill Guy with animation
    ctx.save();
    ctx.fillStyle = "#4169E1"; // Royal Blue
    if (chillGuy.jumping) {
      // Jump pose
      drawChillGuy(chillGuy.x, chillGuy.y, true);
    } else {
      // Running animation
      drawChillGuy(chillGuy.x, chillGuy.y, false);
    }
    ctx.restore();

    // Draw vibe tokens with glow effect
    vibeTokens.forEach((token) => {
      ctx.save();
      // Glow effect
      ctx.shadowColor = "#FFD700";
      ctx.shadowBlur = 15;
      ctx.fillStyle = "#FFD700";
      ctx.beginPath();
      ctx.arc(
        token.x + token.width / 2,
        token.y + token.height / 2,
        token.width / 2,
        0,
        Math.PI * 2
      );
      ctx.fill();
      // Inner shine
      ctx.fillStyle = "#FFF8DC";
      ctx.beginPath();
      ctx.arc(
        token.x + token.width / 3,
        token.y + token.height / 3,
        token.width / 6,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.restore();
    });

    // Draw obstacles with gradient
    obstacles.forEach((obstacle) => {
      const obstacleGradient = ctx.createLinearGradient(
        obstacle.x,
        obstacle.y,
        obstacle.x,
        obstacle.y + obstacle.height
      );
      obstacleGradient.addColorStop(0, "#FF4444");
      obstacleGradient.addColorStop(1, "#CC0000");
      ctx.fillStyle = obstacleGradient;
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);

      // Add spiky top
      ctx.beginPath();
      ctx.moveTo(obstacle.x, obstacle.y);
      ctx.lineTo(obstacle.x + obstacle.width / 2, obstacle.y - 10);
      ctx.lineTo(obstacle.x + obstacle.width, obstacle.y);
      ctx.fillStyle = "#CC0000";
      ctx.fill();
    });
  }

  // Draw HUD in center top
  const hudY = canvas.height / 2 - 100; // Moved to vertical center
  const hudWidth = 400;
  const hudX = (canvas.width - hudWidth) / 2;
  const hudPadding = 15; // Added padding

  // Score display
  ctx.fillStyle = "#2C3E50";
  ctx.font = "bold 36px Arial";
  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
  ctx.shadowBlur = 5;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  ctx.fillText(`Score: ${score}`, canvas.width / 2, hudY);

  // Chill meter background
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.fillRect(hudX, hudY + hudPadding + 20, hudWidth, 30);

  // Chill meter fill
  const chillGradient = ctx.createLinearGradient(hudX, 0, hudX + hudWidth, 0);
  chillGradient.addColorStop(0, "#00FF87");
  chillGradient.addColorStop(1, "#60efff");
  ctx.fillStyle = chillGradient;
  ctx.fillRect(hudX, hudY + hudPadding + 20, (hudWidth * chillMeter) / 100, 30);

  // Chill percentage
  ctx.fillStyle = "#2C3E50";
  ctx.font = "bold 24px Arial";
  ctx.fillText(
    `Chill: ${Math.round(chillMeter)}%`,
    canvas.width / 2,
    hudY + hudPadding * 2 + 70
  );

  // Reset shadow
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Draw game over screen if game is over
  if (gameOver) {
    // Semi-transparent overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Game Over text
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 72px Arial";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 100);

    // Final Score
    ctx.font = "bold 48px Arial";
    ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2);

    // Play Again button
    const buttonWidth = 200;
    const buttonHeight = 60;
    const buttonX = (canvas.width - buttonWidth) / 2;
    const buttonY = canvas.height / 2 + 50;

    // Button background with gradient
    const buttonGradient = ctx.createLinearGradient(
      buttonX,
      buttonY,
      buttonX,
      buttonY + buttonHeight
    );
    buttonGradient.addColorStop(0, "#4CAF50");
    buttonGradient.addColorStop(1, "#45a049");
    ctx.fillStyle = buttonGradient;
    ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);

    // Button text
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 24px Arial";
    ctx.fillText("Play Again", canvas.width / 2, buttonY + 38);
  }
}

// Helper function to draw clouds
function drawCloud(x, y, size) {
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
  ctx.arc(x + size * 0.4, y - size * 0.2, size * 0.3, 0, Math.PI * 2);
  ctx.arc(x + size * 0.4, y + size * 0.2, size * 0.3, 0, Math.PI * 2);
  ctx.arc(x + size * 0.7, y, size * 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Helper function to draw Chill Guy
function drawChillGuy(x, y, isJumping) {
  ctx.save();
  // Body
  ctx.fillStyle = "#4169E1";
  ctx.fillRect(x, y, chillGuy.width, chillGuy.height);

  // Face
  ctx.fillStyle = "#FFD700";
  // Sunglasses
  ctx.fillRect(x + 10, y + 15, 30, 8);
  // Smile
  ctx.beginPath();
  ctx.arc(x + 25, y + 35, 10, 0, Math.PI);
  ctx.stroke();

  // Running animation when not jumping
  if (!isJumping) {
    const legOffset = Math.sin((chillGuy.frame * Math.PI) / 2) * 10;
    ctx.fillStyle = "#4169E1";
    ctx.fillRect(x + 10, y + chillGuy.height, 8, 20 + legOffset);
    ctx.fillRect(x + 30, y + chillGuy.height, 8, 20 - legOffset);
  }
  ctx.restore();
}

// Simple collision check
function checkCollision(obj1, obj2) {
  return (
    obj1.x < obj2.x + obj2.width &&
    obj1.x + obj1.width > obj2.x &&
    obj1.y < obj2.y + obj2.height &&
    obj1.y + obj1.height > obj2.y
  );
}

// Jump function to reuse across inputs
function jump() {
  if (!chillGuy.jumping) {
    chillGuy.jumping = true;
    chillGuy.yVelocity = -20; // Increased jump strength from -15 to -20
  }
}

// Reset game function
function resetGame() {
  chillGuy = {
    x: 50,
    y: canvas.height * 0.75 - 50, // Adjusted reset position
    width: 50,
    height: 50,
    speed: 5,
    jumping: false,
    jumpHeight: 100,
    yVelocity: 0,
    frame: 0,
    frameCount: 0,
  };
  chillMeter = 100;
  vibeTokens = [];
  obstacles = [];
  score = 0;
  gameOver = false;
}

// Handle click/touch for both jumping and button
function handleInteraction(event) {
  event.preventDefault();

  if (gameOver) {
    // Get click/touch position
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clickX, clickY;
    if (event.type === "touchstart") {
      clickX = (event.touches[0].clientX - rect.left) * scaleX;
      clickY = (event.touches[0].clientY - rect.top) * scaleY;
    } else {
      clickX = (event.clientX - rect.left) * scaleX;
      clickY = (event.clientY - rect.top) * scaleY;
    }

    // Check if click/touch is within button bounds
    const buttonWidth = 200;
    const buttonHeight = 60;
    const buttonX = (canvas.width - buttonWidth) / 2;
    const buttonY = canvas.height / 2 + 50;

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

// Update event listeners
canvas.removeEventListener("mousedown", jump);
canvas.removeEventListener("touchstart", jump);
canvas.addEventListener("mousedown", handleInteraction);
canvas.addEventListener("touchstart", handleInteraction);

// Add keyboard controls
document.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault(); // Prevent page scrolling
    if (gameOver) {
      resetGame();
    } else {
      jump();
    }
  }
});
