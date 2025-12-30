import type { Brick, LevelDef, ScaledLevel } from "./types";

export function defaultLevels(): LevelDef[] {
  return [
    { rows: 6, cols: 10, brickW: 76, brickH: 18, gap: 10, top: 55 },
    { rows: 7, cols: 11, brickW: 70, brickH: 18, gap: 9, top: 55 },
    { rows: 8, cols: 12, brickW: 64, brickH: 18, gap: 8, top: 55 },
  ];
}

export function scaleLevelToWidth(base: LevelDef, canvasW: number, hudClearPx: number): ScaledLevel {
  const sideMargin = 18;
  const usableW = Math.max(100, canvasW - sideMargin * 2);

  const baseTotalW = base.cols * base.brickW + (base.cols - 1) * base.gap;
  const scale = Math.min(1, usableW / baseTotalW);

  const brickW = base.brickW * scale;
  const brickH = base.brickH * scale;
  const gap = base.gap * scale;

  const top = Math.max(base.top * scale, hudClearPx);

  const totalW = base.cols * brickW + (base.cols - 1) * gap;
  const startX = (canvasW - totalW) / 2;

  return { rows: base.rows, cols: base.cols, brickW, brickH, gap, top, startX, totalW, scale };
}

export function buildBricksScaled(level: ScaledLevel): Brick[] {
  const bricks: Brick[] = [];
  for (let r = 0; r < level.rows; r++) {
    for (let c = 0; c < level.cols; c++) {
      bricks.push({
        x: level.startX + c * (level.brickW + level.gap),
        y: level.top + r * (level.brickH + level.gap),
        w: level.brickW,
        h: level.brickH,
        alive: true,
      });
    }
  }
  return bricks;
}
