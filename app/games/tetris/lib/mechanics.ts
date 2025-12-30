import type { Active, Cell, GameState } from "./types";
import { H, W } from "./constants";
import { PIECES } from "./pieces";

export function getBlocks(a: Active) {
  return PIECES[a.t].blocks[a.rot % 4].map(([dx, dy]) => [a.x + dx, a.y + dy] as const);
}

export function collides(a: Active, board: Cell[][]) {
  for (const [x, y] of getBlocks(a)) {
    if (x < 0 || x >= W || y >= H) return true;
    if (y >= 0 && board[y][x] !== 0) return true;
  }
  return false;
}

export function tryMove(s: GameState, dx: number) {
  const a2 = { ...s.active, x: s.active.x + dx };
  if (!collides(a2, s.board)) s.active = a2;
}

export function tryRotate(s: GameState, dir: 1 | -1) {
  const r2 = (s.active.rot + (dir === 1 ? 1 : 3)) % 4;
  const tries = [0, -1, 1, -2, 2]; // wall-kick
  for (const k of tries) {
    const a2 = { ...s.active, rot: r2, x: s.active.x + k };
    if (!collides(a2, s.board)) {
      s.active = a2;
      return;
    }
  }
}

function lockToBoard(s: GameState) {
  for (const [x, y] of getBlocks(s.active)) {
    if (y >= 0) s.board[y][x] = s.active.t;
  }
}

function clearFullLines(s: GameState) {
  let cleared = 0;
  for (let y = H - 1; y >= 0; y--) {
    if (s.board[y].every((c) => c !== 0)) {
      s.board.splice(y, 1);
      s.board.unshift(Array.from({ length: W }, () => 0 as Cell));
      cleared++;
      y++;
    }
  }
  return cleared;
}

function spawnNext(s: GameState) {
  const t = s.next;
  s.next = (Math.floor(Math.random() * 7) + 1) as Exclude<Cell, 0>;
  s.active = { t, rot: 0, x: 4, y: -1 };
  return collides(s.active, s.board); // true => gameover
}

export function stepDownOnce(
  s: GameState,
  hard: boolean
): { cleared: number; gameover: boolean; scoreDelta: number } {
  if (hard) {
    // hard drop: move down until collision, +2 per row
    let scoreDelta = 0;
    let a = s.active;
    while (true) {
      const a2 = { ...a, y: a.y + 1 };
      if (collides(a2, s.board)) break;
      a = a2;
      scoreDelta += 2;
    }
    s.active = a;

    lockToBoard(s);
    const cleared = clearFullLines(s);
    const gameover = spawnNext(s);
    return { cleared, gameover, scoreDelta };
  }

  // single step down
  const a2 = { ...s.active, y: s.active.y + 1 };
  if (!collides(a2, s.board)) {
    s.active = a2;
    const scoreDelta = s.soft ? 1 : 0;
    return { cleared: 0, gameover: false, scoreDelta };
  }

  // collision => lock, clear, spawn
  lockToBoard(s);
  const cleared = clearFullLines(s);
  const gameover = spawnNext(s);
  return { cleared, gameover, scoreDelta: 0 };
}
