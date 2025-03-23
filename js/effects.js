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
}

// Draw all active effects
function drawEffects(ctx) {
  // Draw particles
  effects.particles.forEach(particle => particle.draw(ctx));
  
  // Draw score popups
  effects.scorePopups.forEach(popup => popup.draw(ctx));
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
  effects
};
