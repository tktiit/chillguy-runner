// Game data handling for custom assets and sharing

/**
 * Get game ID from URL
 * @returns {string|null} - Game ID or null if not found
 */
function getGameIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('game');
}

/**
 * Load game data from localStorage
 * @param {string} gameId - Game ID
 * @returns {Object|null} - Game data or null if not found
 */
function loadGameDataFromStorage(gameId) {
  if (!gameId) return null;
  
  try {
    const gameData = localStorage.getItem(`chillguy_game_${gameId}`);
    if (!gameData) return null;
    
    return JSON.parse(gameData);
  } catch (error) {
    console.error('Error loading game data from localStorage:', error);
    return null;
  }
}

/**
 * Load custom game data into game state
 * @param {Object} gameState - Game state object
 * @returns {boolean} - True if custom data was loaded
 */
function loadCustomGameData(gameState) {
  // Get game ID from URL
  const gameId = getGameIdFromUrl();
  if (!gameId) return false;
  
  // Load game data from localStorage
  const gameData = loadGameDataFromStorage(gameId);
  if (!gameData) {
    console.warn(`Game data for ID ${gameId} not found in localStorage`);
    return false;
  }
  
  console.log('Custom game data found:', gameData.name);
  
  // Set custom game name if provided
  if (gameData.name) {
    gameState.gameName = gameData.name;
    document.title = gameData.name;
  }
  
  // Initialize customImages if not already initialized
  if (!gameState.customImages) {
    gameState.customImages = {};
  }
  
  // Initialize images object if not already initialized
  if (!gameState.images) {
    gameState.images = {};
  }
  
  // Load custom images if provided
  if (gameData.images) {
    console.log('Loading custom images:', Object.keys(gameData.images));
    
    // Store custom images in game state
    Object.keys(gameData.images).forEach(key => {
      try {
        const img = new Image();
        
        // Set up error handling
        img.onerror = () => {
          console.error(`Failed to load custom ${key} image`);
          gameState.customImages[key] = false;
        };
        
        // Set up load handling
        img.onload = () => {
          console.log(`Custom ${key} image loaded successfully`);
          gameState.customImages[key] = true;
        };
        
        // Set the source
        img.src = gameData.images[key];
        
        // Store the image in the game state
        gameState.images[key] = img;
        gameState.customImages[key] = true; // Mark as custom
      } catch (error) {
        console.error(`Error loading custom ${key} image:`, error);
      }
    });
    
    return true;
  }
  
  return false;
}

// Export functions
export {
  getGameIdFromUrl,
  loadGameDataFromStorage,
  loadCustomGameData
};
