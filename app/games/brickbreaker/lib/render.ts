import type { GameState, Mode } from "./types";

export function renderFrame(args: {
  ctx: CanvasRenderingContext2D;
  dpr: number;
  w: number;
  h: number;
  s: GameState;
  mode: Mode;
  isMobile: boolean;
  uiScale: number;
}) {
  const { ctx, dpr, w, h, s, mode, isMobile, uiScale } = args;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  ctx.fillStyle = "rgba(7, 12, 22, 1)";
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;
  const grid = 28;
  for (let x = 0; x <= w; x += grid) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y <= h; y += grid) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  for (const b of s.bricks) {
    if (!b.alive) continue;
    ctx.fillStyle = "rgba(100, 215, 255, 0.92)";
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.fillRect(b.x, b.y, b.w, Math.max(2, b.h * 0.22));
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.fillRect(b.x, b.y + b.h - Math.max(2, b.h * 0.22), b.w, Math.max(2, b.h * 0.22));
    ctx.fillStyle = "rgba(0,0,0,0.08)";
    ctx.fillRect(b.x + 3, b.y + 3, Math.max(0, b.w - 6), Math.max(0, b.h - 6));
  }

  const paddleY = h - 55 - s.ph;
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  const rr = 8 * uiScale;
  ctx.beginPath();
  ctx.moveTo(s.px + rr, paddleY);
  ctx.arcTo(s.px + s.pw, paddleY, s.px + s.pw, paddleY + s.ph, rr);
  ctx.arcTo(s.px + s.pw, paddleY + s.ph, s.px, paddleY + s.ph, rr);
  ctx.arcTo(s.px, paddleY + s.ph, s.px, paddleY, rr);
  ctx.arcTo(s.px, paddleY, s.px + s.pw, paddleY, rr);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.arc(s.bx, s.by, s.br, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.fill();

  if (mode !== "running") {
    let title = "Brick Breaker";
    let subtitle = isMobile ? "Tap: start / launch · Drag: move" : "Space: Start/Launch · A/D or ←/→ Move · P: Pause";

    if (mode === "paused") {
      title = "Paused";
      subtitle = isMobile ? "Tap to resume" : "Press P to resume";
    }
    if (mode === "gameover") {
      title = "Game Over";
      subtitle = isMobile ? "Tap to restart" : "Press Space/Enter to restart";
    }
    if (mode === "win") {
      title = "You Win!";
      subtitle = isMobile ? "Tap to play again" : "Press Space/Enter to play again";
    }

    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = `800 ${isMobile ? 28 : 38}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto`;
    const tw = ctx.measureText(title).width;
    ctx.fillText(title, (w - tw) / 2, h * 0.58);

    ctx.fillStyle = "rgba(255,255,255,0.62)";
    ctx.font = "500 14px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";
    const sw = ctx.measureText(subtitle).width;
    ctx.fillText(subtitle, (w - sw) / 2, h * 0.58 + 26);
  }
}
