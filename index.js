const game = document.getElementById("game");
const parent = document.getElementById("game-container");
const explosionCanvas = document.getElementById("explosionCanvas"); //화면효과용
const explosionCtx = explosionCanvas.getContext("2d"); //화면효과용
const startScreen = document.getElementById("start-screen"); //시작화면
const backgroundAudio = document.getElementById("background-audio"); //배경음
const effectAudio = document.getElementById("effect-audio"); //효과음
const muteButton = document.getElementById("mute-button"); //음소거 버튼
const keyexpl = document.getElementById("key"); //키설명
const maxAudioInstances = 10; // 최대 오디오 인스턴스 수
let audioPool = []; //오디오 클론 배열
let isMuted = false; //음소거 여부

// 오디오 요소를 미리 클론하여 준비해 두기
function setAudioClone() {
  for (let i = 0; i < maxAudioInstances; i++) {
    const newEffectAudio = effectAudio.cloneNode();

    //클론 후 초기재생 하여 미리 로드
    newEffectAudio.play().then(() => {
      newEffectAudio.pause();
    });
    audioPool.push(newEffectAudio);
  }
}

//배경음악 재생
function startBackgroundMusic() {
  backgroundAudio.play().catch((error) => {
    console.error("Failed to play background audio:", error);
  });
}

//효과음 재생
function playEffectSound() {
  //클론 배열에서 재사용 가능한 클론 찾아서 재생
  const availableAudio = audioPool.find((audio) => audio.paused || audio.ended);
  if (availableAudio) {
    availableAudio.currentTime = 0.4;
    availableAudio.play().catch((error) => {
      console.error("Failed to play effect audio:", error);
    });
  } else {
    console.warn("No available audio instances to play effect sound.");
  }
}

// 음소거 버튼 클릭 시 음소거 스위칭
muteButton.addEventListener("click", () => {
  isMuted = !isMuted;
  muteButton.innerHTML = isMuted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
  if (isMuted) {
    backgroundAudio.pause();
  } else {
    startBackgroundMusic();
  }
});

// 페이지 로드 시 제스쳐핸들러 함수 호출
window.addEventListener("load", () => {
  //오디오를 재생하기 위해 제스쳐를 입력받아야함
  document.addEventListener("touchstart", handleUserGesture, { once: true });
  document.addEventListener("keydown", handleUserGesture, { once: true });
});

//제스쳐 입력 받은 후 이벤트 리스너 제거 & 게임 시작
function handleUserGesture() {
  startGame();
  document.removeEventListener("touchstart", handleUserGesture);
  document.removeEventListener("keydown", handleUserGesture);
}

//게임 시작
function startGame() {
  startBackgroundMusic();
  setAudioClone();
  startScreen.style.display = "none"; // 시작 화면 숨기기
}

// 모듈 설정
var Engine = Matter.Engine,
  Render = Matter.Render,
  Runner = Matter.Runner,
  Bodies = Matter.Bodies,
  Composite = Matter.Composite,
  World = Matter.World,
  Body = Matter.Body,
  Events = Matter.Events;

// 엔진 설정
var engine = Engine.create({
  timing: {
    timeScale: 1,
  },
});

//렌더 설정
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

//러너 설정
var runner = Runner.create({
  isFixed: true,
});

const world = engine.world;

//과일 선언&추가
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

function setGame() {
  //게임 내의 벽 생성
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

  currentBody = null;
  currentFruit = null;
  disable = false;
  interval = null;
  numSuika = 0;
  isTouching = false;
  isCollisionInProgress = false;
  score = 0;
}

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

//과일 생성
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

//과일 움직임
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
  event.preventDefault();
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

//충돌 큐의 데이터들이 유효한지 검사(이미 합쳐져서 없어진 과일들에 대한 처리)
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

  if (bodyA.isSleeping || bodyB.isSleeping) {
    return;
  }

  const index = bodyA.index;
  const randomAngle = Math.random() * 2 * Math.PI;

  if (index === FRUITS.length - 1) {
    return;
  }
  //효과음 재생
  if (!isMuted) {
    playEffectSound();
  }

  //폭발 효과 생성
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

let explosions = [];

//폭발 생성 & 애니메이션
function drawExplosion(x, y) {
  const particles = [];
  const numParticles = 20;
  const colors = ["#FF6B6B", "#FF8C42", "#FFEA00", "#00D084", "#00A8FF"];

  for (let i = 0; i < numParticles; i++) {
    particles.push({
      x: x,
      y: y,
      radius: Math.random() * 5 + 8,
      color: colors[Math.floor(Math.random() * colors.length)],
      angle: Math.random() * 2 * Math.PI,
      speed: Math.random() * 5 + 2,
      alpha: 1,
    });
  }

  const explosion = {
    particles: particles,
    animationFrameId: null,
  };

  explosions.push(explosion);

  function animateExplosion(explosion) {
    explosionCtx.clearRect(0, 0, explosionCanvas.width, explosionCanvas.height);

    explosions.forEach((explosion, explosionIndex) => {
      explosion.particles.forEach((p, i) => {
        p.x += Math.cos(p.angle) * p.speed;
        p.y += Math.sin(p.angle) * p.speed;
        p.alpha -= 0.02;
        if (p.alpha <= 0) explosion.particles.splice(i, 1);

        explosionCtx.fillStyle = `rgba(${hexToRgb(p.color)}, ${p.alpha})`;
        explosionCtx.beginPath();
        explosionCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        explosionCtx.fill();
      });

      if (explosion.particles.length === 0) {
        explosions.splice(explosionIndex, 1);
      }
    });

    if (explosions.length > 0) {
      requestAnimationFrame(animateExplosion);
    }
  }

  if (explosions.length === 1) {
    animateExplosion();
  }

  animateExplosion(explosion);
}

function hexToRgb(hex) {
  const bigint = parseInt(hex.replace("#", ""), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r}, ${g}, ${b}`;
}

Events.on(engine, "collisionStart", function (event) {
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

//크기 화면에 맞게 조정
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

//화면 비를 통해서 모바일인지 체크
function isMobile() {
  return window.innerHeight / window.innerWidth >= 1.49;
}

//모든 객체 반환
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
    document.getElementById("score").innerHTML = `점수 : ${score} `;

    refreshLoop();
  });
}

const imagePaths = [];

//과일 이미지 미리 로드해서 딜레이 제거
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

//화면 활성화, 비활성화시 사용할 함수들
function handleVisibilityChange() {
  if (document.visibilityState === "visible") {
    // 화면이 활성화 상태로 변경될 때 수행할 로직

    //배경음 재생
    if (!isMuted) {
      backgroundAudio.play().catch((error) => {
        console.error("Failed to play background audio:", error);
      });
    }
    console.log("화면이 활성화되었습니다. ");

    preloadImages(imagePaths);
  } else {
    //배경음 중지
    backgroundAudio.pause();

    console.log("화면이 비활성화되었습니다.");
  }
}

//메인함수
function main() {
  setGame();
  for (let Fruit of FRUITS) {
    imagePaths.push(`${Fruit.name}.png`);
  }

  if (isMobile()) {
    startScreen.innerHTML = "터치 시 게임 시작";
    keyexpl.style.display = "none";
  } else {
    startScreen.innerHTML = "아무 키 입력 시 시작 ";
  }

  preloadImages(imagePaths);

  Render.run(render);
  Runner.run(runner, engine);

  resize();
  refreshLoop();
  window.addEventListener("resize", resize);
  //화면 활성화 비활성화 감지 & 이미지 다시 로드
  document.addEventListener("visibilitychange", handleVisibilityChange);

  addFruit();
}

main();
