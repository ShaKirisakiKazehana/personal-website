import type { GameState, LevelDef } from "./types";
import { clamp } from "./math";
import { buildBricksScaled, scaleLevelToWidth } from "./levels";

export function initState(args: {
  canvasW: number;
  canvasH: number;
  uiScale: number;
  isMobile: boolean;
  levels: LevelDef[];
  toLevel?: number;
}): GameState {
  const { canvasW: w, canvasH: h, uiScale, isMobile, levels } = args;
  const toLevel = clamp(args.toLevel ?? 1, 1, levels.length);

  const levelBase = levels[toLevel - 1];

  const pw = 120 * uiScale;
  const ph = 14 * uiScale;
  const px = (w - pw) / 2;

  const br = 7 * uiScale;
  const bx = px + pw / 2;
  const by = h - 55 - ph - br;

  const hudClearPx = isMobile ? 46 : 40;
  const scaled = scaleLevelToWidth(levelBase, w, hudClearPx);
  const bricks = buildBricksScaled(scaled);

  return {
    left: false,
    right: false,
    px,
    pw,
    ph,
    bx,
    by,
    br,
    vx: 0,
    vy: 0,
    served: false,
    serveLock: true,
    level: toLevel,
    lives: 3,
    bricks,
  };
}

export function resetLife(s: GameState, w: number, h: number) {
  s.px = (w - s.pw) / 2;
  s.bx = s.px + s.pw / 2;
  s.by = h - 55 - s.ph - s.br;
  s.vx = 0;
  s.vy = 0;
  s.served = false;
  s.serveLock = true;
}
