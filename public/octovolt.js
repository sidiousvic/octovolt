/*
 *
 * utilities
 *
 */
const compose =
  (...fns) =>
  (x) =>
    fns.reduceRight((v, f) => f(v), x);

const debug = console.log;

/**
 * @function distance
 * @returns distance between two points
 * @math 𝑑 = √( ( 𝑥2 - 𝑥1 )² + ( 𝑦2 - 𝑦1 )² )
 */
const distance =
  ({ x, y }) =>
  ({ x: w, y: z }) =>
    Math.sqrt(Math.pow(w - x, 2) + Math.pow(z - y, 2));

const randomIntFromRange = (min) => (max) =>
  Math.floor(Math.random() * (max - min + 1) + min);

const negation = (n) => -n;

const avg = (x) => (y) => x + y / 2;

const divideByTwo = (n) => n / 2;

const collide = (a) => (b) => (f) => {
  const hitboxA = divideByTwo(a.dimension);
  const hitboxB = divideByTwo(b.dimension);
  const distanceAToB = distance(a)(b);
  distanceAToB <= hitboxA + hitboxB && f();
};

const move = (o) => ((o.x += o.velocity.x), (o.y += o.velocity.y));

const utils = {
  distance,
  randomIntFromRange,
  negation,
  avg,
  divideByTwo,
  collide,
  move,
};

/*
 *
 * objects
 *
 */
const Player = (x) => (y) => (dimension) => (sprite) => ({
  x,
  y,
  sprite,
  dimension,
  moveWithMouse({ player, mouse }) {
    player.x = mouse.x;
    player.y = mouse.y;
  },
  draw({ player, coin, score, collide, c }) {
    /**@mechanic move player with mouse*/
    player.moveWithMouse(z);

    /**@mechanic increase score when colliding with coin */
    collide(player)(coin)(() => score.up(z));

    c.draw(player);
  },
});

const Coin = (x) => (y) => (dimension) => (sprite) => ({
  x,
  y,
  sprite,
  dimension,
  respawn({ coin, randomIntFromRange }) {
    coin.x = randomIntFromRange(50)(innerWidth - 50);
    coin.y = randomIntFromRange(50)(innerHeight - 50);
  },
  draw({ coin, player, sound, enemies, collide, c }) {
    /**@mechanic play coin sound when colliding with player */
    /**@mechanic respawn coin when colliding with player */
    /**@mechanic spawn new enemy when colliding with player */
    collide(coin)(player)(() => {
      if (!sound.coin.muted) sound.coin.play();
      coin.respawn(z);
      enemies.spawn(z);
    });

    c.draw(coin);
  },
});

const Enemy =
  (x) =>
  (y) =>
  (dimension) =>
  ({ ...sprites }) =>
  (speed) => ({
    x,
    y,
    sprite: sprites.L,
    spriteR: sprites.R,
    spriteL: sprites.L,
    dimension,
    velocity: {
      x: speed,
      y: speed,
    },
    switchSprite({ enemy }) {
      if (enemy.velocity.x < 0) enemy.sprite = enemy.spriteL;
      else enemy.sprite = enemy.spriteR;
    },
    draw({ enemy, player, sound, over, collide, move, c }) {
      /**@mechanic game over when colliding with player */
      /**@mechanic play bark sound when colliding with player */
      collide(enemy)(player)(() => {
        over(z);
        if (!sound.bark.muted) sound.bark.play();
      });

      /**@mechanic move enemy */
      move(enemy);

      /**@mechanic bounce enemy off walls */
      {
        const enemyDistanceFromBottom = distance(enemy)({
          x: enemy.x,
          y: innerHeight,
        });
        const enemyDistanceFromTop = enemyDistanceFromBottom - innerHeight;
        const enemyDistanceFromRight = distance(enemy)({
          x: innerWidth,
          y: enemy.y,
        });
        const enemyDistanceFromLeft = enemyDistanceFromRight - innerWidth;

        if (enemyDistanceFromBottom <= enemy.dimension)
          enemy.velocity.y = negation(enemy.velocity.y);

        if (enemyDistanceFromTop > 0)
          enemy.velocity.y = negation(enemy.velocity.y);

        if (enemyDistanceFromLeft > 0)
          enemy.velocity.x = negation(enemy.velocity.x);

        if (enemyDistanceFromRight <= enemy.dimension)
          enemy.velocity.x = negation(enemy.velocity.x);
      }

      /**@mechanic switch sprite l <--> r */
      enemy.switchSprite(z);

      c.draw(enemy);
    },
  });

const Score = (value) => (sprite) => ({
  value,
  sprite,
  up({ score, enemy }) {
    const enemyArea = Math.pow(enemy.dimension, 2),
      windowArea = innerHeight * innerWidth,
      enemyPercentage = enemyArea / windowArea;
    score.value += enemyPercentage * 1000;
    score.sprite.innerHTML = ~~score.value;
  },
  reset({ score }) {
    score.value = 0;
  },
});

const Sound =
  ({ ...audios }) =>
  (sprite) => ({
    ...audios,
    sprite,
    mute({ sound }) {
      (sound.bark.muted = true), (sound.coin.muted = true);
    },
    unmute({ sound }) {
      (sound.bark.muted = false), (sound.coin.muted = false);
    },
  });

const Mouse = (c) => ({
  x: c.width / 2,
  y: c.width / 2,
});

/*
 *
 * engine
 *
 */
const Engine = (z) => {
  const { player, coin, enemies, c } = z;

  requestAnimationFrame(() => Engine(z));
  c.ctx.clearRect(0, 0, c.width, c.height);

  player.draw(z);
  coin.draw(z);
  enemies.map((enemy) => ((z.enemy = enemy), enemy.draw(z)));
};

const canvas = (c) => (w) => (h) => {
  c.ctx = c.getContext("2d");
  c.draw = ({ sprite, x, y, dimension }) =>
    c.ctx.drawImage(sprite, x, y, dimension, dimension);
  c.width = w;
  c.height = h;
  return c;
};

const launch = ({ canvas, Mouse, Score, Player, Coin, Enemy, Sound }) => {
  /**@mechanic initialize canvas context*/
  const canvasElement = document.querySelector("canvas");
  const c = canvas(canvasElement)(innerWidth)(innerHeight);
  const canvasSize = (c) => ((c.width = innerWidth), (c.height = innerHeight));

  /**@mechanic create mouse*/
  const mouse = Mouse(c);

  /**@mechanic create score*/
  const scoreSprite = document.getElementById("score");
  const score = Score(0)(scoreSprite);

  /**@mechanic create player*/
  const playerSprite = document.getElementById("octovolt");
  const player = Player(mouse.x)(mouse.y)(50)(playerSprite);

  /**@mechanic create coin*/
  const randomCoinX = randomIntFromRange(50)(innerWidth - 50);
  const randomCoinY = randomIntFromRange(50)(innerHeight - 50);
  const coinSprite = document.getElementById("coin");
  const coin = Coin(randomCoinX)(randomCoinY)(50)(coinSprite);

  /**@mechanic create enemies */
  const enemies = [];
  enemies.spawn = ({ enemies }) => {
    const randomEnemyX = randomIntFromRange(50)(innerWidth - 50);
    const randomEnemyY = randomIntFromRange(50)(innerHeight - 50);
    const randomSpeed = randomIntFromRange(-5)(4); // -5 -4 -3 -2 -1 0 1 2 3 4
    const randomSpeedNotZero = randomSpeed === 0 ? 5 : randomSpeed; // -5 -4 -3 -2 -1 5 1 2 3 4
    const enemySprites = {
      R: document.getElementById("enemyR"),
      L: document.getElementById("enemy"),
    };
    const spawnedEnemy =
      Enemy(randomEnemyX)(randomEnemyY)(50)(enemySprites)(randomSpeedNotZero);
    enemies.push(spawnedEnemy);
  };

  /**@mechanic create sound */
  const audios = {
    coin: new Audio("./public/audio/coin.wav"),
    bark: new Audio("./public/audio/bark.wav"),
  };
  audios.coin.volume = 0.07;
  audios.bark.volume = 1;
  const soundSprite = document.getElementById("sound");
  const sound = Sound(audios)(soundSprite);

  /**@gamestate */
  const z = {
    c,
    player,
    coin,
    enemies,
    score,
    sound,
    mouse,
    collide,
    move,
    over,
    ...utils,
  };

  /**@inits */
  sound.mute(z);
  enemies.spawn(z);

  /**@sideffects */
  addEventListener("resize", canvasSize);

  addEventListener("mousemove", ({ clientX, clientY }) => {
    mouse.x = clientX;
    mouse.y = clientY;
  });

  addEventListener("touchmove", ({ clientX, clientY }) => {
    mouse.x = clientX;
    mouse.y = clientY;
  });

  addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      document.getElementById("start-overlay")?.remove();
      if (sound.bark.muted) {
        sound.sprite.src = "./public/images/soundon.png";
        sound.unmute(z);
        sound.bark.play();
      } else {
        sound.sprite.src = "./public/images/soundoff.png";
        sound.mute(z);
      }
    }
  });

  addEventListener("click", () => {
    document.getElementById("start-overlay")?.remove();
    if (sound.bark.muted) {
      sound.sprite.src = "./public/images/soundon.png";
      sound.unmute(z);
      sound.bark.play();
    } else {
      sound.sprite.src = "./public/images/soundoff.png";
      sound.mute(z);
    }
  });

  addEventListener("touchstart", () => {
    document.getElementById("start-overlay")?.remove();
    if (sound.bark.muted) {
      sound.sprite.src = "./public/images/soundon.png";
      sound.unmute(z);
      sound.bark.play();
    } else {
      sound.sprite.src = "./public/images/soundoff.png";
      sound.mute(z);
    }
  });

  return z;
};

const over = (z) => {
  const { coin, score, enemies } = z;
  coin.respawn(z);
  score.reset(z);
  enemies.length = 0;
};

const z = launch({
  canvas,
  Mouse,
  Score,
  Player,
  Coin,
  Enemy,
  Sound,
  ...utils,
});

Engine(z);
