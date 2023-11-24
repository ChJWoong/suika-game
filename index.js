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
var engine = Engine.create();

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
// run the renderer
Render.run(render);

// create runner
var runner = Runner.create();

//resize();

// run the engine
Runner.run(runner, engine);

let currentBody = null;
let currentFruit = null;
let disable = false;
let interval = null;
let numSuika = 0;
let isTouching = false;

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
  });

  currentBody = body;
  currentFruit = fruit;

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
    let touchX = touch.clientX;
    isTouching = true;
    if (touchX - currentFruit.radius > 20 && touchX + currentFruit.radius < 470) {
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

    let touchX = touch.clientX;
    document.getElementById("asd").innerHTML = `${touchX}, ${parent.style.zoom}, v4`;
    if (touchX - currentFruit.radius > 15 && touchX + currentFruit.radius < 465) {
      if (isMobile) {
        Body.setPosition(currentBody, { x: touchX / parent.style.zoom, y: currentBody.position.y });
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
  event.pairs.forEach(function (collision) {
    if (collision.bodyA.index === collision.bodyB.index) {
      const index = collision.bodyA.index;

      if (index === FRUITS.length - 1) {
        return;
      }

      World.remove(world, [collision.bodyA, collision.bodyB]);

      const newFruit = FRUITS[index + 1];

      const newBody = Bodies.circle(collision.collision.supports[0].x, collision.collision.supports[0].y, newFruit.radius * 1, {
        index: index + 1,
        isSleeping: false,
        render: {
          fillStyle: newFruit.color,
          sprite: { texture: `${newFruit.name}.png`, xScale: 1, yScale: 1 },
        },
        restitution: 0.3,
      });

      World.add(world, newBody);
      if (newBody.index == 10) {
        numSuika += 1;
      }
      if (numSuika == 1) {
        setTimeout(function () {
          console.log(numSuika);
          alert("수박 완성!");
        }, 500);
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

resize();
window.addEventListener("resize", resize);

addFruit();
