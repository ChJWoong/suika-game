// Example: Creating a game container dynamically
const game = document.getElementById("game");
const parent = document.getElementById("game-container");
const explosionCanvas = document.getElementById("explosionCanvas");
const explosionCtx = explosionCanvas.getContext("2d");

// 오디오파일
const backgroundAudio = document.getElementById("background-audio");
const effectAudio = document.getElementById("effect-audio");

// Function to start background music
function startBackgroundMusic() {
  backgroundAudio.play().catch((error) => {
    console.error("Failed to play background audio:", error);
  });
}

function playEffectSound() {
  const newEffectAudio = effectAudio.cloneNode();
  newEffectAudio.currentTime = 0.35;
  newEffectAudio.play().catch((error) => {
    console.error("Failed to play effect audio:", error);
  });
}

// Event listener for user interaction
document.addEventListener("click", startBackgroundMusic, { once: true });
document.addEventListener("keydown", startBackgroundMusic, { once: true });

// module aliases
var Engine = Matter.Engine,
  Render = Matter.Render,
  Runner = Matter.Runner,
  Bodies = Matter.Bodies,
  Composite = Matter.Composite,
  World = Matter.World,
  Body = Matter.Body,
  Events = Matter.Events;

// create an engine
var engine = Engine.create({
  timing: {
    timeScale: 1,
  },
});

// create a renderer
var render = Render.create({
  element: game,
  engine: engine,
  options: {
    wireframes: false,
    background: "#F7F4C8",
    width: 480,
    height: 720,
  },
});

// create runner
var runner = Runner.create({
  isFixed: true,
});

const world = engine.world;

const leftWall = Bodies.rectangle(0, 395, 30, 790, {
  isStatic: true,
  render: { fillStyle: "#E6B143" },
});

const rightWall = Bodies.rectangle(480, 395, 30, 790, {
  isStatic: true,
  render: { fillStyle: "#E6B143" },
});

const ground = Bodies.rectangle(310, 720, 620, 60, {
  name: "ground",
  isStatic: true,
  render: { fillStyle: "#E6B143" },
});

const topLine = Bodies.rectangle(310, 120, 620, 2, {
  name: "Top Line",
  isStatic: true,
  isSensor: true,
  render: { fillStyle: "#E6B143" },
});

Composite.add(world, [leftWall, rightWall, ground, topLine]);

let currentBody = null;
let currentFruit = null;
let disable = false;
let interval = null;
let numSuika = 0;
let isTouching = false;
let isCollisionInProgress = false;
let score = 0;

let start_time;
let end_time;

const FRUITS = [
  {
    name: "images/00_cherry",
    color: "#812F2F",
    radius: 33 / 2,
  },
  {
    name: "images/01_strawberry",
    color: "#FD0000",
    radius: 48 / 2,
  },
  {
    name: "images/02_grape",
    color: "#8204FF",
    radius: 61 / 2,
  },
  {
    name: "images/03_gyool",
    color: "#FFBF28",
    radius: 69 / 2,
  },
  {
    name: "images/04_orange",
    color: "#FFA228",
    radius: 89 / 2,
  },
  {
    name: "images/05_apple",
    color: "#FF7B4A",
    radius: 114 / 2,
  },
  {
    name: "images/06_pear",
    color: "#FDFFB3",
    radius: 129 / 2,
  },
  {
    name: "images/07_peach",
    color: "#FFB3E1",
    radius: 156 / 2,
  },
  {
    name: "images/08_pineapple",
    color: "#94FF89",
    radius: 177 / 2,
  },
  {
    name: "images/09_melon",
    color: "#1AFF00",
    radius: 220 / 2,
  },
  {
    name: "images/10_watermelon",
    color: "#0066FF",
    radius: 259 / 2,
  },
];

function addFruit() {
  if (currentBody != null) {
    return;
  }
  const randomAngle = Math.random() * 2 * Math.PI;

  let index = Math.floor(Math.random() * 5);
  const fruit = FRUITS[index];

  const body = Bodies.circle(240, 50, fruit.radius, {
    name: "fruit",
    index: index,
    isSleeping: true,
    //  texture: `${fruit.name}.png`,
    render: {
      //fillStyle: fruit.color,
      sprite: { texture: `${fruit.name}.png`, xScale: 1, yScale: 1 },
    },
    restitution: 0.2,
    friction: 2,
    frictionAir: 0.01,
    angle: randomAngle,
  });

  currentBody = body;
  currentFruit = fruit;
  Body.setMass(body, fruit.radius);
  Composite.add(world, body);
}

window.onkeydown = function (event) {
  if (!disable && currentBody != null && fps >= 60) {
    switch (event.code) {
      case "KeyA":
        if (interval) {
          return;
        }

        interval = setInterval(function () {
          if (currentBody.position.x - currentFruit.radius > 20) {
            Body.setPosition(currentBody, { x: currentBody.position.x - 10, y: currentBody.position.y });
          }
        }, 20);
        break;

      case "KeyD":
        if (interval) {
          return;
        }

        interval = setInterval(function () {
          if (currentBody.position.x + currentFruit.radius < 460) {
            Body.setPosition(currentBody, { x: currentBody.position.x + 10, y: currentBody.position.y });
          }
        }, 20);

        break;

      case "KeyS":
        disable = true;
        currentBody.isSleeping = false;
        clearInterval(interval);
        interval = null;
        start_time = new Date().getTime();
        break;
    }
  }
};

window.onkeyup = function (event) {
  switch (event.code) {
    case "KeyA":
    case "KeyD":
      clearInterval(interval);
      interval = null;
  }
};

window.ontouchstart = function (event) {
  if (!disable && !isTouching && currentBody != null) {
    let touch = event.touches[0];
    let touchX = touch.clientX / parent.style.zoom;
    isTouching = true;
    if (touchX - currentFruit.radius > 15 && touchX + currentFruit.radius < 465) {
      Body.setPosition(currentBody, { x: touchX, y: currentBody.position.y });
    }
  } else {
    event.preventDefault();
    return;
  }
};

window.ontouchmove = function (event) {
  if (!disable && currentBody != null) {
    let touch = event.touches[0];

    let touchX = touch.clientX / parent.style.zoom;

    if (touchX - currentFruit.radius > 15 && touchX + currentFruit.radius < 465) {
      if (isMobile) {
        Body.setPosition(currentBody, { x: touchX, y: currentBody.position.y });
      } else {
        Body.setPosition(currentBody, { x: touchX, y: currentBody.position.y });
      }
    }
  }
};

window.ontouchend = function (event) {
  if (!disable && isTouching && currentBody != null && fps >= 60) {
    disable = true;
    currentBody.isSleeping = false;
    start_time = new Date().getTime();
  }
};

let collisionQueue = [];

//충돌 큐의 데이터들이 유효한지 검사
function filterCollisionQueue() {
  collisionQueue = collisionQueue.filter((collision) => {
    const bodyAExists = Composite.get(world, collision.bodyA.id, "body") !== null;
    const bodyBExists = Composite.get(world, collision.bodyB.id, "body") !== null;
    return bodyAExists && bodyBExists;
  });
}

//충돌 큐 처리
function processCollisions() {
  if (collisionQueue.length === 0) {
    return;
  }

  const collision = collisionQueue.shift();

  const bodyA = collision.bodyA;
  const bodyB = collision.bodyB;
  const index = bodyA.index;
  const randomAngle = Math.random() * 2 * Math.PI;

  if (index === FRUITS.length - 1) {
    return;
  }
  //효과음 재생
  playEffectSound();

  drawExplosion(collision.collision.supports[0].x, collision.collision.supports[0].y);

  World.remove(world, [bodyA, bodyB]);
  score += (index + 1) * 2;

  const newFruit = FRUITS[index + 1];
  const newBody = Bodies.circle(collision.collision.supports[0].x, collision.collision.supports[0].y, newFruit.radius * 1, {
    name: "fruit",
    index: index + 1,
    isSleeping: false,
    render: {
      fillStyle: newFruit.color,
      sprite: { texture: `${newFruit.name}.png`, xScale: 1, yScale: 1 },
    },
    restitution: 0.2,
    friction: 2,
    frictionAir: 0.01,
    angle: randomAngle,
  });

  Body.setMass(newBody, newFruit.radius);
  Composite.add(world, newBody);
  Body.scale(newBody, 3 / 2, 3 / 2);

  setTimeout(function () {
    Body.scale(newBody, 2 / 3, 2 / 3);
    isCollisionInProgress = false;

    // 충돌 큐를 필터링하여 유효하지 않은 충돌 제거
    filterCollisionQueue();

    // 다음 충돌을 처리
    processCollisions();
  }, 5);

  if (newBody.index === 10) {
    numSuika += 1;
    engine.timing.timeScale = 0;
    alert("수박 완성!");
    newBody = null;
  }
}

function drawExplosion(x, y) {
  const particles = [];
  const numParticles = 20;
  const colors = ["#FF6B6B", "#FF8C42", "#FFEA00", "#00D084", "#00A8FF"];

  for (let i = 0; i < numParticles; i++) {
    particles.push({
      x: x,
      y: y,
      radius: Math.random() * 5 + 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      angle: Math.random() * 2 * Math.PI,
      speed: Math.random() * 5 + 2,
      alpha: 1,
    });
  }

  function animate() {
    explosionCtx.clearRect(0, 0, explosionCanvas.width, explosionCanvas.height);

    particles.forEach((p, i) => {
      p.x += Math.cos(p.angle) * p.speed;
      p.y += Math.sin(p.angle) * p.speed;
      p.alpha -= 0.02;
      if (p.alpha <= 0) particles.splice(i, 1);

      explosionCtx.fillStyle = `rgba(${hexToRgb(p.color)}, ${p.alpha})`;
      explosionCtx.beginPath();
      explosionCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      explosionCtx.fill();
    });

    if (particles.length > 0) {
      requestAnimationFrame(animate);
    }
  }

  animate();
}

function hexToRgb(hex) {
  const bigint = parseInt(hex.replace("#", ""), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r}, ${g}, ${b}`;
}

Events.on(engine, "collisionStart", function (event) {
  // document.getElementById("asd").innerHTML = `점수 : ${score}`;
  if (isCollisionInProgress) {
    return;
  }

  event.pairs.forEach(function (collision) {
    if (collision.bodyA.index === collision.bodyB.index) {
      collisionQueue.push(collision);

      if (!isCollisionInProgress) {
        isCollisionInProgress = true;
        processCollisions();
      }
    }

    // Top Line에 닿은 경우 처리
    if (!disable && (collision.bodyA.name === "Top Line" || collision.bodyB.name === "Top Line")) {
      const body = collision.bodyA.name === "Top Line" ? collision.bodyB : collision.bodyA;

      // 과일이 정지 상태일 때만 실패 메시지 표시
      if (body.speed < 0.01) {
        engine.timing.timeScale = 0;
        alert("실패!");
        location.reload(true);
      }
    }

    //떨어트린 과일이 땅 or 과일과 만났을때 disable 해제
    if (
      currentBody != null &&
      currentBody.isSleeping == false &&
      ((collision.bodyA.id == currentBody.id && collision.bodyB.name == "ground") ||
        (collision.bodyA.name == "ground" && collision.bodyB.id == currentBody.id) ||
        (collision.bodyA.name == "fruit" && collision.bodyB.id == currentBody.id) ||
        (collision.bodyA.id == currentBody.id && collision.bodyB.name == "fruit"))
    ) {
      end_time = new Date().getTime();
      currentBody = null;
      disable = false;

      if (end_time - start_time < 1000) {
        setInterval(function () {
          addFruit();
        }, 1000);
      } else {
        addFruit();
      }
    }
  });
});

function resize() {
  game.height = 720;
  game.width = 480;

  if (isMobile()) {
    parent.style.zoom = window.innerWidth / 480;
    parent.style.top = "0px";
  } else {
    parent.style.zoom = window.innerHeight / 720 / 1.3;
    parent.style.top = `${(game.height * parent.style.zoom) / 15}px`;
  }

  Render.setPixelRatio(render, parent.style.zoom * 2);
}

function isMobile() {
  return window.innerHeight / window.innerWidth >= 1.49;
}

function getAllObjectPositions() {
  const allBodies = Composite.allBodies(world);

  const positions = allBodies.map((body) => {
    return {
      name: body.name,
      position: { x: body.position.x, y: body.position.y },
    };
  });

  return positions;
}

const times = [];
let tempFPS = 0;

//프레임 루프
function refreshLoop() {
  window.requestAnimationFrame(() => {
    //프레임 계산
    const now = performance.now();
    while (times.length > 0 && times[0] <= now - 1000) {
      times.shift();
    }
    times.push(now);
    if (tempFPS < times.length) {
      fps = times.length;
      tempFPS = times.length;
    }

    engine.timing.timeScale = 100 / (tempFPS - 1);
    document.getElementById("asd").innerHTML = `점수 : ${score} `;

    //step

    refreshLoop();
  });
}

function loop() {
  setTimeout(function () {
    // console.log(getAllObjectPositions());
    loop();
  }, 1000);
}

const imagePaths = [];

function preloadImages(imagePaths, callback) {
  let loadedImages = 0;

  function loadImage(path) {
    const img = new Image();

    img.onload = img.onerror = function () {
      loadedImages++;

      if (loadedImages === imagePaths.length) {
        // 모든 이미지가 로드되면 콜백 함수 호출
        if (typeof callback === "function") {
          callback();
        }
      }
    };

    img.src = path;
  }

  for (const path of imagePaths) {
    loadImage(path);
  }
  console.log("모든 이미지가 성공적으로 로드되었습니다.");
}

function handleVisibilityChange() {
  if (document.visibilityState === "visible") {
    // 화면이 활성화 상태로 변경될 때 수행할 로직

    console.log("화면이 활성화되었습니다. ");

    preloadImages(imagePaths);
  } else {
    // 화면이 비활성화 상태로 변경될 때 수행할 로직
    console.log("화면이 비활성화되었습니다.");
  }
}

function main() {
  for (let Fruit of FRUITS) {
    imagePaths.push(`${Fruit.name}.png`);
  }
  preloadImages(imagePaths);
  // run the renderer
  Render.run(render);

  // run the engine
  Runner.run(runner, engine);

  resize();
  refreshLoop();
  window.addEventListener("resize", resize);
  //화면 활성화 비활성화 감지 & 이미지 다시 로드
  document.addEventListener("visibilitychange", handleVisibilityChange);

  addFruit();
  // loop();
}

main();
