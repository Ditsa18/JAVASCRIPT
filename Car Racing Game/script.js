// Game constants & elements
const GAME_W = 300;
const GAME_H = 600;
const LANES = [40, 120, 200]; 

const IMG_PATH = "images/"; 
const PLAYER_IMG = IMG_PATH + "player-car.png";
const ENEMY_IMAGES = [
  IMG_PATH + "car1.png",
  IMG_PATH + "car2.png",
  IMG_PATH + "car3.png",
  IMG_PATH + "car4.png",
];

const gameArea = document.getElementById("gameArea");
const scoreEl = document.getElementById("score");
const startScreen = document.getElementById("startScreen");
const btnStart = document.getElementById("btnStart");
const gameOverScreen = document.getElementById("gameOverScreen");
const btnReplay = document.getElementById("btnReplay");
const finalScoreEl = document.getElementById("finalScore");

const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");

// player state
let player = {
  lane: 1,                   
  width: 60,
  height: 100,
  dom: null,
};

let obstacles = []; 

// running state & timing
let running = false;
let lastTime = null;
let bgY = 0;
let baseSpeed = 3.5; 
let score = 0;
let scoreAccumMs = 0;

// helper - create player DOM
function createPlayer() {
  const wrap = document.createElement("div");
  wrap.className = "vehicle player";
  wrap.style.width = player.width + "px";
  wrap.style.height = player.height + "px";
  const img = document.createElement("img");
  img.src = PLAYER_IMG;
  img.alt = "player";
  wrap.appendChild(img);
  // set starting lane position
  wrap.style.left = LANES[player.lane] + "px";
  wrap.style.top = (GAME_H - player.height - 18) + "px";
  gameArea.appendChild(wrap);
  player.dom = wrap;
}

// single obstacle (initial)
function spawnObstacle(initialY) {
  const el = document.createElement("div");
  el.className = "vehicle obstacle";
  el.style.width = player.width + "px";
  el.style.height = player.height + "px";

  const img = document.createElement("img");
  img.src = ENEMY_IMAGES[Math.floor(Math.random() * ENEMY_IMAGES.length)];
  img.alt = "enemy";
  el.appendChild(img);

  const lane = Math.floor(Math.random() * LANES.length);
  const x = LANES[lane];
  const y = (typeof initialY === "number") ? initialY : ( -100 - Math.random() * 400 );

  el.style.left = x + "px";
  el.style.top = y + "px";

  const ob = {
    el,
    lane,
    x,
    y,
    width: player.width,
    height: player.height,
    baseSpeed: 0.9 + Math.random() * 1.6 
  };

  obstacles.push(ob);
  gameArea.appendChild(el);
  return ob;
}

// create initial obstacles 
function createInitialObstacles(count = 4) {
  obstacles.forEach(o => o.el.remove());
  obstacles = [];
  for (let i = 0; i < count; i++) {
    const y = - (i * 180) - 60 - Math.random() * 180;
    spawnObstacle(y);
  }
}

// lane movement
function movePlayerLeft() {
  if (!running) return;
  if (player.lane > 0) {
    player.lane--;
    player.dom.style.left = LANES[player.lane] + "px";
  }
}
function movePlayerRight() {
  if (!running) return;
  if (player.lane < LANES.length - 1) {
    player.lane++;
    player.dom.style.left = LANES[player.lane] + "px";
  }
}

// keyboard 
document.addEventListener("keydown", (e) => {
  if (!running && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
  }
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    movePlayerLeft();
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    movePlayerRight();
  }
});

// mobile controls
leftBtn?.addEventListener("touchstart", (e) => { e.preventDefault(); movePlayerLeft(); });
rightBtn?.addEventListener("touchstart", (e) => { e.preventDefault(); movePlayerRight(); });
leftBtn?.addEventListener("mousedown", (e) => { e.preventDefault(); movePlayerLeft(); });
rightBtn?.addEventListener("mousedown", (e) => { e.preventDefault(); movePlayerRight(); });

// start & restart
btnStart.addEventListener("click", startGame);
btnReplay.addEventListener("click", startGame);

function startGame() {
  // reset UI & state
  startScreen.style.display = "none";
  gameOverScreen.style.display = "none";

  // clear area
  gameArea.querySelectorAll(".vehicle").forEach(n => n.remove());
  obstacles = [];

  // reset player
  player.lane = 1;
  player.dom = null;

  createPlayer();
  createInitialObstacles(4);

  running = true;
  lastTime = null;
  bgY = 0;
  score = 0;
  scoreAccumMs = 0;
  baseSpeed = 3.5;

  scoreEl.textContent = "0";
  window.requestAnimationFrame(gameLoop);
}


function gameLoop(ts) {
  if (!running) return;
  if (!lastTime) lastTime = ts;
  const delta = ts - lastTime; 
  lastTime = ts;

  const speed = baseSpeed + Math.floor(score / 700) * 0.4;
  bgY += speed * (delta / 16);
  gameArea.style.backgroundPositionY = `${bgY}px`;


  for (let ob of obstacles) {
    ob.y += (speed + ob.baseSpeed) * (delta / 16);
    ob.el.style.top = Math.round(ob.y) + "px";

    if (ob.y > GAME_H + 40) {
      ob.y = - (120 + Math.random() * 360);
      ob.lane = Math.floor(Math.random() * LANES.length);
      ob.x = LANES[ob.lane];
      ob.el.style.left = ob.x + "px";
      const img = ob.el.querySelector("img");
      img.src = ENEMY_IMAGES[Math.floor(Math.random() * ENEMY_IMAGES.length)];
      ob.baseSpeed = 0.6 + Math.random() * 1.6;
    }
  }

  // check collisions (bounding boxes)
  const playerRect = player.dom.getBoundingClientRect();
  for (let ob of obstacles) {
    const obRect = ob.el.getBoundingClientRect();
    if (!(playerRect.right < obRect.left + 6 ||
          playerRect.left > obRect.right - 6 ||
          playerRect.bottom < obRect.top + 10 ||
          playerRect.top > obRect.bottom - 10)) {
      endGame();
      return;
    }
  }

  // score increments by time
  scoreAccumMs += delta;
  if (scoreAccumMs >= 100) {
    const inc = Math.floor(scoreAccumMs / 100);
    score += inc;
    scoreAccumMs -= inc * 100;
    scoreEl.textContent = score;
  }

  if (obstacles.length < 6 && Math.random() < 0.002 * (1 + score/2000)) {
    spawnObstacle(-120 - Math.random() * 300);
  }

  window.requestAnimationFrame(gameLoop);
}

function endGame() {
  running = false;
  finalScoreEl.textContent = score;
  gameOverScreen.style.display = "flex";
}


