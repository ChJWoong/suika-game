// Example: Creating a game container dynamically
const game = document.getElementById("game");
const parent = document.getElementById("game-container");

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
  isStatic: true,
  render: { fillStyle: "#E6B143" },
});

const topLine = Bodies.rectangle(310, 150, 620, 2, {
  name: "Top Line",
  isStatic: true,
  isSensor: true,
  render: { fillStyle: "#E6B143" },
});

World.add(world, [leftWall, rightWall, ground, topLine]);

let currentBody = null;
let currentFruit = null;
let disable = false;
let interval = null;
let numSuika = 0;
let isTouching = false;
let isCollisionInProgress = false;
let score = 0;

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
  let index = Math.floor(Math.random() * 5);
  const fruit = FRUITS[index];

  const body = Bodies.circle(240, 50, fruit.radius, {
    index: index,
    isSleeping: true,
    //  texture: `${fruit.name}.png`,
    render: {
      //fillStyle: fruit.color,
      sprite: { texture: `${fruit.name}.png`, xScale: 1, yScale: 1 },
    },
    restitution: 0.3,
    friction: 10,
    angle: -1,
  });

  currentBody = body;
  currentFruit = fruit;
  Body.setMass(body, fruit.radius * 2);
  World.add(world, body);
}

window.onkeydown = function (event) {
  if (!disable) {
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
        setTimeout(function () {
          addFruit();
          disable = false;
        }, 500);
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
  if (!disable && !isTouching) {
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
  if (!disable) {
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
  if (!disable && isTouching) {
    disable = true;
    currentBody.isSleeping = false;
    setTimeout(function () {
      addFruit();
      disable = false;
    }, 500);
  }
};

Events.on(engine, "collisionStart", function (event) {
  // document.getElementById("asd").innerHTML = `점수 : ${score}`;
  if (isCollisionInProgress) {
    return;
  }

  event.pairs.forEach(function (collision) {
    if (collision.bodyA.index === collision.bodyB.index) {
      isCollisionInProgress = true;

      const index = collision.bodyA.index;

      if (index === FRUITS.length - 1) {
        return;
      }

      World.remove(world, [collision.bodyA, collision.bodyB]);
      score += (index + 1) * 2;

      const newFruit = FRUITS[index + 1];

      const newBody = Bodies.circle(collision.collision.supports[0].x, collision.collision.supports[0].y, newFruit.radius * 1, {
        index: index + 1,
        isSleeping: false,
        render: {
          fillStyle: newFruit.color,
          sprite: { texture: `${newFruit.name}.png`, xScale: 1, yScale: 1 },
        },
        restitution: 0.3,
        friction: 10,
      });
      Body.setMass(newBody, newFruit.radius * 2);
      World.add(world, newBody);
      Body.scale(newBody, 3 / 2, 3 / 2);
      setTimeout(function () {
        Body.scale(newBody, 2 / 3, 2 / 3);
        isCollisionInProgress = false;
      }, 1);

      if (newBody.index == 10) {
        numSuika += 1;
        alert("수박 완성!");
        newBody = null;
      }
    }

    if (!disable && (collision.bodyA.name === "Top Line" || collision.bodyB.name === "Top Line")) {
      alert("실패!");
      location.reload(true);
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

const times = [];
let targetFPS = 60;

//프레임 루프
function refreshLoop() {
  window.requestAnimationFrame(() => {
    //프레임 계산
    const now = performance.now();
    while (times.length > 0 && times[0] <= now - 1000) {
      times.shift();
    }
    times.push(now);
    fps = times.length;
    if (fps > 50) {
      engine.timing.timeScale = 100 / fps;
    } else {
      engine.timing.timeScale = 1;
    }
    document.getElementById("asd").innerHTML = `점수 : ${score} `;

    //step

    refreshLoop();
  });
}

function loop() {
  setTimeout(function () {
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

    console.log("화면이 활성화되었습니다. v(다시 로드 없음)");

    // preloadImages(imagePaths);
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
  //화면 활성화 비활성화 감지
  // document.addEventListener("visibilitychange", handleVisibilityChange);

  addFruit();
  loop();
}

main();
