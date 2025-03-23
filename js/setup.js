// Setup page functionality
document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const fileInputs = {
    player: document.getElementById('player-image'),
    obstacle: document.getElementById('obstacle-image'),
    token: document.getElementById('token-image'),
    ground: document.getElementById('ground-image'),
    sky: document.getElementById('sky-image')
  };
  
  const previews = {
    player: document.getElementById('player-preview'),
    obstacle: document.getElementById('obstacle-preview'),
    token: document.getElementById('token-preview'),
    ground: document.getElementById('ground-preview'),
    sky: document.getElementById('sky-preview')
  };
  
  const clearButtons = document.querySelectorAll('.clear-btn');
  const createGameLinkBtn = document.getElementById('create-game-link');
  const shareSection = document.getElementById('share-section');
  const shareLinkInput = document.getElementById('share-link');
  const copyLinkBtn = document.getElementById('copy-link');
  const playGameBtn = document.getElementById('play-game');
  const gameNameInput = document.getElementById('game-name');
  
  // Store uploaded images as base64 strings
  const uploadedImages = {
    player: null,
    obstacle: null,
    token: null,
    ground: null,
    sky: null
  };
  
  // Default preview paths
  const defaultPreviews = {
    player: 'img/default-preview/player.png',
    obstacle: 'img/default-preview/obstacle.png',
    token: 'img/default-preview/token.png',
    ground: 'img/default-preview/ground.png',
    sky: 'img/default-preview/sky.png'
  };
  
  // Load default previews
  Object.keys(previews).forEach(key => {
    previews[key].src = defaultPreviews[key];
    previews[key].onerror = () => {
      console.warn(`Default preview for ${key} not found, using placeholder`);
      // Use a colored rectangle as fallback
      const colors = {
        player: '#3498db',
        obstacle: '#e74c3c',
        token: '#f1c40f',
        ground: '#27ae60',
        sky: '#87CEEB'
      };
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 150;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = colors[key] || '#cccccc';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(key.charAt(0).toUpperCase() + key.slice(1), canvas.width/2, canvas.height/2);
      previews[key].src = canvas.toDataURL();
    };
  });
  
  // Handle file input changes
  Object.keys(fileInputs).forEach(key => {
    fileInputs[key].addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        
        reader.onload = (event) => {
          // Update preview image
          previews[key].src = event.target.result;
          
          // Store base64 data
          uploadedImages[key] = event.target.result;
        };
        
        reader.readAsDataURL(file);
      }
    });
  });
  
  // Handle clear buttons
  clearButtons.forEach(button => {
    button.addEventListener('click', () => {
      const target = button.getAttribute('data-target');
      
      // Reset file input
      fileInputs[target].value = '';
      
      // Reset preview to default
      previews[target].src = defaultPreviews[target];
      
      // Clear stored image
      uploadedImages[target] = null;
    });
  });
  
  // Create game link
  createGameLinkBtn.addEventListener('click', async () => {
    // Show loading indicator
    createGameLinkBtn.textContent = 'Creating link...';
    createGameLinkBtn.disabled = true;
    
    try {
      // Get game name (use default if empty)
      const gameName = gameNameInput.value.trim() || 'My Custom Chillguy Game';
      
      // Generate a unique game ID
      const gameId = generateUniqueId();
      
      // Create game data object
      const gameData = {
        id: gameId,
        name: gameName,
        images: {}
      };
      
      // Check if any images were uploaded
      let hasImages = false;
      
      // Process all images in parallel
      const imagePromises = [];
      
      // Prepare promises for all images
      Object.keys(uploadedImages).forEach(key => {
        if (uploadedImages[key]) {
          hasImages = true;
          const promise = resizeImageData(uploadedImages[key], 400)
            .then(smallerImage => {
              gameData.images[key] = smallerImage;
            });
          imagePromises.push(promise);
        }
      });
      
      // Wait for all image processing to complete
      await Promise.all(imagePromises);
      
      // Store the game data in localStorage
      localStorage.setItem(`chillguy_game_${gameId}`, JSON.stringify(gameData));
      
      // Create shareable link with just the game ID
      const baseUrl = window.location.origin;
      const shareableLink = `${baseUrl}/index.html?game=${gameId}`;
      
      // Update share link input
      shareLinkInput.value = shareableLink;
      
      // Show share section
      shareSection.classList.remove('hidden');
      
      // Set play game button link
      playGameBtn.onclick = () => {
        window.location.href = shareableLink;
      };
      
      // Scroll to share section
      shareSection.scrollIntoView({ behavior: 'smooth' });
      
      // Log success message
      console.log('Game link created successfully with ID:', gameId);
      if (hasImages) {
        console.log('Custom images stored in localStorage');
      } else {
        console.log('No custom images were included');
      }
    } catch (error) {
      console.error('Error creating game link:', error);
      alert('Error creating game link: ' + error.message);
    } finally {
      // Reset button
      createGameLinkBtn.textContent = 'Create Game Link';
      createGameLinkBtn.disabled = false;
    }
  });
  
  // Copy link button
  copyLinkBtn.addEventListener('click', () => {
    shareLinkInput.select();
    document.execCommand('copy');
    
    // Change button text temporarily
    const originalText = copyLinkBtn.textContent;
    copyLinkBtn.textContent = 'Copied!';
    
    setTimeout(() => {
      copyLinkBtn.textContent = originalText;
    }, 2000);
  });
  
  // Generate a unique ID for the game
  function generateUniqueId() {
    return 'game_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
  }
  
  // Helper function to resize image data
  function resizeImageData(dataUrl, maxDimension) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = function() {
        // Calculate new dimensions
        let width = img.width;
        let height = img.height;
        const aspectRatio = width / height;
        
        if (width > height && width > maxDimension) {
          width = maxDimension;
          height = width / aspectRatio;
        } else if (height > maxDimension) {
          height = maxDimension;
          width = height * aspectRatio;
        }
        
        // Create canvas and resize image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // Clear canvas with transparent background
        ctx.clearRect(0, 0, width, height);
        
        // Draw image with preserved transparency
        ctx.drawImage(img, 0, 0, width, height);
        
        // Get resized data URL as PNG to preserve transparency
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = dataUrl;
    });
  }
});
