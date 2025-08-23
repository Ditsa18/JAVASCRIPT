const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const eatSound = document.getElementById("eatSound");
const gameOverSound = document.getElementById("gameOverSound");

const overlay = document.getElementById("overlay");
const restartBtn = document.getElementById("restartBtn");
const scoreDisplay = document.getElementById("score");

const box = 20;
let snake, direction, food, score, game;

document.addEventListener("keydown", setDirection);
restartBtn.addEventListener("click", restartGame);

function setDirection(event) {
  if (event.key === "ArrowLeft" && direction !== "RIGHT") direction = "LEFT";
  else if (event.key === "ArrowUp" && direction !== "DOWN") direction = "UP";
  else if (event.key === "ArrowRight" && direction !== "LEFT") direction = "RIGHT";
  else if (event.key === "ArrowDown" && direction !== "UP") direction = "DOWN";
}

function spawnFood() {
  return {
    x: Math.floor(Math.random() * (canvas.width / box)) * box,
    y: Math.floor(Math.random() * (canvas.height / box)) * box
  };
}

function drawSnakePart(x, y, isHead = false) {
  ctx.fillStyle = isHead ? "#00e676" : "#69f0ae";
  ctx.beginPath();
  ctx.arc(x + box / 2, y + box / 2, box / 2.2, 0, 2 * Math.PI);
  ctx.fill();
  ctx.closePath();
}

function drawFood(x, y) {
  // Draw apple body
  ctx.beginPath();
  ctx.arc(x + box / 2, y + box / 2, box / 2.5, 0, 2 * Math.PI);
  ctx.fillStyle = "#ff3d00";
  ctx.fill();
  ctx.closePath();

  // Leaf
  ctx.beginPath();
  ctx.ellipse(x + box / 2, y + box / 2 - 10, 5, 8, Math.PI / 4, 0, 2 * Math.PI);
  ctx.fillStyle = "#76ff03";
  ctx.fill();
  ctx.closePath();
}

function draw() {
  ctx.fillStyle = "#0d0d17";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw snake
  for (let i = 0; i < snake.length; i++) {
    drawSnakePart(snake[i].x, snake[i].y, i === 0);
  }

  // Draw food
  drawFood(food.x, food.y);

  // Snake movement
  let snakeX = snake[0].x;
  let snakeY = snake[0].y;

  if (direction === "LEFT") snakeX -= box;
  if (direction === "UP") snakeY -= box;
  if (direction === "RIGHT") snakeX += box;
  if (direction === "DOWN") snakeY += box;

  // Eat food
  if (snakeX === food.x && snakeY === food.y) {
    score++;
    scoreDisplay.innerText = score;
    food = spawnFood();
    eatSound.currentTime = 0;
    eatSound.play();

    if (score % 5 === 0) {
      clearInterval(game);
      game = setInterval(draw, Math.max(60, 120 - score * 2));
    }
  } else {
    snake.pop();
  }

  let newHead = { x: snakeX, y: snakeY };

  // Game over
  if (
  snakeX < 0 || snakeY < 0 ||
  snakeX >= canvas.width || snakeY >= canvas.height ||
  collision(newHead, snake)
) {
  clearInterval(game);
  gameOverSound.currentTime = 0;
  gameOverSound.play();
  overlay.style.display = "flex"; 
  return;
}


  snake.unshift(newHead);
}

function collision(head, array) {
  return array.some(seg => seg.x === head.x && seg.y === head.y);
}

function restartGame() {
  clearInterval(game); 

  snake = [{ x: 9 * box, y: 10 * box }];
  direction = null;
  score = 0;
  scoreDisplay.innerText = "0";
  overlay.style.display = "none"; 
  food = spawnFood();

  // Restart loop
  game = setInterval(draw, 120);
}


restartGame();
