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
};

type GameState = {
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

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

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

function scaleLevelToWidth(base: LevelDef, canvasW: number, hudClearPx: number) {
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

function buildBricksScaled(level: ReturnType<typeof scaleLevelToWidth>): Brick[] {
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

export default function BrickBreaker() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 640);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const [mode, setMode] = useState<Mode>("idle");
  const modeRef = useRef<Mode>("idle");
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const [scoreUI, setScoreUI] = useState(0);
  const [livesUI, setLivesUI] = useState(3);
  const [levelUI, setLevelUI] = useState(1);

  const levels = useMemo<LevelDef[]>(
    () => [
      { rows: 6, cols: 10, brickW: 76, brickH: 18, gap: 10, top: 55 },
      { rows: 7, cols: 11, brickW: 70, brickH: 18, gap: 9, top: 55 },
      { rows: 8, cols: 12, brickW: 64, brickH: 18, gap: 8, top: 55 },
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

  const uiScaleRef = useRef(1);
  const sizeRef = useRef({ w: 860, h: 520, dpr: 1 });

  const resetGame = (toLevel = 1) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { w, h } = sizeRef.current;
    const uiScale = uiScaleRef.current;

    const lvlIndex = clamp(toLevel - 1, 0, levels.length - 1);
    const levelBase = levels[lvlIndex];

    const pw = 120 * uiScale;
    const ph = 14 * uiScale;
    const px = (w - pw) / 2;

    const br = 7 * uiScale;
    const bx = px + pw / 2;
    const by = h - 55 - ph - br;

    const hudClearPx = isMobile ? 46 : 40;
    const scaled = scaleLevelToWidth(levelBase, w, hudClearPx);
    const bricks = buildBricksScaled(scaled);

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

    setScoreUI(0);
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

    const angle = (Math.random() * 0.7 + 0.25) * (Math.random() < 0.5 ? -1 : 1);
    const uiScale = uiScaleRef.current;
    const speed = 6.2 * uiScale;

    s.vx = Math.sin(angle) * speed;
    s.vy = -Math.cos(angle) * speed;
  };

  // -----------------------------
  // ✅ Delta-based drag (Safari-safe)
  // -----------------------------
  const pointerRef = useRef({
    active: false,
    pointerId: -1,
    startX: 0,
    startY: 0,
    startT: 0,
    lastX: 0,
    moved: false,
  });

  const TAP_MS = 220;
  const TAP_MOVE_PX = 10;

  const handleTapAction = () => {
    const m = modeRef.current;
    if (m === "idle") setMode("running");
    else if (m === "running") launchBall();
    else if (m === "paused") setMode("running");
    else if (m === "gameover" || m === "win") resetGame(1);
  };

  // Gain based on screen size (feel free to tweak)
  const calcMobileGain = () => {
    const { w } = sizeRef.current;
    // w ~ 320..860
    // smaller screen => need larger gain so it feels responsive
    // clamp into a safe range
    return clamp(860 / Math.max(320, w), 1.0, 1.5);
  };

  const applyDeltaMove = (deltaClientX: number) => {
    const s = stateRef.current;
    const { w } = sizeRef.current;

    // convert CSS delta to game delta if container is scaled
    // (important if wrap width != game width)
    const wrap = wrapRef.current;
    let scaleX = 1;
    if (wrap) {
      const rect = wrap.getBoundingClientRect();
      if (rect.width > 0) scaleX = w / rect.width;
    }

    const uiScale = uiScaleRef.current;
    const gain = isMobile ? calcMobileGain() : 1;

    const deltaGameX = deltaClientX * scaleX * gain;

    s.px = clamp(s.px + deltaGameX, 10, w - s.pw - 10);
    if (s.serveLock) s.bx = s.px + s.pw / 2;
  };

  // We bind move/up on window during an active drag to avoid iOS Safari dropping events.
  const moveListenerRef = useRef<((ev: PointerEvent) => void) | null>(null);
  const upListenerRef = useRef<((ev: PointerEvent) => void) | null>(null);

  const stopWindowListeners = () => {
    if (moveListenerRef.current) window.removeEventListener("pointermove", moveListenerRef.current);
    if (upListenerRef.current) window.removeEventListener("pointerup", upListenerRef.current);
    if (upListenerRef.current)
      window.removeEventListener("pointercancel", upListenerRef.current as any);
    moveListenerRef.current = null;
    upListenerRef.current = null;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!e.isPrimary) return;

    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);

    const p = pointerRef.current;
    p.active = true;
    p.pointerId = e.pointerId;
    p.startX = e.clientX;
    p.startY = e.clientY;
    p.startT = performance.now();
    p.lastX = e.clientX;
    p.moved = false;

    // bind window listeners (Safari stability)
    const onMove = (ev: PointerEvent) => {
      const pp = pointerRef.current;
      if (!pp.active) return;
      if (ev.pointerId !== pp.pointerId) return;

      const dx = ev.clientX - pp.lastX;
      if (dx !== 0) {
        pp.moved = true;
        applyDeltaMove(dx);
        pp.lastX = ev.clientX;
      }
    };

    const onUp = (ev: PointerEvent) => {
      const pp = pointerRef.current;
      if (!pp.active) return;
      if (ev.pointerId !== pp.pointerId) return;

      pp.active = false;
      stopWindowListeners();

      const elapsed = performance.now() - pp.startT;
      const movedX = Math.abs(ev.clientX - pp.startX);
      const movedY = Math.abs(ev.clientY - pp.startY);

      const isTap = !pp.moved && elapsed <= TAP_MS && movedX <= TAP_MOVE_PX && movedY <= TAP_MOVE_PX;
      if (isTap) handleTapAction();
    };

    moveListenerRef.current = onMove;
    upListenerRef.current = onUp;

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("pointercancel", onUp as any, { passive: true });
  };

  // Keyboard
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || (target as any)?.isContentEditable) return;

      const s = stateRef.current;

      if (e.key === " " || e.key === "ArrowLeft" || e.key === "ArrowRight") e.preventDefault();

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

      if (e.key.toLowerCase() === "r") resetGame(1);
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
  }, [levels]);

  // Canvas sizing
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

      uiScaleRef.current = clamp(w / 860, 0.6, 1);

      if (stateRef.current.bricks.length === 0) {
        resetGame(1);
      } else {
        const s = stateRef.current;
        const uiScale = uiScaleRef.current;

        const oldPw = s.pw;
        const oldBr = s.br;

        s.pw = 120 * uiScale;
        s.ph = 14 * uiScale;
        s.br = 7 * uiScale;

        const oldCenter = s.px + oldPw / 2;
        s.px = clamp(oldCenter - s.pw / 2, 10, w - s.pw - 10);

        if (s.serveLock) s.bx = s.px + s.pw / 2;

        s.bx = clamp(s.bx, s.br, w - s.br);
        s.by = clamp(s.by, s.br, h - s.br);

        const lvlIndex = clamp(s.level - 1, 0, levels.length - 1);
        const levelBase = levels[lvlIndex];

        const hudClearPx = isMobile ? 46 : 40;
        const scaled = scaleLevelToWidth(levelBase, w, hudClearPx);
        const newBricks = buildBricksScaled(scaled);

        for (let i = 0; i < newBricks.length && i < s.bricks.length; i++) {
          newBricks[i].alive = s.bricks[i].alive;
        }
        s.bricks = newBricks;

        if (s.serveLock) {
          s.by = h - 55 - s.ph - s.br;
        } else {
          if (Math.abs(oldBr - s.br) > 0.01) {
            s.by = clamp(s.by, s.br, h - s.br);
          }
        }
      }
    };

    resize();

    const ro = new ResizeObserver(() => resize());
    if (wrapRef.current) ro.observe(wrapRef.current);
    window.addEventListener("resize", resize);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", resize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levels, isMobile]);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const tick = () => {
      const { w, h, dpr } = sizeRef.current;
      const s = stateRef.current;

      if (modeRef.current === "running") {
        const uiScale = uiScaleRef.current;
        const speed = 8 * uiScale;

        if (s.left) s.px -= speed;
        if (s.right) s.px += speed;
        s.px = clamp(s.px, 10, w - s.pw - 10);

        if (s.serveLock) {
          s.bx = s.px + s.pw / 2;
          s.by = h - 55 - s.ph - s.br;
        } else {
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
              setScoreUI((sc) => sc + 10);

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
              setMode("win");
            } else {
              const base = levels[next - 1];
              const hudClearPx = isMobile ? 46 : 40;
              const scaled = scaleLevelToWidth(base, w, hudClearPx);
              s.level = next;
              s.bricks = buildBricksScaled(scaled);
              setLevelUI(next);
              resetLife();
              setMode("idle");
            }
          }

          if (s.by - s.br > h + 10) {
            s.lives -= 1;
            setLivesUI(s.lives);
            if (s.lives <= 0) setMode("gameover");
            else {
              resetLife();
              setMode("idle");
            }
          }
        }
      }

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
      const rr = 8 * uiScaleRef.current;
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

      if (modeRef.current !== "running") {
        let title = "Brick Breaker";
        let subtitle = isMobile
          ? "Tap: start / launch · Drag: move"
          : "Space: Start/Launch · A/D or ←/→ Move · P: Pause";

        if (modeRef.current === "paused") {
          title = "Paused";
          subtitle = isMobile ? "Tap to resume" : "Press P to resume";
        }
        if (modeRef.current === "gameover") {
          title = "Game Over";
          subtitle = isMobile ? "Tap to restart" : "Press Space/Enter to restart";
        }
        if (modeRef.current === "win") {
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

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [levels, isMobile]);

  useEffect(() => {
    resetGame(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const gameHeight = isMobile ? "min(70vh, 520px)" : "520px";
  const buttonBase =
    "rounded-full border border-white/10 bg-white/5 hover:bg-white/10 active:bg-white/15";
  const buttonCls = isMobile
    ? `text-sm px-4 py-2 ${buttonBase}`
    : `text-sm px-3 py-1.5 ${buttonBase}`;

  return (
    <div className="w-full">
      <div className="flex flex-col gap-2 mb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-between sm:justify-start gap-3">
          <div className="text-sm opacity-80">{mode === "running" ? "Running" : mode}</div>
          <div className="text-xs opacity-80">
            Score <span className="opacity-100 tabular-nums">{scoreUI}</span> · Lives{" "}
            <span className="opacity-100 tabular-nums">{livesUI}</span> · L{" "}
            <span className="opacity-100 tabular-nums">{levelUI}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button className={buttonCls} onClick={() => setMode("running")}>
            Start
          </button>
          <button className={buttonCls} onClick={() => launchBall()}>
            Fire
          </button>
          <button
            className={buttonCls}
            onClick={() => setMode((m) => (m === "running" ? "paused" : m))}
          >
            Pause
          </button>
          <button className={buttonCls} onClick={() => resetGame(1)}>
            Reset
          </button>
        </div>
      </div>

      <div
        ref={wrapRef}
        className="rounded-2xl overflow-hidden border border-white/10 bg-black/20 select-none"
        tabIndex={0}
        role="application"
        onClick={(e) => (e.currentTarget as HTMLDivElement).focus()}
        onPointerDown={(e) => {
          (e.currentTarget as HTMLDivElement).focus();
          onPointerDown(e);
        }}
        style={{ width: "100%", height: gameHeight, touchAction: "none" }}
      >
        <canvas ref={canvasRef} />
      </div>

      <div className="mt-3 text-xs opacity-70 leading-relaxed">
        {isMobile ? (
          <>
            Mobile: <span className="opacity-90">Drag</span> to move (delta-based),{" "}
            <span className="opacity-90">Tap</span> to start/launch.
          </>
        ) : (
          <>
            Desktop: <span className="opacity-90">A/D or ←/→</span> move,{" "}
            <span className="opacity-90">Space/Enter</span> start & launch,{" "}
            <span className="opacity-90">P</span> pause, <span className="opacity-90">R</span>{" "}
            restart.
          </>
        )}
      </div>
    </div>
  );
}
