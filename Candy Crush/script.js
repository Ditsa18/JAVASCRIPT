const board = document.getElementById("board");
const scoreDisplay = document.getElementById("score");
const movesDisplay = document.getElementById("moves");
const gameOverBox = document.getElementById("game-over");

const width = 8;
const size = width * width;
let squares = [];
let score = 0;
let moves = 20; 
let gameEnded = false;

const candies = [
  "images/candy1.png",
  "images/candy2.png",
  "images/candy3.png",
  "images/candy4.png",
  "images/candy5.png",
  "images/candy6.png",
];
const ROW_CLEAR = "images/row-clear.png";
const COLOR_BOMB = "images/color-bomb.png";
const EMPTY = "images/empty.png";

const fname = (src) => (src ? src.split("/").pop() : "");
const isCandy = (src) =>
  src &&
  !src.includes("row-clear") &&
  !src.includes("color-bomb") &&
  !src.includes("empty.png");

// Board setup
function randomCandy() {
  return candies[Math.floor(Math.random() * candies.length)];
}
function createCell(i, src) {
  const img = document.createElement("img");
  img.draggable = true;
  img.id = i;
  img.src = src;
  board.appendChild(img);
  squares[i] = img;
}
function createBoard() {
  for (let i = 0; i < size; i++) createCell(i, randomCandy());
  while (findAllMatches().size > 0) {
    findAllMatches().forEach((idx) => (squares[idx].src = randomCandy()));
  }
  attachDragEvents();
  updateMoves();
}
createBoard();

// Drag
let dragId = null,
  dropId = null,
  dragSrc = null,
  dropSrc = null;

function attachDragEvents() {
  squares.forEach((sq) => {
    sq.addEventListener("dragstart", onDragStart);
    sq.addEventListener("dragover", (e) => e.preventDefault());
    sq.addEventListener("drop", onDrop);
    sq.addEventListener("dragend", onDragEnd);
  });
}
function onDragStart() {
  if (!gameEnded) {
    dragId = +this.id;
    dragSrc = this.src;
  }
}
function onDrop() {
  if (!gameEnded) {
    dropId = +this.id;
    dropSrc = this.src;
    swapImgs(dragId, dropId);
  }
}
function onDragEnd() {
  if (gameEnded || dropId === null) {
    resetDrag();
    return;
  }
  const validNeighbors = [
    dragId - 1,
    dragId + 1,
    dragId - width,
    dragId + width,
  ];
  if (!validNeighbors.includes(dropId)) {
    swapImgs(dragId, dropId);
    resetDrag();
    return;
  }

  const dragIsRow = squares[dragId].src.includes("row-clear");
  const dropIsRow = squares[dropId].src.includes("row-clear");
  const dragIsBomb = squares[dragId].src.includes("color-bomb");
  const dropIsBomb = squares[dropId].src.includes("color-bomb");

  let activated = false;
  if (dragIsRow || dropIsRow) {
    clearRow(dragIsRow ? dragId : dropId);
    activated = true;
  } else if (dragIsBomb || dropIsBomb) {
    const targetSrc = dragIsBomb ? squares[dropId].src : squares[dragId].src;
    if (isCandy(targetSrc)) clearAllOfType(fname(targetSrc));
    else clearAllCandies();
    activated = true;
  }

  if (activated || testSwapMakesMatch()) {
    resolveBoard();
    decreaseMoves(); 
  } else {
    swapImgs(dragId, dropId);
  }
  resetDrag();
}
function resetDrag() {
  dragId = dropId = null;
  dragSrc = dropSrc = null;
}
function swapImgs(a, b) {
  const t = squares[a].src;
  squares[a].src = squares[b].src;
  squares[b].src = t;
}

// Match detection
function findAllMatches() {
  const matched = new Set();

  for (let r = 0; r < width; r++) {
    let runStart = r * width,
      c = 0;
    while (c < width) {
      const i = runStart + c,
        base = squares[i].src;
      if (!isCandy(base)) {
        c++;
        continue;
      }
      let len = 1;
      while (
        c + len < width &&
        squares[runStart + c + len].src === base
      )
        len++;
      if (len >= 3)
        for (let k = 0; k < len; k++) matched.add(runStart + c + k);
      c += len;
    }
  }

  for (let col = 0; col < width; col++) {
    let r = 0;
    while (r < width) {
      const i = r * width + col,
        base = squares[i].src;
      if (!isCandy(base)) {
        r++;
        continue;
      }
      let len = 1;
      while (
        r + len < width &&
        squares[(r + len) * width + col].src === base
      )
        len++;
      if (len >= 3)
        for (let k = 0; k < len; k++)
          matched.add((r + k) * width + col);
      r += len;
    }
  }
  return matched;
}
function testSwapMakesMatch() {
  return findAllMatches().size > 0;
}

//Booster actions
function clearRow(index) {
  const rowStart = Math.floor(index / width) * width;
  for (let i = 0; i < width; i++) squares[rowStart + i].src = EMPTY;
  score += 200;
  updateScore();
}
function clearAllOfType(name) {
  for (let i = 0; i < size; i++)
    if (fname(squares[i].src) === name) squares[i].src = EMPTY;
  score += 500;
  updateScore();
}
function clearAllCandies() {
  for (let i = 0; i < size; i++)
    if (isCandy(squares[i].src)) squares[i].src = EMPTY;
  score += 800;
  updateScore();
}

// Resolve loop 
function resolveBoard() {
  let loopGuard = 0;
  while (loopGuard++ < 50) {
    const groups = findGroupedMatches();
    if (groups.length === 0) break;
    groups.forEach((g) => {
      if (g.indices.length >= 5) {
        squares[g.indices[0]].src = COLOR_BOMB;
        g.indices.slice(1).forEach((i) => (squares[i].src = EMPTY));
        score += 100;
      } else if (g.indices.length === 4) {
        squares[g.indices[0]].src = ROW_CLEAR;
        g.indices.slice(1).forEach((i) => (squares[i].src = EMPTY));
        score += 60;
      } else {
        g.indices.forEach((i) => (squares[i].src = EMPTY));
        score += 30;
      }
    });
    updateScore();
    dropCandies();
    refillTop();
  }
}
function findGroupedMatches() {
  const seen = new Set(),
    groups = [];

  for (let r = 0; r < width; r++) {
    let c = 0;
    while (c < width) {
      const i = r * width + c,
        base = squares[i].src;
      if (!isCandy(base)) {
        c++;
        continue;
      }
      let len = 1;
      while (
        c + len < width &&
        squares[r * width + c + len].src === base
      )
        len++;
      if (len >= 3) {
        const indices = [];
        for (let k = 0; k < len; k++) {
          const idx = r * width + c + k;
          if (!seen.has(idx)) {
            seen.add(idx);
            indices.push(idx);
          }
        }
        if (indices.length >= 3) groups.push({ indices });
      }
      c += len;
    }
  }

  for (let col = 0; col < width; col++) {
    let r = 0;
    while (r < width) {
      const i = r * width + col,
        base = squares[i].src;
      if (!isCandy(base)) {
        r++;
        continue;
      }
      let len = 1;
      while (
        r + len < width &&
        squares[(r + len) * width + col].src === base
      )
        len++;
      if (len >= 3) {
        const indices = [];
        for (let k = 0; k < len; k++) {
          const idx = (r + k) * width + col;
          if (!seen.has(idx)) {
            seen.add(idx);
            indices.push(idx);
          }
        }
        if (indices.length >= 3) groups.push({ indices });
      }
      r += len;
    }
  }
  return groups;
}

// Refill
function dropCandies() {
  for (let r = width - 2; r >= 0; r--) {
    for (let c = 0; c < width; c++) {
      const i = r * width + c;
      if (squares[i].src === EMPTY) continue;
      let rr = r;
      while (rr + 1 < width) {
        const below = (rr + 1) * width + c;
        if (squares[below].src !== EMPTY) break;
        squares[below].src = squares[rr * width + c].src;
        squares[rr * width + c].src = EMPTY;
        rr++;
      }
    }
  }
}

function refillTop() {
  for (let c = 0; c < width; c++) {         
    for (let r = 0; r < width; r++) {        
      const i = r * width + c;
      if (squares[i].src.includes("empty.png")) {  
        squares[i].src = randomCandy();      
      }
    }
  }
}


function updateScore() {
  scoreDisplay.textContent = score;
  function checkWin() {
  if (score >= 1000) {
    document.getElementById("winScore").textContent = score;
    document.getElementById("winPopup").style.display = "flex";
  }
}

}
function updateMoves() {
  movesDisplay.textContent = moves;
}

function decreaseMoves() {
  moves--;
  updateMoves();
  if (moves <= 0) {
  gameOver();
}

  }

function endGame() {
  gameEnded = true;
  document.getElementById("final-score").textContent = score;
  document.getElementById("game-over").classList.add("show");
}

function gameOver() {
  document.getElementById("finalScore").textContent = score;
  document.getElementById("gameOverPopup").style.display = "flex"; 
}


function restartGame() {
  score = 0;
  moves = 20; 
  scoreDisplay.textContent = score;
  movesDisplay.textContent = moves;

  squares.forEach((square, i) => {
    square.src = randomCandy();
  });

  document.getElementById("gameOverPopup").style.display = "none";
}
