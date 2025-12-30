export type Mode = "idle" | "running" | "paused" | "gameover";

export type Cell = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type Active = {
  t: Exclude<Cell, 0>;
  rot: number;
  x: number;
  y: number;
};

export type GameState = {
  board: Cell[][];
  active: Active;
  next: Exclude<Cell, 0>;
  dropAcc: number;
  soft: boolean;
  grid: Cell[][];
};
