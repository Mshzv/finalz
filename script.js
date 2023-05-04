const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let gameOver = false;
let highScore = 0;
let backgroundImage = new Image();
let animationFrame = 0;
let charImage1 = new Image();
let charImage2 = new Image();
let floorImage = new Image();
let explosionImage = new Image();

function loadAssets(callback) {
  const assets = [
    {img: backgroundImage, src: 'background2.png'},
    {img: charImage1, src: 'char1.png'},
    {img: charImage2, src: 'char2.png'},
    {img: floorImage, src: 'water.png'},
    {img: explosionImage, src: 'T-earthexplo.png'}
  ];
  
  let loaded = 0;
  assets.forEach(asset => {
    asset.img.onload = () => {
      loaded++;
      if (loaded === assets.length) {
        callback();
      }
    };
    asset.img.src = asset.src;
  });
}

const camera = {
  x: 0,
  y: 0,
  width: canvas.width,
  height: canvas.height,
  update() {
    this.x = player.x - 50;
    if (this.x < 0) {
      this.x = 0;
    }
  },
};

const player = {
  x: 50,
  y: canvas.height - 150 - 50,
  width: 30,
  height: 50,
  velocityX: 0,
  velocityY: 0,
  isJumping: false,
  speed: 4,
  jumpHeight: 12,
  score: 0,
  currentImage: null,
  explosionCounter: 0,
};

function setPlayerPositionOnPlatform(platform) {
  player.x = platform.x;
  player.y = platform.y - player.height;
}

class Platform {
  constructor(x, y, width, height, color) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
  }

  draw() {
    const radius = 10;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(this.x + radius, this.y);
    ctx.lineTo(this.x + this.width - radius, this.y);
    ctx.quadraticCurveTo(this.x + this.width, this.y, this.x + this.width, this.y + radius);
    ctx.lineTo(this.x + this.width, this.y + this.height - radius);
    ctx.quadraticCurveTo(this.x + this.width, this.y + this.height, this.x + this.width - radius, this.y + this.height);
    ctx.lineTo(this.x + radius, this.y + this.height);
    ctx.quadraticCurveTo(this.x, this.y + this.height, this.x, this.y + this.height - radius);
    ctx.lineTo(this.x, this.y + radius);
    ctx.quadraticCurveTo(this.x, this.y, this.x + radius, this.y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}


class Coin {
  constructor(x, y, radius, color = '#50C878') { 
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.rotation = 0; 
  }
  

  draw() {
    this.rotation += 0.1;
    if (this.rotation >= Math.PI * 2) {
      this.rotation = 0;
    }
  
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(this.x - camera.x, this.y - this.radius);
    ctx.lineTo(this.x - camera.x + this.radius * 0.5, this.y);
    ctx.lineTo(this.x - camera.x, this.y + this.radius);
    ctx.lineTo(this.x - camera.x - this.radius * 0.5, this.y);
    ctx.closePath();
    ctx.fill();
  }
  
}

const platforms = [];

function generatePlatforms() {
  // Check if the last platform in the array is close enough to the camera's right edge
  if (platforms.length === 0 || platforms[platforms.length - 1].x - camera.x < canvas.width - 200) {
    const platformWidth = 200;
    const platformHeight = 20;
    const platformColor = '#333333'; // Dark grey color
    let minHeight = canvas.height / 2;
    let maxHeight = canvas.height - 150;
    const minGap = 50;
    const maxGap = 200;

    // Calculate the x position of the new platform
    const randomGap = Math.floor(Math.random() * (maxGap - minGap + 1) + minGap);
    const xPos = platforms.length === 0 ? player.x + randomGap : platforms[platforms.length - 1].x + platformWidth + randomGap;

    let yPos;
    if (platforms.length === 0) {
      yPos = player.y;
    } else {
      // Calculate a random y position based on the last platform's height
      const lastPlatformHeight = platforms[platforms.length - 1].y;
      const reachableMinHeight = Math.max(minHeight, lastPlatformHeight - player.jumpHeight * 2);
      const reachableMaxHeight = Math.min(maxHeight, lastPlatformHeight + player.jumpHeight * 2);
      yPos = Math.floor(Math.random() * (reachableMaxHeight - reachableMinHeight + 1) + reachableMinHeight);
    }

    // Create a new platform and add it to the platforms array
    platforms.push(new Platform(xPos, yPos, platformWidth, platformHeight, platformColor));

    // Set the player's position on the first platform
    if (platforms.length === 1) {
      setPlayerPositionOnPlatform(platforms[0]);
    }

    // Call generateCoins() after adding the new platform to the array
    generateCoins();
  }
}

const coins = [];

function generateCoins() {
  platforms.forEach((platform) => {
    if (!platform.coinsGenerated) {
      const numberOfCoins = Math.floor(Math.random() * 4) + 1;
      const coinSpacing = platform.width / (numberOfCoins + 1);

      for (let i = 0; i < numberOfCoins; i++) {
        const coinX = platform.x + coinSpacing * (i + 1);
        const coinY = platform.y - 25;
        coins.push(new Coin(coinX, coinY, 15, 'green'));
      }
      platform.coinsGenerated = true;
    }
  });
}

const keys = {};

window.addEventListener('keydown', (event) => {
  if (['ArrowUp', 'KeyW', 'Space'].includes(event.code)) {
    event.preventDefault();
  }
  keys[event.code] = true;
});

generatePlatforms();

window.addEventListener('keyup', (event) => {
  keys[event.code] = false;
});

function handlePlayerMovement() {
  player.x += player.speed;
  player.velocityX = player.speed;
  if (player.x < 0) {
    player.x = 0;
  }
}

function handlePlayerVerticalMovement() {
  
  player.velocityY += 0.5; 
  player.y += player.velocityY;

  let onPlatform = false;
  const floorHeight = 50;
  if (player.y + player.height >= canvas.height - floorHeight) {
    onPlatform = true;
    player.y = canvas.height - player.height - floorHeight;
    player.velocityY = 0;
  }
  platforms.forEach((platform) => {
    if (
      player.x < platform.x + platform.width &&
      player.x + player.width > platform.x &&
      player.y + player.height >= platform.y - 5 &&
      player.y + player.height <= platform.y + platform.height
    ) {
      onPlatform = true;
      player.y = platform.y - player.height;
      player.velocityY = 0; // Reset player's vertical velocity when on a platform
    }
  });

  // Jumping
  if (
    (keys['Space'] || keys['ArrowUp'] || keys['KeyW']) &&
    onPlatform
  ) {
    player.velocityY = -player.jumpHeight;
  }
}
  

function detectPlatformCollision() {
  const prevY = player.y - player.velocityY;

  let onPlatform = false;

  platforms.forEach((platform) => {
    // Check vertical collision first
    if (
      player.x < platform.x + platform.width &&
      player.x + player.width > platform.x
    ) {
      // Collision on the top side of the platform
      if (
        prevY + player.height <= platform.y &&
        player.y + player.height >= platform.y &&
        player.velocityY >= 0
      ) {
        player.y = platform.y - player.height;
        player.velocityY = 0;
        onPlatform = true;
      }
      // Collision on the bottom side of the platform
      else if (
        prevY >= platform.y + platform.height &&
        player.y <= platform.y + platform.height
      ) {
        player.y = platform.y + platform.height;
        player.velocityY = 0;
      }
    }

    // Check horizontal collision after vertical collision
    if (
      player.y + player.height > platform.y &&
      player.y < platform.y + platform.height
    ) {
      // Collision on the left side of the platform
      if (
        player.x + player.width >= platform.x &&
        player.x + player.width <= platform.x + 5
      ) {
        player.x = platform.x - player.width;
      }
      // Collision on the right side of the platform
      else if (
        player.x <= platform.x + platform.width &&
        player.x >= platform.x + platform.width - 5
      ) {
        player.x = platform.x + platform.width;
      }
    }
  });

  if (onPlatform) {
    player.isJumping = false;
  }
}
  
    function detectCoinCollision() {
      coins.forEach((coin, index) => {
        const playerCenterX = player.x + player.width / 2;
        const playerCenterY = player.y + player.height / 2;
        const distance = Math.sqrt((playerCenterX - coin.x) ** 2 + (playerCenterY - coin.y) ** 2);
        if (distance < player.width / 2 + coin.radius) {
          player.score += 1;
          coins.splice(index, 1);
        }
      });
    }       

  function checkGroundCollision() {
    const floorHeight = 50;
  
    if (player.y + player.height > canvas.height - floorHeight) {
      player.y = canvas.height - player.height - floorHeight;
      player.velocityY = 0;
    }
  }
  
  function resetGame() {
    gameOver = false;
    player.x = 50;
    player.y = canvas.height - 150 - 50;
    player.velocityX = 0;
    player.velocityY = 0;
    player.score = 0;
    camera.x = 0;
    platforms.length = 0;
    coins.length = 0;
    generatePlatforms();
    player.explosionDrawn = false; // Add this line here to reset the explosionDrawn property when the game is reset
    player.explosionCounter = 0; // Reset the explosionCounter when the game is reset
  }

  function update() {
    if (!gameOver) {
      handlePlayerVerticalMovement();
      detectPlatformCollision();
      checkGroundCollision();
      detectCoinCollision();
  
      // Update player.isJumping value based on player's position relative to the platforms
      let onPlatform = false;
      platforms.forEach((platform) => {
        if (
          player.x < platform.x + platform.width &&
          player.x + player.width > platform.x &&
          player.y + player.height === platform.y
        ) {
          onPlatform = true;
        }
      });
      player.isJumping = !onPlatform;
  
      const prevX = player.x; // Store the player's x position before handling movement
      handlePlayerMovement();
      generateCoins();
      detectCoinCollision();
  
      // Update player.velocityX based on the change in player.x
      player.velocityX = player.x - prevX;
  
      camera.update();
  
      // Update the current character image
      if (player.isJumping) {
        player.currentImage = charImage1;
        animationFrame = 0; // Reset animationFrame when the player is jumping
      } else {
     
        if (animationFrame % 20 < 10) {
          player.currentImage = charImage1;
        } else {
          player.currentImage = charImage2;
        }
      }
  
      // Generate new platforms as the player moves
      generatePlatforms();
    }
  
    // Check for game over
    if (player.y + player.height >= canvas.height - 50) {
      gameOver = true;
      if (player.score > highScore) {
        highScore = player.score;
      }
    }
  }

  
  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
  
    // Draw the platforms, coins, and floor
    ctx.save();
    ctx.translate(-camera.x, 0);
    platforms.forEach((platform) => platform.draw());
    drawFloor();
    ctx.restore();
    coins.forEach((coin) => coin.draw());
  
    // Draw the character image
    drawCharacter();
  
    // Draw the score box and high score box
    drawScoreBox();
    drawHighScoreBox();
  
    // Display the "Game Over" message and "Reset" button
    drawGameOverAndReset();
  }

  function drawCharacter() {
    const characterHeight = player.height;
    const characterWidth = (charImage1.width / charImage1.height) * characterHeight;
  
    if (!gameOver) {
      ctx.save();
      ctx.translate(-camera.x, 0);
  
      // Check if the character is moving left, and if so, flip the character image
      if (player.velocityX < 0) {
        ctx.scale(-1, 1);
        ctx.drawImage(
          player.currentImage,
          -player.x - characterWidth + characterWidth, // Add characterWidth to the x-position calculation
          player.y,
          -characterWidth,
          characterHeight
        );
      } else {
        ctx.drawImage(
          player.currentImage,
          player.x,
          player.y,
          characterWidth,
          characterHeight
        );
      }
  
      ctx.restore();
    }
  
  if (gameOver && player.explosionCounter < 50) { 
    const explosionWidth = characterWidth * 2; 
    const explosionHeight = characterHeight * 2; 

    ctx.save();
    ctx.translate(-camera.x, 0);
    ctx.drawImage(
      explosionImage,
      player.x - (explosionWidth - characterWidth) / 2, 
      player.y - (explosionHeight - characterHeight) / 2, 
      explosionWidth,
      explosionHeight
    );
    ctx.restore();

    player.explosionCounter++; 
  }
}
  
  function drawFloor() {
    const tileWidth = floorImage.width;
    const tileHeight = floorImage.height;
    const numTiles = Math.ceil(canvas.width / tileWidth) + 1;
  
    const startX = Math.floor(camera.x / tileWidth) * tileWidth;
  
    for (let i = 0; i < numTiles; i++) {
      ctx.drawImage(
        floorImage,
        startX + i * tileWidth,
        canvas.height - 50,
        tileWidth,
        tileHeight
      );
    }
  }
  
  function drawScoreBox() {
    drawRoundedRect(5, 5, 150, 35, 5, 'white', 'black', 3);
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText(`SCORE: ${player.score}`, 10, 30);
  }
  
  function drawHighScoreBox() {
    drawRoundedRect(canvas.width - 185, 5, 180, 35, 5, 'white', 'black', 3);
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText(`HIGH SCORE: ${highScore}`, canvas.width - 180, 30);
  }
  
  function drawGameOverAndReset() {
    if (gameOver) {
      ctx.fillStyle = 'black';
      ctx.font = '40px Arial';
      ctx.fillText('Game Over', canvas.width / 2 - 100, canvas.height / 2);
  
      ctx.fillStyle = 'blue';
      ctx.fillRect(canvas.width / 2 - 60, canvas.height / 2 + 20, 120, 40);
      ctx.fillStyle = 'white';
      ctx.font = '20px Arial';
      ctx.fillText('Reset', canvas.width / 2 - 25, canvas.height / 2 + 45);
    }
  }
  
  function drawBackground() {
    const scale = canvas.height / backgroundImage.height;
    const scaledWidth = backgroundImage.width * scale;
    const numImages = Math.ceil(canvas.width / scaledWidth) + 1;
  
    let offsetX = (camera.x * 0.5) % scaledWidth;
    for (let i = 0; i < numImages; i++) {
      ctx.drawImage(backgroundImage, i * scaledWidth - offsetX, 0, scaledWidth, canvas.height);
    }
  }

  function drawRoundedRect(x, y, width, height, radius, fillColor, borderColor, borderWidth) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  
    if (fillColor) {
      ctx.fillStyle = fillColor;
      ctx.fill();
    }
  
    if (borderColor && borderWidth) {
      ctx.lineWidth = borderWidth;
      ctx.strokeStyle = borderColor;
      ctx.stroke();
    }
  }

function gameLoop() {
  update();
  render();
  requestAnimationFrame(gameLoop);
}

generatePlatforms();
loadAssets(function() {
  gameLoop();
});

window.addEventListener('keydown', (event) => {
  if (event.code === 'KeyN') {
    switchLevel();
  }
});

canvas.addEventListener('click', (event) => {
  if (gameOver) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const buttonX = canvas.width / 2 - 60;
    const buttonY = canvas.height / 2 + 20;
    const buttonWidth = 120;
    const buttonHeight = 40;

    if (
      x >= buttonX &&
      x <= buttonX + buttonWidth &&
      y >= buttonY &&
      y <= buttonY + buttonHeight
    ) {
      resetGame();
    }
  }
});