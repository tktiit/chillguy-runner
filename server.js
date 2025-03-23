const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Middleware to protect JS files from direct access
app.use((req, res, next) => {
  // Block direct access to individual JS files except when requested by the game
  if (req.path.startsWith('/js/') && req.path.endsWith('.js')) {
    const referer = req.headers.referer;
    // Allow access only if the request is coming from our game page
    if (!referer || !referer.includes(req.headers.host)) {
      return res.status(403).send('Access Forbidden');
    }
  }
  next();
});

// Serve static files from the root directory
app.use(express.static(__dirname));

// Serve the main HTML file for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`Chillguy Runner server running at http://localhost:${port}`);
  console.log(`Your game is now secure from direct JS file access`);
});
