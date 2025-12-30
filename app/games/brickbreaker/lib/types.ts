export type Mode = "idle" | "running" | "paused" | "gameover" | "win";

export type Brick = {
  x: number;
  y: number;
  w: number;
  h: number;
  alive: boolean;
};

export type LevelDef = {
  rows: number;
  cols: number;
  brickW: number;
  brickH: number;
  gap: number;
  top: number;
};

export type ScaledLevel = {
  rows: number;
  cols: number;
  brickW: number;
  brickH: number;
  gap: number;
  top: number;
  startX: number;
  totalW: number;
  scale: number;
};

export type GameState = {
  left: boolean;
  right: boolean;

  px: number;
  pw: number;
  ph: number;

  bx: number;
  by: number;
  br: number;
  vx: number;
  vy: number;
  served: boolean;
  serveLock: boolean;

  level: number;
  lives: number;
  bricks: Brick[];
};
