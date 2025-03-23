# Chill Guy Runner

A simple endless runner game where you play as Chill Guy, collecting vibe tokens while avoiding obstacles. Jump to survive and maintain your chill meter!

## How to Play

- Click, tap, or press spacebar to jump
- Collect yellow tokens to increase your score and chill meter
- Avoid red obstacles
- Keep your chill meter above 0 to stay in the game
- Use the sound toggle button in the top right to turn sound on/off

## Features

- Dynamic sky objects (clouds, asteroids, or rockets) controlled via config
- Sound effects for jumping, collecting tokens, hitting obstacles, and game over
- Responsive design that works on both desktop and mobile devices
- Score system: +10 points per token, +1 point per second of gameplay
- Multiple image format support with fallback to programmatic drawing

## Running Locally with Secure Server

### Prerequisites

- Node.js and npm installed on your machine

### Installation

1. Clone the repository
2. Navigate to the project directory
3. Install dependencies:

```bash
npm install
```

### Running the Game

Start the secure Express server:

```bash
npm start
```

The game will be available at http://localhost:3000

### Security Features

The Express server includes security measures to prevent direct access to JavaScript files, protecting your game code while still allowing the game to function properly.

## Play Online

Visit [https://YOUR-USERNAME.github.io/chillguy-runner](https://YOUR-USERNAME.github.io/chillguy-runner) to play the game!
