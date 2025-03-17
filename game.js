// Get canvas and context
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Set canvas size to match window
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Game variables
let chillGuy = {
  x: 50, // Starting x position
  y: canvas.height - 100, // Near bottom of screen
  width: 50,
  height: 50,
  speed: 5,
  jumping: false,
  jumpHeight: 100,
  yVelocity: 0,
};
let chillMeter = 100; // Starts full
let vibeTokens = []; // Array for collectibles
let obstacles = []; // Array for things to dodge
let score = 0;

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
  // Move Chill Guy (basic jump logic)
  if (chillGuy.jumping) {
    chillGuy.y += chillGuy.yVelocity;
    chillGuy.yVelocity += 0.6; // Reduced gravity from 1 to 0.6
    if (chillGuy.y >= canvas.height - chillGuy.height) {
      chillGuy.y = canvas.height - chillGuy.height;
      chillGuy.jumping = false;
    }
  }

  // Spawn vibe tokens and obstacles (randomly)
  if (Math.random() < 0.02) {
    vibeTokens.push({
      x: canvas.width,
      y: canvas.height - 50,
      width: 20,
      height: 20,
    });
  }
  if (Math.random() < 0.01) {
    obstacles.push({
      x: canvas.width,
      y: canvas.height - 60,
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
    alert(`Game Over! Score: ${score}`);
    chillMeter = 100;
    score = 0;
    vibeTokens = [];
    obstacles = [];
  }
}

// Draw everything
function draw() {
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw Chill Guy (placeholder: blue square)
  ctx.fillStyle = "blue";
  ctx.fillRect(chillGuy.x, chillGuy.y, chillGuy.width, chillGuy.height);

  // Draw vibe tokens (yellow circles)
  ctx.fillStyle = "yellow";
  vibeTokens.forEach((token) => {
    ctx.beginPath();
    ctx.arc(
      token.x + token.width / 2,
      token.y + token.height / 2,
      token.width / 2,
      0,
      Math.PI * 2
    );
    ctx.fill();
  });

  // Draw obstacles (red squares)
  ctx.fillStyle = "red";
  obstacles.forEach((obstacle) => {
    ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
  });

  // Draw HUD (score and chill meter)
  ctx.fillStyle = "black";
  ctx.font = "20px Arial";
  ctx.fillText(`Score: ${score}`, 10, 30);
  ctx.fillText(`Chill: ${chillMeter}`, 10, 60);
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

// Controls for desktop and mobile
// Mouse click (desktop)
canvas.addEventListener("mousedown", () => jump());

// Keyboard (spacebar, desktop)
document.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    jump();
  }
});

// Touch (mobile)
canvas.addEventListener("touchstart", () => jump());
