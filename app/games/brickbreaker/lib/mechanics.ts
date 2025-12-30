import type { GameState, LevelDef, Mode } from "./types";
import { clamp } from "./math";
import { circleRectHit } from "./collision";
import { buildBricksScaled, scaleLevelToWidth } from "./levels";
import { resetLife } from "./state";

export function launchBall(s: GameState, uiScale: number) {
  if (!s.serveLock) return;

  s.serveLock = false;
  s.served = true;

  const angle = (Math.random() * 0.7 + 0.25) * (Math.random() < 0.5 ? -1 : 1);
  const speed = 6.2 * uiScale;

  s.vx = Math.sin(angle) * speed;
  s.vy = -Math.cos(angle) * speed;
}

export function calcMobileGain(canvasW: number) {
  return clamp(860 / Math.max(320, canvasW), 1.0, 1.5);
}

export function applyDeltaMove(
  s: GameState,
  args: { deltaClientX: number; canvasW: number; wrapRectW?: number; isMobile: boolean }
) {
  const { deltaClientX, canvasW: w, wrapRectW, isMobile } = args;

  let scaleX = 1;
  if (wrapRectW && wrapRectW > 0) scaleX = w / wrapRectW;

  const gain = isMobile ? calcMobileGain(w) : 1;
  const deltaGameX = deltaClientX * scaleX * gain;

  s.px = clamp(s.px + deltaGameX, 10, w - s.pw - 10);
  if (s.serveLock) s.bx = s.px + s.pw / 2;
}

export function stepTick(args: {
  s: GameState;
  mode: Mode;
  canvasW: number;
  canvasH: number;
  uiScale: number;
  isMobile: boolean;
  levels: LevelDef[];
  onMode: (m: Mode) => void;
  onScore: (delta: number) => void;
  onLives: (n: number) => void;
  onLevel: (n: number) => void;
}) {
  const { s, mode, canvasW: w, canvasH: h, uiScale, isMobile, levels } = args;
  if (mode !== "running") return { ended: false as const, endKind: null as null | "gameover" | "win" };

  const speed = 8 * uiScale;
  if (s.left) s.px -= speed;
  if (s.right) s.px += speed;
  s.px = clamp(s.px, 10, w - s.pw - 10);

  if (s.serveLock) {
    s.bx = s.px + s.pw / 2;
    s.by = h - 55 - s.ph - s.br;
    return { ended: false as const, endKind: null as null };
  }

  s.bx += s.vx;
  s.by += s.vy;

  if (s.bx - s.br < 0) {
    s.bx = s.br;
    s.vx *= -1;
  }
  if (s.bx + s.br > w) {
    s.bx = w - s.br;
    s.vx *= -1;
  }
  if (s.by - s.br < 0) {
    s.by = s.br;
    s.vy *= -1;
  }

  const paddleY = h - 55 - s.ph;
  if (circleRectHit(s.bx, s.by, s.br, s.px, paddleY, s.pw, s.ph) && s.vy > 0) {
    const hit = (s.bx - (s.px + s.pw / 2)) / (s.pw / 2);
    const speedMag = Math.hypot(s.vx, s.vy);
    const maxAngle = Math.PI / 3;
    const ang = hit * maxAngle;
    s.vx = Math.sin(ang) * speedMag;
    s.vy = -Math.cos(ang) * speedMag;
    s.by = paddleY - s.br - 0.5;
  }

  let aliveCount = 0;
  for (let i = 0; i < s.bricks.length; i++) {
    const b = s.bricks[i];
    if (!b.alive) continue;
    aliveCount++;

    if (circleRectHit(s.bx, s.by, s.br, b.x, b.y, b.w, b.h)) {
      b.alive = false;
      args.onScore(10);

      const cx = s.bx;
      const cy = s.by;
      const nx = clamp(cx, b.x, b.x + b.w);
      const ny = clamp(cy, b.y, b.y + b.h);
      const dx = cx - nx;
      const dy = cy - ny;
      if (Math.abs(dx) > Math.abs(dy)) s.vx *= -1;
      else s.vy *= -1;

      break;
    }
  }

  if (aliveCount === 0) {
    const next = s.level + 1;
    if (next > levels.length) {
      args.onMode("win");
      return { ended: true as const, endKind: "win" as const };
    }

    const base = levels[next - 1];
    const hudClearPx = isMobile ? 46 : 40;
    const scaled = scaleLevelToWidth(base, w, hudClearPx);
    s.level = next;
    s.bricks = buildBricksScaled(scaled);
    args.onLevel(next);

    resetLife(s, w, h);
    args.onMode("idle");
    return { ended: false as const, endKind: null as null };
  }

  if (s.by - s.br > h + 10) {
    s.lives -= 1;
    args.onLives(s.lives);

    if (s.lives <= 0) {
      args.onMode("gameover");
      return { ended: true as const, endKind: "gameover" as const };
    }

    resetLife(s, w, h);
    args.onMode("idle");
  }

  return { ended: false as const, endKind: null as null };
}
