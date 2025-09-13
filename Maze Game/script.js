const canvas = document.getElementById("maze");
const ctx = canvas.getContext("2d");

let rows = 15;
let cols = 15;
let cellSize; // ✅ dynamically calculated

let grid = [];
let player = { row: 0, col: 0 };
let exit = { row: rows - 1, col: cols - 1 };
let timer = 60;
let score = 0;
let level = 1;
let gameOver = false;
let gameStarted = false;
let timerInterval = null;

// DOM
const timerEl = document.getElementById("timer");
const scoreEl = document.getElementById("score");
const levelEl = document.getElementById("level");
const messageEl = document.getElementById("message");
const popup = document.getElementById("popup");
const finalScoreEl = document.getElementById("final-score");
const restartBtn = document.getElementById("restart");
const startBtn = document.getElementById("start-btn");
const startControls = document.getElementById("startControls");

// Cell class
class Cell {
  constructor(row, col) {
    this.row = row;
    this.col = col;
    this.visited = false;
    this.walls = { top: true, right: true, bottom: true, left: true };
  }

  draw() {
    const size = canvas.width / cols; // ✅ recalc each draw
    const x = this.col * size;
    const y = this.row * size;

    ctx.strokeStyle = "#0ff";
    ctx.lineWidth = 2;
    ctx.shadowColor = "#0ff";
    ctx.shadowBlur = 10;

    if (this.walls.top) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + size, y);
      ctx.stroke();
    }
    if (this.walls.right) {
      ctx.beginPath();
      ctx.moveTo(x + size, y);
      ctx.lineTo(x + size, y + size);
      ctx.stroke();
    }
    if (this.walls.bottom) {
      ctx.beginPath();
      ctx.moveTo(x + size, y + size);
      ctx.lineTo(x, y + size);
      ctx.stroke();
    }
    if (this.walls.left) {
      ctx.beginPath();
      ctx.moveTo(x, y + size);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  }
}

// Build maze grid
function initGrid() {
  grid = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      grid.push(new Cell(r, c));
    }
  }
}

function index(row, col) {
  if (row < 0 || col < 0 || row >= rows || col >= cols) return -1;
  return row * cols + col;
}

function getNeighbors(cell) {
  const { row, col } = cell;
  const neighbors = [];
  const dirs = [
    { r: -1, c: 0, wall: "top", opp: "bottom" },
    { r: 1, c: 0, wall: "bottom", opp: "top" },
    { r: 0, c: -1, wall: "left", opp: "right" },
    { r: 0, c: 1, wall: "right", opp: "left" }
  ];
  for (let d of dirs) {
    const n = grid[index(row + d.r, col + d.c)];
    if (n && !n.visited) {
      neighbors.push({ cell: n, wall: d.wall, opp: d.opp });
    }
  }
  return neighbors;
}

function generateMaze() {
  initGrid();
  const stack = [];
  let current = grid[0];
  current.visited = true;

  while (true) {
    const neighbors = getNeighbors(current);
    if (neighbors.length > 0) {
      const { cell: next, wall, opp } =
        neighbors[Math.floor(Math.random() * neighbors.length)];
      current.walls[wall] = false;
      next.walls[opp] = false;
      stack.push(current);
      next.visited = true;
      current = next;
    } else if (stack.length > 0) {
      current = stack.pop();
    } else break;
  }
}

// Draw maze
function drawMaze() {
  cellSize = canvas.width / cols; // ✅ update for current level
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let cell of grid) {
    cell.draw();
  }
  drawExit();
  drawPlayer();
}

// Player
function drawPlayer() {
  const size = canvas.width / cols;
  ctx.fillStyle = "#0ff";
  ctx.shadowColor = "#0ff";
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.arc(
    player.col * size + size / 2,
    player.row * size + size / 2,
    size / 3,
    0,
    Math.PI * 2
  );
  ctx.fill();
}

// Exit
function drawExit() {
  const size = canvas.width / cols;
  ctx.fillStyle = "#0f0";
  ctx.shadowColor = "#0f0";
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.arc(
    exit.col * size + size / 2,
    exit.row * size + size / 2,
    size / 3,
    0,
    Math.PI * 2
  );
  ctx.fill();
}

// Movement
document.addEventListener("keydown", (e) => {
  if (!gameStarted || gameOver) return;
  const key = e.key.toLowerCase();
  let moved = false;
  const current = grid[index(player.row, player.col)];

  if ((key === "arrowup" || key === "w") && !current.walls.top) {
    player.row--;
    moved = true;
  }
  if ((key === "arrowdown" || key === "s") && !current.walls.bottom) {
    player.row++;
    moved = true;
  }
  if ((key === "arrowleft" || key === "a") && !current.walls.left) {
    player.col--;
    moved = true;
  }
  if ((key === "arrowright" || key === "d") && !current.walls.right) {
    player.col++;
    moved = true;
  }

  if (moved) {
    checkWin();
    drawMaze();
  }
});

// Win check
function checkWin() {
  if (player.row === exit.row && player.col === exit.col) {
    score += level; // ✅ score increases with level
    scoreEl.innerText = score;
    level++;
    levelEl.innerText = level;
    messageEl.innerText = `✨ Level ${level}! New maze!`;

    // Reset timer
    clearInterval(timerInterval);
    timer = 60;
    timerEl.innerText = timer;
    startTimer();

    // Increase maze size gradually
    if (rows < 25 && cols < 25) {
      rows += 2;
      cols += 2;
    }
    exit = { row: rows - 1, col: cols - 1 };

    generateMaze();
    player = { row: 0, col: 0 };
    drawMaze();
  }
}

// Timer
function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timer = 60;
  timerEl.innerText = timer;
  timerInterval = setInterval(() => {
    if (!gameStarted || gameOver) return;
    timer--;
    timerEl.innerText = timer;
    if (timer <= 0) {
      endGame();
    }
  }, 1000);
}

// Start
startBtn.addEventListener("click", () => {
  gameStarted = true;
  gameOver = false;
  score = 0;
  level = 1;
  timer = 60;
  rows = 15;
  cols = 15;
  exit = { row: rows - 1, col: cols - 1 };

  scoreEl.innerText = score;
  timerEl.innerText = timer;
  levelEl.innerText = level;
  messageEl.innerText = "Find the glowing exit!";
  startControls.style.display = "none";

  generateMaze();
  player = { row: 0, col: 0 };
  drawMaze();
  startTimer();
});

// Game Over
function endGame() {
  gameOver = true;
  finalScoreEl.innerText = score;
  popup.style.display = "flex";
}

// Restart
restartBtn.addEventListener("click", () => {
  popup.style.display = "none";
  gameStarted = false;
  score = 0;
  level = 1;
  timer = 60;
  rows = 15;
  cols = 15;
  exit = { row: rows - 1, col: cols - 1 };

  scoreEl.innerText = score;
  timerEl.innerText = timer;
  levelEl.innerText = level;
  messageEl.innerText = "Press Start to begin!";
  startControls.style.display = "block";
});
