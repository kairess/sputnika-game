import { Engine, Render, Runner, World, Bodies, Body, Events, Composite } from 'matter-js';
import { PLANETS } from './planets';
import './style.css';

const engine = Engine.create()
const world = engine.world;

engine.gravity.scale = 0.

const render = Render.create({
  element: document.body,
  engine: engine,
  options: {
    width: 1000,
    height: 600,
    wireframes: false
  }
});

Render.run(render);
Runner.run(engine);

const clientRect = render.canvas.getBoundingClientRect();

const centerGravity = Bodies.circle(700, 300, 30, {
  isStatic: true,
  render: {
    fillStyle: 'transparent',
    strokeStyle: 'white',
    lineWidth: 3
  }
});

const gameOverCircle = Bodies.circle(700, 300, 200, {
  name: 'gameOverCircle',
  isStatic: true,
  isSensor: true,
  render: {
    fillStyle: 'transparent',
    strokeStyle: 'white',
    lineWidth: 3
  }
});

World.add(world, [centerGravity, gameOverCircle]);

let shootingPlanet;
let initialMousePosition = { x: 0, y: 0 };
let isDragging = false;
let isShooting = false;
let disableAction = false;

const createPlanet = () => {
  const index = Math.floor(Math.random() * 2);
  const planet = PLANETS[index]

  shootingPlanet = Bodies.circle(200, 300, planet.radius, {
    name: 'shootingPlanet',
    index: index,
    isStatic: true,
    render: {
      sprite: { texture: `${planet.name}.png` }
    },
  });

  World.add(world, shootingPlanet);
};

render.canvas.addEventListener('mousedown', (event) => {
  const mousePosition = {
    x: event.clientX - clientRect.left,
    y: event.clientY - clientRect.top
  };
  const distanceToPlanet = Math.sqrt((mousePosition.x - shootingPlanet.position.x) ** 2 + (mousePosition.y - shootingPlanet.position.y) ** 2);

  if (distanceToPlanet <= shootingPlanet.circleRadius) {
    isDragging = true;
    initialMousePosition.x = mousePosition.x;
    initialMousePosition.y = mousePosition.y;
  }
});

window.addEventListener('mousemove', (event) => {
  if (isDragging) {
    const newPosition = { x: event.clientX, y: event.clientY };
    Body.setPosition(shootingPlanet, {
      x: newPosition.x - clientRect.left,
      y: newPosition.y - clientRect.top
    });
  }
});

window.addEventListener('mouseup', (event) => {
  if (isDragging) {
    isShooting = true;
  } else {
    return;
  }

  if (isShooting) {
    disableAction = true;

    Body.setStatic(shootingPlanet, false);

    const releasePosition = {
      x: event.clientX - clientRect.left,
      y: event.clientY - clientRect.top
    };
    const forceMagnitude = 0.0005;
    const forceDirection = {
      x:initialMousePosition.x - releasePosition.x,
      y: initialMousePosition.y - releasePosition.y,
    };

    Body.applyForce(shootingPlanet, shootingPlanet.position, {
      x: forceDirection.x * forceMagnitude,
      y: forceDirection.y * forceMagnitude,
    });

    isDragging = false;
    isShooting = false;

    setTimeout(() => {
      disableAction = false;
      shootingPlanet.name = null;
      createPlanet();
    }, 2500);
  }
});

Events.on(engine, 'beforeUpdate', function(event) {
  const bodies = Composite.allBodies(world);

  bodies.forEach(body => {
    const dx = centerGravity.position.x - body.position.x;
    const dy = centerGravity.position.y - body.position.y;

    const distanceSquared = dx * dx + dy * dy;
    const forceMagnitude = 0.3 * body.mass / distanceSquared;

    Body.applyForce(body, body.position, { x: forceMagnitude * dx, y: forceMagnitude * dy });

    if (!disableAction && body.name != 'shootingPlanet' && body.name != 'gameOverCircle') {
      const dist = Math.sqrt((body.position.x - centerGravity.position.x) ** 2 + (body.position.y - centerGravity.position.y) ** 2);

      if (dist > gameOverCircle.circleRadius) {
        alert('Game Over');
      }
    }
  });
});

Events.on(engine, 'collisionStart', (event) => {
  event.pairs.forEach((collision) => {
    if (collision.bodyA.index === collision.bodyB.index) {
      const index = collision.bodyA.index;

      if (index === PLANETS.length - 1) {
        return;
      }

      World.remove(world, [collision.bodyA, collision.bodyB]);

      const newPlanet = PLANETS[index + 1];

      const newBody = Bodies.circle(
        collision.collision.supports[0].x,
        collision.collision.supports[0].y,
        newPlanet.radius,
        {
          index: index + 1,
          render: {
            sprite: { texture: `${newPlanet.name}.png` }
          },
        },
      );

      World.add(world, newBody);
    }
  });
});

createPlanet();
