import type { Cell, GameState } from "./types";
import { H, W } from "./constants";

export function makeBoard(): Cell[][] {
  return Array.from({ length: H }, () => Array.from({ length: W }, () => 0 as Cell));
}

export function randPiece(): Exclude<Cell, 0> {
  return (Math.floor(Math.random() * 7) + 1) as Exclude<Cell, 0>;
}

export function initGameState(): GameState {
  return {
    board: makeBoard(),
    active: { t: randPiece(), rot: 0, x: 4, y: -1 },
    next: randPiece(),
    dropAcc: 0,
    soft: false,
    grid: makeBoard(),
  };
}
