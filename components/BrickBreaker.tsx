"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type Mode = "idle" | "running" | "paused" | "gameover" | "win";

type Brick = {
  x: number;
  y: number;
  w: number;
  h: number;
  alive: boolean;
};

type LevelDef = {
  rows: number;
  cols: number;
  brickW: number;
  brickH: number;
  gap: number;
  top: number;
  paddingX: number;
};

type GameState = {
  left: boolean;
  right: boolean;

  // paddle
  px: number;
  pw: number;
  ph: number;

  // ball
  bx: number;
  by: number;
  br: number;
  vx: number;
  vy: number;
  served: boolean; // ball has been launched in current life
  serveLock: boolean; // ball is locked to paddle until launch

  // level
  level: number;
  lives: number;
  bricks: Brick[];
};

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

function buildBricks(level: LevelDef): Brick[] {
  const bricks: Brick[] = [];
  const totalW = level.cols * level.brickW + (level.cols - 1) * level.gap;
  const startX = level.paddingX;
  const x0 = startX + (Math.max(0, 0.5 * (0 - 0))) + 0; // no-op (kept for readability)
  const baseX = level.paddingX + Math.max(0, 0.5 * (0 - 0)) + 0;

  // center within available width by computing later in runtime
  // here we only store relative, actual x will be adjusted when canvas size known
  for (let r = 0; r < level.rows; r++) {
    for (let c = 0; c < level.cols; c++) {
      bricks.push({
        x: baseX + c * (level.brickW + level.gap),
        y: level.top + r * (level.brickH + level.gap),
        w: level.brickW,
        h: level.brickH,
        alive: true,
      });
    }
  }

  // We'll re-center them in resetGame() once we know canvas width.
  // totalW is computed but not used here; kept for clarity.
  void totalW;
  void x0;
  return bricks;
}

function circleRectHit(
  cx: number,
  cy: number,
  r: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number
) {
  const nx = clamp(cx, rx, rx + rw);
  const ny = clamp(cy, ry, ry + rh);
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy <= r * r;
}

export default function BrickBreaker() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  // UI state
  const [mode, setMode] = useState<Mode>("idle");
  const modeRef = useRef<Mode>("idle");
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const [score, setScore] = useState(0);
  const [livesUI, setLivesUI] = useState(3);
  const [levelUI, setLevelUI] = useState(1);

  const levels = useMemo<LevelDef[]>(
    () => [
      { rows: 6, cols: 10, brickW: 76, brickH: 18, gap: 10, top: 55, paddingX: 40 },
      { rows: 7, cols: 11, brickW: 70, brickH: 18, gap: 9, top: 55, paddingX: 35 },
      { rows: 8, cols: 12, brickW: 64, brickH: 18, gap: 8, top: 55, paddingX: 30 },
    ],
    []
  );

  const stateRef = useRef<GameState>({
    left: false,
    right: false,
    px: 0,
    pw: 120,
    ph: 14,
    bx: 0,
    by: 0,
    br: 7,
    vx: 0,
    vy: 0,
    served: false,
    serveLock: true,
    level: 1,
    lives: 3,
    bricks: [],
  });

  // Size + DPR
  const sizeRef = useRef({ w: 860, h: 520, dpr: 1 });

  const resetGame = (toLevel = 1) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { w, h } = sizeRef.current;
    const level = levels[clamp(toLevel - 1, 0, levels.length - 1)];

    // paddle
    const pw = 120;
    const ph = 14;
    const px = (w - pw) / 2;

    // ball (locked on paddle until launch)
    const br = 7;
    const bx = px + pw / 2;
    const by = h - 55 - ph - br;

    // bricks
    const bricks = buildBricks(level);

    // center bricks based on current canvas width
    const totalW = level.cols * level.brickW + (level.cols - 1) * level.gap;
    const startX = (w - totalW) / 2;
    for (let i = 0; i < bricks.length; i++) {
      const b = bricks[i];
      const idx = i % level.cols;
      b.x = startX + idx * (level.brickW + level.gap);
    }

    stateRef.current = {
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
      level: clamp(toLevel, 1, levels.length),
      lives: 3,
      bricks,
    };

    setScore(0);
    setLivesUI(3);
    setLevelUI(clamp(toLevel, 1, levels.length));
    setMode("idle");
  };

  const resetLife = () => {
    const { w, h } = sizeRef.current;
    const s = stateRef.current;
    s.px = (w - s.pw) / 2;
    s.bx = s.px + s.pw / 2;
    s.by = h - 55 - s.ph - s.br;
    s.vx = 0;
    s.vy = 0;
    s.served = false;
    s.serveLock = true;
  };

  const launchBall = () => {
    const s = stateRef.current;
    if (!s.serveLock) return;
    s.serveLock = false;
    s.served = true;

    // launch with a slight angle
    const angle = (Math.random() * 0.7 + 0.25) * (Math.random() < 0.5 ? -1 : 1);
    const speed = 6.2;
    s.vx = Math.sin(angle) * speed;
    s.vy = -Math.cos(angle) * speed;
  };

  // Pointer controls (desktop + mobile)
  const pointerRef = useRef({
    active: false,
    lastX: 0,
  });

  const onPointerDown = (e: React.PointerEvent) => {
    pointerRef.current.active = true;
    pointerRef.current.lastX = e.clientX;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointerRef.current.active) return;
    const dx = e.clientX - pointerRef.current.lastX;
    pointerRef.current.lastX = e.clientX;

    const s = stateRef.current;
    const { w } = sizeRef.current;
    s.px = clamp(s.px + dx, 10, w - s.pw - 10);
    if (s.serveLock) {
      s.bx = s.px + s.pw / 2;
    }
  };

  const onPointerUp = () => {
    pointerRef.current.active = false;
  };

  // --- KEYBOARD (bind once; use refs for latest state) ---
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Don't steal keys while typing into inputs/textareas/editors
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || (target as any)?.isContentEditable) return;

      const s = stateRef.current;

      // Prevent Space/Arrow keys from scrolling the page
      if (e.key === " " || e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
      }

      if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") s.left = true;
      if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") s.right = true;

      const m = modeRef.current;

      if (e.key === " " || e.key === "Enter") {
        if (m === "idle") setMode("running");
        else if (m === "running") launchBall();
        else if (m === "paused") setMode("running");
        else if (m === "gameover" || m === "win") resetGame(1);
      }

      if (e.key.toLowerCase() === "p") {
        setMode((cur) => (cur === "running" ? "paused" : cur === "paused" ? "running" : cur));
      }

      if (e.key.toLowerCase() === "r") {
        resetGame(1);
      }
    };

    const up = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") s.left = false;
      if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") s.right = false;
    };

    window.addEventListener("keydown", down, { passive: false });
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down as any, { passive: false } as any);
      window.removeEventListener("keyup", up);
    };
  }, []);

  // Setup canvas sizing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;

      const rect = parent.getBoundingClientRect();
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      const w = Math.floor(rect.width);
      const h = Math.floor(rect.height);

      sizeRef.current = { w, h, dpr };
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      // init if empty
      if (stateRef.current.bricks.length === 0) {
        resetGame(1);
      } else {
        // keep paddle/ball within bounds
        const s = stateRef.current;
        s.px = clamp(s.px, 10, w - s.pw - 10);
        if (s.serveLock) s.bx = s.px + s.pw / 2;
        s.by = clamp(s.by, 10, h - 10);
      }
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(32, now - last);
      last = now;

      const { w, h, dpr } = sizeRef.current;
      const s = stateRef.current;

      // update
      if (modeRef.current === "running") {
        // paddle movement
        const speed = 8;
        if (s.left) s.px -= speed;
        if (s.right) s.px += speed;
        s.px = clamp(s.px, 10, w - s.pw - 10);

        // ball follows paddle until launched
        if (s.serveLock) {
          s.bx = s.px + s.pw / 2;
          s.by = h - 55 - s.ph - s.br;
        } else {
          // move ball
          s.bx += s.vx;
          s.by += s.vy;

          // walls
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

          // paddle collision
          const paddleY = h - 55 - s.ph;
          if (
            circleRectHit(s.bx, s.by, s.br, s.px, paddleY, s.pw, s.ph) &&
            s.vy > 0
          ) {
            // reflect based on where it hits the paddle
            const hit = (s.bx - (s.px + s.pw / 2)) / (s.pw / 2);
            const speedMag = Math.hypot(s.vx, s.vy);
            const maxAngle = Math.PI / 3; // 60deg
            const ang = hit * maxAngle;
            s.vx = Math.sin(ang) * speedMag;
            s.vy = -Math.cos(ang) * speedMag;
            s.by = paddleY - s.br - 0.5;
          }

          // brick collisions
          let aliveCount = 0;
          for (let i = 0; i < s.bricks.length; i++) {
            const b = s.bricks[i];
            if (!b.alive) continue;
            aliveCount++;
            if (circleRectHit(s.bx, s.by, s.br, b.x, b.y, b.w, b.h)) {
              b.alive = false;
              setScore((sc) => sc + 10);

              // basic bounce: decide axis by penetration direction
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

          // win condition
          if (aliveCount === 0) {
            const next = s.level + 1;
            if (next > levels.length) {
              setMode("win");
            } else {
              // next level
              const levelDef = levels[next - 1];
              const bricks = buildBricks(levelDef);
              const totalW = levelDef.cols * levelDef.brickW + (levelDef.cols - 1) * levelDef.gap;
              const startX = (w - totalW) / 2;
              for (let i = 0; i < bricks.length; i++) {
                const b = bricks[i];
                const idx = i % levelDef.cols;
                b.x = startX + idx * (levelDef.brickW + levelDef.gap);
              }
              s.level = next;
              s.bricks = bricks;
              setLevelUI(next);
              resetLife();
              setMode("idle");
            }
          }

          // lose life
          if (s.by - s.br > h + 10) {
            s.lives -= 1;
            setLivesUI(s.lives);
            if (s.lives <= 0) {
              setMode("gameover");
            } else {
              resetLife();
              setMode("idle");
            }
          }
        }
      }

      // render
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // background
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "rgba(7, 12, 22, 1)";
      ctx.fillRect(0, 0, w, h);

      // grid overlay
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

      // HUD top-left
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.font = "600 14px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";
      ctx.fillText(`Score: ${score}`, 18, 24);
      ctx.fillText(`Lives: ${livesUI}`, 110, 24);
      ctx.fillText(`Level: ${levelUI}`, 190, 24);

      // bricks
      for (const b of s.bricks) {
        if (!b.alive) continue;
        // simple beveled brick
        ctx.fillStyle = "rgba(100, 215, 255, 0.92)";
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.fillStyle = "rgba(255,255,255,0.18)";
        ctx.fillRect(b.x, b.y, b.w, 4);
        ctx.fillStyle = "rgba(0,0,0,0.18)";
        ctx.fillRect(b.x, b.y + b.h - 4, b.w, 4);
        ctx.fillStyle = "rgba(0,0,0,0.08)";
        ctx.fillRect(b.x + 3, b.y + 3, b.w - 6, b.h - 6);
      }

      // paddle
      const paddleY = h - 55 - s.ph;
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      const r = 8;
      // rounded rect
      ctx.beginPath();
      ctx.moveTo(s.px + r, paddleY);
      ctx.arcTo(s.px + s.pw, paddleY, s.px + s.pw, paddleY + s.ph, r);
      ctx.arcTo(s.px + s.pw, paddleY + s.ph, s.px, paddleY + s.ph, r);
      ctx.arcTo(s.px, paddleY + s.ph, s.px, paddleY, r);
      ctx.arcTo(s.px, paddleY, s.px + s.pw, paddleY, r);
      ctx.closePath();
      ctx.fill();

      // ball
      ctx.beginPath();
      ctx.arc(s.bx, s.by, s.br, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.fill();

      // center overlay text
      if (modeRef.current !== "running") {
        let title = "Brick Breaker";
        let subtitle = "Space: Start / Launch · A/D or ←/→ Move · P: Pause";
        if (modeRef.current === "paused") {
          title = "Paused";
          subtitle = "Press P to resume";
        }
        if (modeRef.current === "gameover") {
          title = "Game Over";
          subtitle = "Press Space/Enter to restart";
        }
        if (modeRef.current === "win") {
          title = "You Win!";
          subtitle = "Press Space/Enter to play again";
        }

        ctx.fillStyle = "rgba(255,255,255,0.92)";
        ctx.font = "800 38px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";
        const tw = ctx.measureText(title).width;
        ctx.fillText(title, (w - tw) / 2, h * 0.58);

        ctx.fillStyle = "rgba(255,255,255,0.62)";
        ctx.font = "500 14px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";
        const sw = ctx.measureText(subtitle).width;
        ctx.fillText(subtitle, (w - sw) / 2, h * 0.58 + 26);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [levels, levelUI, livesUI, score]);

  // initial
  useEffect(() => {
    resetGame(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm opacity-80">{mode === "running" ? "Running" : mode}</div>

        <div className="flex items-center gap-2">
          <button
            className="text-sm px-3 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10"
            onClick={() => setMode("running")}
          >
            Launch
          </button>
          <button
            className="text-sm px-3 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10"
            onClick={() => setMode((m) => (m === "running" ? "paused" : m))}
          >
            Pause
          </button>
          <button
            className="text-sm px-3 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10"
            onClick={() => resetGame(1)}
          >
            Reset
          </button>
        </div>
      </div>

      <div
        className="rounded-2xl overflow-hidden border border-white/10 bg-black/20"
        tabIndex={0}
        role="application"
        onClick={(e) => (e.currentTarget as HTMLDivElement).focus()}
        onPointerDown={(e) => {
          (e.currentTarget as HTMLDivElement).focus();
          onPointerDown(e);
        }}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ width: "100%", height: 520 }}
      >
        <canvas ref={canvasRef} />
      </div>

      <div className="mt-3 text-xs opacity-70 leading-relaxed">
        Controls: <span className="opacity-90">A/D or ←/→</span> move,{" "}
        <span className="opacity-90">Space/Enter</span> start & launch,{" "}
        <span className="opacity-90">P</span> pause, <span className="opacity-90">R</span> restart.
        <br />
        Mobile: drag to move paddle, tap to start/launch.
      </div>
    </div>
  );
}
