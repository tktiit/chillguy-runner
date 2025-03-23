// Device detection
const isMobile =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) || window.innerWidth < 768;

// Base configurations
const BASE_CONFIG = {
  // Game environment settings
  GROUND_HEIGHT_RATIO: 0.75,
  GROUND_COLOR: {
    TOP: "#90EE90",
    BOTTOM: "#228B22",
  },
  SHOW_MOUNTAINS: false,

  // Sound settings
  SOUND: {
    ENABLED: true, // Default sound state
    VOLUME: {
      MASTER: 0.7,
      EFFECTS: 0.8,
      MUSIC: 0.5,
    },
    MUSIC_ENABLED: true, // Separate toggle for background music
  },

  // Sky object settings
  SKY_OBJECTS: {
    TYPE: "clouds", // clouds, asteroids, or rockets
    COUNT: 5,
    SIZE_RATIO: {
      MIN: 0.03, // 3% of the smaller screen dimension
      MAX: 0.07, // 7% of the smaller screen dimension
    },
    MIN_SPEED: 0.5,
    MAX_SPEED: 1.0,
    MIN_OPACITY: 0.7,
    MAX_OPACITY: 1.0,
  },

  // HUD settings
  HUD: {
    SPACING_RATIO: 0.05,
    METER_HEIGHT: 30,
  },

  // Scoring settings
  SCORE_INCREMENT: 10, // Points per token
  SCORE_PER_SECOND: 1, // Points per second of gameplay

  // High score settings
  HIGH_SCORE: {
    STORAGE_KEY: "chillguyHighScore",
    ENABLED: true, // Whether to save and load high scores
  },

  // Game over screen settings
  GAME_OVER: {
    FONT: "Arial",
    TITLE_COLOR: "#FFFFFF",
    SCORE_COLOR: "#FFFFFF",
    BUTTON: {
      BACKGROUND_COLOR: "#4CAF50",
      TEXT_COLOR: "#FFFFFF",
      BORDER_COLOR: "#FFFFFF",
      TEXT: "RESTART",
      BORDER_WIDTH: 2,
      CORNER_RADIUS: 10, // Rounded corners radius
    },
  },

  // Chill meter settings
  CHILL_DECREMENT: 0.05, // Default chill meter decrease per frame

  // Platform settings
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

  // Spawn rates
  SPAWN_RATES: {
    TOKEN: 0.02,
    OBSTACLE: 0.01,
  },

  // Chill meter adjustments
  CHILL_METER: {
    INCREMENT: 10, // Increase when collecting tokens
    DECREMENT: 20, // Decrease when hitting obstacles
  },

  // Size ratios for game elements
  SIZES: {
    PLAYER: {
      BASE_RATIO: 0.08,
      WIDTH_RATIO: 0.05,
      HEIGHT_RATIO: 0.08,
      X_RATIO: 0.2,
    },
    TOKEN: {
      BASE_RATIO: 0.05,
    },
    OBSTACLE: {
      BASE_RATIO: 0.07,
    },
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
  SKY_OBJECTS: {
    ...BASE_CONFIG.SKY_OBJECTS,
    // Mobile-specific sky object settings (if needed)
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
      BASE_RATIO: 0.15,
    },
    TOKEN: {
      BASE_RATIO: 0.08,
    },
    OBSTACLE: {
      BASE_RATIO: 0.1,
    },
  },
};

// Desktop-specific configuration
const DESKTOP_CONFIG = {
  ...BASE_CONFIG,
  JUMP_VELOCITY: -20,
  GRAVITY: 0.6,
  HUD: {
    ...BASE_CONFIG.HUD,
    MIN_SPACING: 30,
  },
  SKY_OBJECTS: {
    ...BASE_CONFIG.SKY_OBJECTS,
    // Desktop-specific sky object settings (if needed)
  },
  SPAWN_RATES: {
    TOKEN: 0.02,
    OBSTACLE: 0.01,
  },
  MOVEMENT_SPEED: 10,
  CHILL_METER: {
    INCREMENT: 10,
    DECREMENT: 15,
  },
  SIZES: {
    PLAYER: {
      BASE_RATIO: 0.12,
    },
    TOKEN: {
      BASE_RATIO: 0.06,
    },
    OBSTACLE: {
      BASE_RATIO: 0.08,
    },
  },
};

// Use mobile or desktop config based on device
const CONFIG = isMobile ? MOBILE_CONFIG : DESKTOP_CONFIG;

// Export configurations
export { CONFIG, isMobile };
