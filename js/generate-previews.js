// Script to generate default preview images for the setup page
// Run this script once to create the preview images

// Create a canvas element
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = 200;
canvas.height = 150;

// Function to draw a preview image and convert to data URL
function generatePreview(type) {
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Set background
  ctx.fillStyle = '#f0f8ff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw different shapes based on type
  switch(type) {
    case 'player':
      // Draw player character
      ctx.fillStyle = '#3498db';
      ctx.fillRect(75, 50, 50, 70);
      ctx.fillStyle = '#2c3e50';
      ctx.fillRect(85, 30, 30, 20);
      break;
      
    case 'obstacle':
      // Draw obstacle
      ctx.fillStyle = '#e74c3c';
      ctx.beginPath();
      ctx.moveTo(75, 30);
      ctx.lineTo(125, 30);
      ctx.lineTo(100, 120);
      ctx.closePath();
      ctx.fill();
      break;
      
    case 'token':
      // Draw token
      ctx.fillStyle = '#f1c40f';
      ctx.beginPath();
      ctx.arc(100, 75, 40, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f39c12';
      ctx.beginPath();
      ctx.arc(100, 75, 25, 0, Math.PI * 2);
      ctx.fill();
      break;
      
    case 'ground':
      // Draw ground
      ctx.fillStyle = '#27ae60';
      ctx.fillRect(0, 100, canvas.width, 50);
      ctx.fillStyle = '#2ecc71';
      for (let i = 0; i < canvas.width; i += 20) {
        ctx.fillRect(i, 100, 10, 5);
      }
      break;
      
    case 'sky':
      // Draw sky
      ctx.fillStyle = '#3498db';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'white';
      // Draw clouds
      for (let i = 0; i < 3; i++) {
        const x = 30 + i * 60;
        const y = 30 + i * 15;
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2);
        ctx.arc(x + 15, y - 10, 15, 0, Math.PI * 2);
        ctx.arc(x + 25, y + 5, 18, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
  }
  
  // Add text label
  ctx.fillStyle = '#2c3e50';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`Default ${type.charAt(0).toUpperCase() + type.slice(1)}`, canvas.width / 2, 20);
  
  // Return data URL
  return canvas.toDataURL('image/png');
}

// Generate all preview images
const previewTypes = ['player', 'obstacle', 'token', 'ground', 'sky'];
const previewUrls = {};

previewTypes.forEach(type => {
  previewUrls[type] = generatePreview(type);
  
  // Create an image element to download
  const img = new Image();
  img.src = previewUrls[type];
  
  // Create a download link
  const link = document.createElement('a');
  link.download = `${type}.png`;
  link.href = previewUrls[type];
  link.textContent = `Download ${type} preview`;
  
  // Add to document
  document.body.appendChild(link);
  document.body.appendChild(document.createElement('br'));
});

console.log('Preview images generated. Click the links to download them.');
