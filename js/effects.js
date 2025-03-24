// Visual effects for Chillguy Runner game
import { CONFIG } from './config.js';

// Particle class for sparkle effects
class Particle {
  constructor(x, y, color, size, speedX, speedY, life, opacity = 1) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.size = size;
    this.initialSize = size;
    this.speedX = speedX;
    this.speedY = speedY;
    this.life = life;
    this.initialLife = life;
    this.opacity = opacity;
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.life--;
    this.size = this.initialSize * (this.life / this.initialLife);
    this.opacity = this.life / this.initialLife;
    return this.life > 0;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// Score popup class
class ScorePopup {
  constructor(x, y, score, color = '#FFFF00') {
    this.x = x;
    this.y = y;
    this.initialY = y;
    this.score = score;
    this.color = color;
    this.life = 60; // Frames the popup will live
    this.initialLife = 60;
    this.opacity = 1;
  }

  update() {
    this.y -= 1; // Move upward
    this.life--;
    this.opacity = this.life / this.initialLife;
    return this.life > 0;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.fillStyle = this.color;
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`+${this.score}`, this.x, this.y);
    ctx.restore();
  }
}

// Store active particles and effects
const effects = {
  particles: [],
  scorePopups: [],
  chillMeterPulse: {
    active: false,
    duration: 0,
    maxDuration: 30, // Frames the pulse will last
  },
  magnetism: {
    active: false,
    radius: 100, // Radius in which tokens are attracted to player
    strength: 2, // How strongly tokens are pulled
  },
  screenShake: {
    active: false,
    duration: 0,
    maxDuration: 20, // Frames the shake will last
    intensity: 0, // Maximum shake offset in pixels
    offsetX: 0,
    offsetY: 0
  },
  playerFlash: {
    active: false,
    duration: 0,
    maxDuration: 30, // Frames the flash will last
    pulseCount: 2, // Number of pulses during the flash
    glowSize: 15, // Size of the glow effect in pixels
    colors: ['#FF0000', '#FF5500', '#FFFFFF'] // Colors to cycle through (red, orange, white)
  },
  playerShake: {
    active: false,
    duration: 0,
    maxDuration: 15, // Frames the player shake will last
    intensity: 5, // Maximum shake offset in pixels
    offsetX: 0,
    offsetY: 0
  },
  obstacleReaction: {
    active: false,
    obstacle: null,
    duration: 0,
    maxDuration: 30, // Frames the reaction will last
    rotation: 0,
    offsetX: 0,
    offsetY: 0
  },
  chillMeterDrain: {
    active: false,
    duration: 0,
    maxDuration: 30, // Frames the drain animation will last
    amount: 0, // Amount being drained
    startValue: 0, // Starting chill meter value
    endValue: 0 // Ending chill meter value
  }
};

// Create sparkle effect at position
function createSparkleEffect(x, y) {
  const particleCount = 20;
  const colors = ['#FFD700', '#FFFFFF', '#87CEFA', '#FFA500']; // Gold, White, Light Blue, Orange
  
  for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 3;
    const size = 2 + Math.random() * 3;
    const life = 30 + Math.random() * 30;
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    effects.particles.push(new Particle(
      x,
      y,
      color,
      size,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      life
    ));
  }
}

// Create score popup at position
function createScorePopup(x, y, score) {
  effects.scorePopups.push(new ScorePopup(x, y, score));
}

// Activate chill meter pulse
function activateChillMeterPulse() {
  effects.chillMeterPulse.active = true;
  effects.chillMeterPulse.duration = effects.chillMeterPulse.maxDuration;
}

// Update all active effects
function updateEffects() {
  // Update particles
  effects.particles = effects.particles.filter(particle => particle.update());
  
  // Update score popups
  effects.scorePopups = effects.scorePopups.filter(popup => popup.update());
  
  // Update chill meter pulse
  if (effects.chillMeterPulse.active) {
    effects.chillMeterPulse.duration--;
    if (effects.chillMeterPulse.duration <= 0) {
      effects.chillMeterPulse.active = false;
    }
  }
  
  // Update screen shake
  if (effects.screenShake.active) {
    effects.screenShake.duration--;
    
    // Calculate shake offset based on remaining duration
    const progress = effects.screenShake.duration / effects.screenShake.maxDuration;
    const intensity = effects.screenShake.intensity * progress;
    
    // Random shake offset that decreases over time
    effects.screenShake.offsetX = (Math.random() * 2 - 1) * intensity;
    effects.screenShake.offsetY = (Math.random() * 2 - 1) * intensity;
    
    if (effects.screenShake.duration <= 0) {
      effects.screenShake.active = false;
      effects.screenShake.offsetX = 0;
      effects.screenShake.offsetY = 0;
    }
  }
  
  // Update player flash
  if (effects.playerFlash.active) {
    effects.playerFlash.duration--;
    if (effects.playerFlash.duration <= 0) {
      effects.playerFlash.active = false;
    }
  }
  
  // Update player shake
  if (effects.playerShake.active) {
    effects.playerShake.duration--;
    
    // Calculate shake offset based on remaining duration
    const progress = effects.playerShake.duration / effects.playerShake.maxDuration;
    const intensity = effects.playerShake.intensity * progress;
    
    // Random shake offset that decreases over time
    effects.playerShake.offsetX = (Math.random() * 2 - 1) * intensity;
    effects.playerShake.offsetY = (Math.random() * 2 - 1) * intensity;
    
    if (effects.playerShake.duration <= 0) {
      effects.playerShake.active = false;
      effects.playerShake.offsetX = 0;
      effects.playerShake.offsetY = 0;
    }
  }
  
  // Update obstacle reaction
  if (effects.obstacleReaction.active && effects.obstacleReaction.obstacle) {
    effects.obstacleReaction.duration--;
    
    // Calculate reaction progress
    const progress = effects.obstacleReaction.duration / effects.obstacleReaction.maxDuration;
    const reverseProgress = 1 - progress;
    
    // Apply rotation and offset that decreases over time
    effects.obstacleReaction.rotation = (Math.PI / 8) * Math.sin(progress * Math.PI * 4) * progress;
    effects.obstacleReaction.offsetX = 15 * Math.cos(progress * Math.PI * 2) * reverseProgress;
    effects.obstacleReaction.offsetY = -5 * reverseProgress;
    
    // Apply effects to the obstacle
    if (effects.obstacleReaction.obstacle) {
      effects.obstacleReaction.obstacle.rotation = effects.obstacleReaction.rotation;
      effects.obstacleReaction.obstacle.reactionOffsetX = effects.obstacleReaction.offsetX;
      effects.obstacleReaction.obstacle.reactionOffsetY = effects.obstacleReaction.offsetY;
    }
    
    if (effects.obstacleReaction.duration <= 0) {
      effects.obstacleReaction.active = false;
      if (effects.obstacleReaction.obstacle) {
        effects.obstacleReaction.obstacle.rotation = 0;
        effects.obstacleReaction.obstacle.reactionOffsetX = 0;
        effects.obstacleReaction.obstacle.reactionOffsetY = 0;
      }
      effects.obstacleReaction.obstacle = null;
    }
  }
  
  // Update chill meter drain
  if (effects.chillMeterDrain.active) {
    effects.chillMeterDrain.duration--;
    if (effects.chillMeterDrain.duration <= 0) {
      effects.chillMeterDrain.active = false;
    }
  }
}

// Draw all active effects
function drawEffects(ctx) {
  // Draw particles
  effects.particles.forEach(particle => particle.draw(ctx));
  
  // Draw score popups
  effects.scorePopups.forEach(popup => popup.draw(ctx));
  
  // Apply screen shake to canvas if active
  if (effects.screenShake.active) {
    ctx.save();
    ctx.translate(effects.screenShake.offsetX, effects.screenShake.offsetY);
    // Note: We don't restore here as we want the shake to affect all subsequent drawing
    // The restore will happen in the main draw function after all drawing is done
  }
  
  // Draw player flash if active (this will be called separately in the player drawing function)
}

// Apply token magnetism
function applyTokenMagnetism(player, tokens) {
  const magnetRadius = effects.magnetism.radius;
  const strength = effects.magnetism.strength;
  
  tokens.forEach(token => {
    if (token.collected) return;
    
    // Calculate distance between player and token
    const dx = player.x + player.width / 2 - (token.x + token.width / 2);
    const dy = player.y + player.height / 2 - (token.y + token.height / 2);
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // If token is within magnetism radius, pull it toward player
    if (distance < magnetRadius) {
      const factor = (1 - distance / magnetRadius) * strength;
      token.x += dx * factor * 0.05;
      token.y += dy * factor * 0.05;
    }
  });
}

// Get chill meter pulse color based on current pulse state
function getChillMeterPulseColor(baseColor) {
  if (!effects.chillMeterPulse.active) return baseColor;
  
  // Pulse between base color and a brighter version
  const pulseProgress = effects.chillMeterPulse.duration / effects.chillMeterPulse.maxDuration;
  const intensity = Math.sin(pulseProgress * Math.PI) * 0.5;
  
  // Parse base color to RGB
  let r, g, b;
  if (baseColor.startsWith('#')) {
    r = parseInt(baseColor.slice(1, 3), 16);
    g = parseInt(baseColor.slice(3, 5), 16);
    b = parseInt(baseColor.slice(5, 7), 16);
  } else {
    // Default to a green color if parsing fails
    r = 0; g = 200; b = 0;
  }
  
  // Brighten the color
  r = Math.min(255, r + intensity * 100);
  g = Math.min(255, g + intensity * 100);
  b = Math.min(255, b + intensity * 100);
  
  return `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
}

// Enable token magnetism
function enableTokenMagnetism() {
  effects.magnetism.active = true;
}

// Disable token magnetism
function disableTokenMagnetism() {
  effects.magnetism.active = false;
}

// Create impact particles at collision point
function createImpactParticles(x, y, color = '#FF4500', count = 15) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 4;
    const size = 2 + Math.random() * 4;
    const life = 20 + Math.random() * 20;
    
    effects.particles.push(new Particle(
      x,
      y,
      color,
      size,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      life
    ));
  }
}

// Activate screen shake effect
function activateScreenShake(intensity = 10) {
  effects.screenShake.active = true;
  effects.screenShake.duration = effects.screenShake.maxDuration;
  effects.screenShake.intensity = intensity;
}

// Activate player flash effect
function activatePlayerFlash() {
  effects.playerFlash.active = true;
  effects.playerFlash.duration = effects.playerFlash.maxDuration;
  
  // Create additional impact particles for enhanced effect
  const player = window.gameState.player;
  const centerX = player.x + player.width / 2;
  const centerY = player.y + player.height / 2;
  
  // Create a burst of white particles around the player
  for (let i = 0; i < 10; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = 5 + Math.random() * 15;
    const x = centerX + Math.cos(angle) * distance;
    const y = centerY + Math.sin(angle) * distance;
    
    effects.particles.push(new Particle(
      x, y,
      '#FFFFFF',
      3 + Math.random() * 2,
      Math.cos(angle) * 2,
      Math.sin(angle) * 2,
      15 + Math.random() * 10,
      0.8
    ));
  }
}

// Activate player shake effect
function activatePlayerShake(intensity = 5) {
  effects.playerShake.active = true;
  effects.playerShake.duration = effects.playerShake.maxDuration;
  effects.playerShake.intensity = intensity;
}

// Activate obstacle reaction
function activateObstacleReaction(obstacle) {
  effects.obstacleReaction.active = true;
  effects.obstacleReaction.obstacle = obstacle;
  effects.obstacleReaction.duration = effects.obstacleReaction.maxDuration;
}

// Activate chill meter drain visualization
function activateChillMeterDrain(startValue, endValue) {
  effects.chillMeterDrain.active = true;
  effects.chillMeterDrain.duration = effects.chillMeterDrain.maxDuration;
  effects.chillMeterDrain.startValue = startValue;
  effects.chillMeterDrain.endValue = endValue;
  effects.chillMeterDrain.amount = startValue - endValue;
}

// Get current chill meter drain progress
function getChillMeterDrainProgress() {
  if (!effects.chillMeterDrain.active) return 1;
  
  const progress = effects.chillMeterDrain.duration / effects.chillMeterDrain.maxDuration;
  return progress;
}

// Check if screen shake is active
function isScreenShakeActive() {
  return effects.screenShake.active;
}

// Check if player flash is active
function isPlayerFlashActive() {
  return effects.playerFlash.active;
}

// Get player flash parameters for rendering
function getPlayerFlashParams() {
  if (!effects.playerFlash.active) {
    return {
      active: false,
      glowSize: 0,
      color: 'rgba(255, 0, 0, 0)',
      opacity: 0
    };
  }
  
  const progress = effects.playerFlash.duration / effects.playerFlash.maxDuration;
  
  // Calculate pulsing effect (oscillating between 0 and 1)
  const pulseProgress = Math.sin(progress * Math.PI * 2 * effects.playerFlash.pulseCount);
  const normalizedPulse = (pulseProgress + 1) / 2; // Convert from [-1, 1] to [0, 1]
  
  // Calculate color based on progress
  const colorIndex = Math.floor(normalizedPulse * (effects.playerFlash.colors.length - 1));
  const nextColorIndex = Math.min(colorIndex + 1, effects.playerFlash.colors.length - 1);
  const colorProgress = normalizedPulse * (effects.playerFlash.colors.length - 1) - colorIndex;
  
  // Get base colors
  const baseColor = effects.playerFlash.colors[colorIndex];
  const nextColor = effects.playerFlash.colors[nextColorIndex];
  
  // Calculate glow size with pulsing effect
  const maxGlowSize = effects.playerFlash.glowSize;
  const glowSize = maxGlowSize * (0.5 + normalizedPulse * 0.5) * progress;
  
  // Base opacity that fades out over time
  const opacity = Math.min(1, progress * 1.5);
  
  return {
    active: true,
    glowSize: glowSize,
    color: baseColor,
    nextColor: nextColor,
    colorProgress: colorProgress,
    opacity: opacity,
    pulseProgress: normalizedPulse
  };
}

// Reset canvas transform after screen shake
function resetScreenShake(ctx) {
  if (effects.screenShake.active) {
    ctx.restore();
  }
}

// Check if player shake is active
function isPlayerShakeActive() {
  return effects.playerShake.active;
}

// Get player shake parameters for rendering
function getPlayerShakeParams() {
  if (!effects.playerShake.active) {
    return {
      offsetX: 0,
      offsetY: 0
    };
  }
  
  return {
    offsetX: effects.playerShake.offsetX,
    offsetY: effects.playerShake.offsetY
  };
}

// Export functions
export {
  createSparkleEffect,
  createScorePopup,
  activateChillMeterPulse,
  updateEffects,
  drawEffects,
  applyTokenMagnetism,
  getChillMeterPulseColor,
  enableTokenMagnetism,
  disableTokenMagnetism,
  createImpactParticles,
  activateScreenShake,
  activatePlayerFlash,
  activatePlayerShake,
  activateObstacleReaction,
  activateChillMeterDrain,
  getPlayerFlashParams,
  getPlayerShakeParams,
  getChillMeterDrainProgress,
  isScreenShakeActive,
  isPlayerFlashActive,
  isPlayerShakeActive,
  resetScreenShake,
  effects
};
