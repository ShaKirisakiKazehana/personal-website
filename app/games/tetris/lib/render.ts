import type { GameState, Cell, Mode } from "./types";
import { W, H, CELL, COLORS } from "./constants";
import { PIECES } from "./pieces";
import { collides, getBlocks } from "./mechanics";

export function renderFrame(
  ctx: CanvasRenderingContext2D,
  dpr: number,
  s: GameState,
  ui: { mode: Mode; score: number; lines: number; level: number }
) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const ww = W * CELL + 180;
  const hh = H * CELL;

  const drawCell = (x: number, y: number, c: Cell) => {
    if (c === 0) return;
    const px = x * CELL;
    const py = y * CELL;
    ctx.fillStyle = COLORS[c];
    ctx.fillRect(px + 1, py + 1, CELL - 2, CELL - 2);
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.fillRect(px + 2, py + 2, CELL - 4, 4);
    ctx.fillStyle = "rgba(0,0,0,0.20)";
    ctx.fillRect(px + 2, py + CELL - 6, CELL - 4, 4);
  };

  // bg
  ctx.clearRect(0, 0, ww, hh);
  ctx.fillStyle = "rgba(7, 12, 22, 1)";
  ctx.fillRect(0, 0, ww, hh);

  // playfield frame
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fillRect(0, 0, W * CELL, hh);

  // grid
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  for (let x = 0; x <= W; x++) {
    ctx.beginPath();
    ctx.moveTo(x * CELL, 0);
    ctx.lineTo(x * CELL, hh);
    ctx.stroke();
  }
  for (let y = 0; y <= H; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * CELL);
    ctx.lineTo(W * CELL, y * CELL);
    ctx.stroke();
  }

  // board
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) drawCell(x, y, s.board[y][x]);

  // active + ghost
  if (ui.mode !== "gameover") {
    let ghost = s.active;
    while (true) {
      const g2 = { ...ghost, y: ghost.y + 1 };
      if (collides(g2, s.board)) break;
      ghost = g2;
    }

    // ghost
    ctx.globalAlpha = 0.25;
    for (const [x, y] of getBlocks(ghost)) if (y >= 0) drawCell(x, y, s.active.t);
    ctx.globalAlpha = 1;

    // active
    for (const [x, y] of getBlocks(s.active)) if (y >= 0) drawCell(x, y, s.active.t);
  }

  // side panel
  const sx = W * CELL + 18;
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font = "700 16px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";
  ctx.fillText("Tetris", sx, 26);

  ctx.fillStyle = "rgba(255,255,255,0.70)";
  ctx.font = "500 12px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";
  ctx.fillText(`Mode: ${ui.mode}`, sx, 48);

  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font = "600 13px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";
  ctx.fillText(`Score: ${ui.score}`, sx, 78);
  ctx.fillText(`Lines: ${ui.lines}`, sx, 100);
  ctx.fillText(`Level: ${ui.level}`, sx, 122);

  // next piece
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText("Next:", sx, 154);
  const nt = s.next;
  const blocks = PIECES[nt].blocks[0];
  ctx.fillStyle = COLORS[nt];
  for (const [dx, dy] of blocks) {
    const nx = sx + 10 + (dx + 1) * 16;
    const ny = 170 + (dy + 1) * 16;
    ctx.fillRect(nx, ny, 14, 14);
  }
}
