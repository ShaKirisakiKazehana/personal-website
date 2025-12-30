"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type Mode = "idle" | "running" | "paused" | "gameover";

type Cell = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

const W = 10;
const H = 20;
const CELL = 24;

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

const PIECES: Record<
  Exclude<Cell, 0>,
  { name: string; blocks: number[][][] } // rotations, each is [ [x,y], ... ]
> = {
  1: {
    name: "I",
    blocks: [
      [
        [-1, 0],
        [0, 0],
        [1, 0],
        [2, 0],
      ],
      [
        [1, -1],
        [1, 0],
        [1, 1],
        [1, 2],
      ],
      [
        [-1, 1],
        [0, 1],
        [1, 1],
        [2, 1],
      ],
      [
        [0, -1],
        [0, 0],
        [0, 1],
        [0, 2],
      ],
    ],
  },
  2: {
    name: "O",
    blocks: [
      [
        [0, 0],
        [1, 0],
        [0, 1],
        [1, 1],
      ],
      [
        [0, 0],
        [1, 0],
        [0, 1],
        [1, 1],
      ],
      [
        [0, 0],
        [1, 0],
        [0, 1],
        [1, 1],
      ],
      [
        [0, 0],
        [1, 0],
        [0, 1],
        [1, 1],
      ],
    ],
  },
  3: {
    name: "T",
    blocks: [
      [
        [0, 0],
        [-1, 0],
        [1, 0],
        [0, 1],
      ],
      [
        [0, 0],
        [0, -1],
        [0, 1],
        [1, 0],
      ],
      [
        [0, 0],
        [-1, 0],
        [1, 0],
        [0, -1],
      ],
      [
        [0, 0],
        [0, -1],
        [0, 1],
        [-1, 0],
      ],
    ],
  },
  4: {
    name: "S",
    blocks: [
      [
        [0, 0],
        [1, 0],
        [0, 1],
        [-1, 1],
      ],
      [
        [0, 0],
        [0, 1],
        [1, 0],
        [1, -1],
      ],
      [
        [0, 0],
        [1, 0],
        [0, 1],
        [-1, 1],
      ],
      [
        [0, 0],
        [0, 1],
        [1, 0],
        [1, -1],
      ],
    ],
  },
  5: {
    name: "Z",
    blocks: [
      [
        [0, 0],
        [-1, 0],
        [0, 1],
        [1, 1],
      ],
      [
        [0, 0],
        [0, 1],
        [-1, 0],
        [-1, -1],
      ],
      [
        [0, 0],
        [-1, 0],
        [0, 1],
        [1, 1],
      ],
      [
        [0, 0],
        [0, 1],
        [-1, 0],
        [-1, -1],
      ],
    ],
  },
  6: {
    name: "J",
    blocks: [
      [
        [0, 0],
        [-1, 0],
        [1, 0],
        [-1, 1],
      ],
      [
        [0, 0],
        [0, -1],
        [0, 1],
        [1, 1],
      ],
      [
        [0, 0],
        [-1, 0],
        [1, 0],
        [1, -1],
      ],
      [
        [0, 0],
        [0, -1],
        [0, 1],
        [-1, -1],
      ],
    ],
  },
  7: {
    name: "L",
    blocks: [
      [
        [0, 0],
        [-1, 0],
        [1, 0],
        [1, 1],
      ],
      [
        [0, 0],
        [0, -1],
        [0, 1],
        [1, -1],
      ],
      [
        [0, 0],
        [-1, 0],
        [1, 0],
        [-1, -1],
      ],
      [
        [0, 0],
        [0, -1],
        [0, 1],
        [-1, 1],
      ],
    ],
  },
};

const COLORS: Record<Cell, string> = {
  0: "rgba(0,0,0,0)",
  1: "rgba(110, 220, 255, 0.95)",
  2: "rgba(255, 235, 120, 0.95)",
  3: "rgba(190, 140, 255, 0.95)",
  4: "rgba(140, 255, 170, 0.95)",
  5: "rgba(255, 140, 160, 0.95)",
  6: "rgba(140, 180, 255, 0.95)",
  7: "rgba(255, 190, 120, 0.95)",
};

type Active = {
  t: Exclude<Cell, 0>;
  rot: number;
  x: number;
  y: number;
};

function makeBoard(): Cell[][] {
  return Array.from({ length: H }, () => Array.from({ length: W }, () => 0 as Cell));
}

function randPiece(): Exclude<Cell, 0> {
  return (Math.floor(Math.random() * 7) + 1) as Exclude<Cell, 0>;
}

export default function Tetris() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const [mode, setMode] = useState<Mode>("idle");
  const modeRef = useRef<Mode>("idle");
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);

  const stateRef = useRef<{
    board: Cell[][];
    active: Active;
    next: Exclude<Cell, 0>;
    dropAcc: number;
    soft: boolean;
  }>({
    board: makeBoard(),
    active: { t: 1, rot: 0, x: 4, y: 0 },
    next: randPiece(),
    dropAcc: 0,
    soft: false,
  });

  const dprRef = useRef(1);

  const speedMs = useMemo(() => {
    const base = 700;
    const v = base - (level - 1) * 60;
    return clamp(v, 120, base);
  }, [level]);

  const getBlocks = (a: Active) =>
    PIECES[a.t].blocks[a.rot % 4].map(([dx, dy]) => [a.x + dx, a.y + dy] as const);

  const collides = (a: Active, board: Cell[][]) => {
    for (const [x, y] of getBlocks(a)) {
      if (x < 0 || x >= W || y >= H) return true;
      if (y >= 0 && board[y][x] !== 0) return true;
    }
    return false;
  };

  const spawn = () => {
    const s = stateRef.current;
    const t = s.next;
    s.next = randPiece();
    s.active = { t, rot: 0, x: 4, y: -1 };
    if (collides(s.active, s.board)) {
      setMode("gameover");
    }
  };

  const lock = () => {
    const s = stateRef.current;
    for (const [x, y] of getBlocks(s.active)) {
      if (y >= 0) s.board[y][x] = s.active.t;
    }
  };

  const clearLines = () => {
    const s = stateRef.current;
    let cleared = 0;
    for (let y = H - 1; y >= 0; y--) {
      if (s.board[y].every((c) => c !== 0)) {
        s.board.splice(y, 1);
        s.board.unshift(Array.from({ length: W }, () => 0 as Cell));
        cleared++;
        y++;
      }
    }
    if (cleared > 0) {
      setLines((L) => {
        const nextL = L + cleared;
        const nextLevel = Math.floor(nextL / 10) + 1;
        setLevel(nextLevel);
        return nextL;
      });
      const add = cleared === 1 ? 100 : cleared === 2 ? 300 : cleared === 3 ? 500 : 800;
      setScore((sc) => sc + add * level);
    }
  };

  const move = (dx: number) => {
    const s = stateRef.current;
    const a2 = { ...s.active, x: s.active.x + dx };
    if (!collides(a2, s.board)) s.active = a2;
  };

  const rotate = (dir: 1 | -1) => {
    const s = stateRef.current;
    const r2 = (s.active.rot + (dir === 1 ? 1 : 3)) % 4;
    const tries = [0, -1, 1, -2, 2];
    for (const k of tries) {
      const a2 = { ...s.active, rot: r2, x: s.active.x + k };
      if (!collides(a2, s.board)) {
        s.active = a2;
        return;
      }
    }
  };

  const stepDown = (hard = false) => {
    const s = stateRef.current;

    if (hard) {
      // 硬降：只影响当前方块（落地 -> lock -> 清行 -> 生成下一个）
      let a = s.active;
      while (true) {
        const a2 = { ...a, y: a.y + 1 };
        if (collides(a2, s.board)) break;
        a = a2;
        setScore((sc) => sc + 2);
      }
      s.active = a;
      lock();
      clearLines();
      spawn();
      return;
    }

    // 单步下落
    const a2 = { ...s.active, y: s.active.y + 1 };
    if (!collides(a2, s.board)) {
      s.active = a2;
      if (s.soft) setScore((sc) => sc + 1);
    } else {
      lock();
      clearLines();
      spawn();
    }
  };

  const reset = () => {
    stateRef.current = {
      board: makeBoard(),
      active: { t: randPiece(), rot: 0, x: 4, y: -1 },
      next: randPiece(),
      dropAcc: 0,
      soft: false,
    };
    setScore(0);
    setLines(0);
    setLevel(1);
    setMode("idle");
  };

  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // keyboard
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || (target as any)?.isContentEditable) return;

      const m = modeRef.current;

      if (["ArrowLeft", "ArrowRight", "ArrowDown", " "].includes(e.key)) e.preventDefault();

      if (e.key === " " || e.key === "Enter") {
        if (m === "idle") setMode("running");
        else if (m === "paused") setMode("running");
        else if (m === "running") stepDown(true);
        else if (m === "gameover") reset();
        return;
      }

      if (e.key.toLowerCase() === "p") {
        setMode((cur) => (cur === "running" ? "paused" : cur === "paused" ? "running" : cur));
        return;
      }

      if (e.key.toLowerCase() === "r") {
        reset();
        return;
      }

      if (m !== "running") return;

      if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") move(-1);
      if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") move(1);
      if (e.key === "ArrowUp" || e.key.toLowerCase() === "w") rotate(1);
      if (e.key.toLowerCase() === "q") rotate(-1);
      if (e.key === "ArrowDown" || e.key.toLowerCase() === "s") stateRef.current.soft = true;
    };

    const up = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key.toLowerCase() === "s") stateRef.current.soft = false;
    };

    window.addEventListener("keydown", down, { passive: false });
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down as any);
      window.removeEventListener("keyup", up);
    };
  }, []);

  // canvas setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    dprRef.current = dpr;

    const ww = W * CELL + 180;
    const hh = H * CELL;

    canvas.width = Math.floor(ww * dpr);
    canvas.height = Math.floor(hh * dpr);
    canvas.style.width = `${ww}px`;
    canvas.style.height = `${hh}px`;
  }, []);

  // loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let last = performance.now();

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

    const render = () => {
      const dpr = dprRef.current;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const ww = W * CELL + 180;
      const hh = H * CELL;

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
      const s = stateRef.current;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) drawCell(x, y, s.board[y][x]);

      // active + ghost
      if (modeRef.current !== "gameover") {
        let ghost = s.active;
        while (true) {
          const g2 = { ...ghost, y: ghost.y + 1 };
          if (collides(g2, s.board)) break;
          ghost = g2;
        }
        // ghost
        ctx.globalAlpha = 0.25;
        for (const [x, y] of getBlocks(ghost)) {
          if (y >= 0) drawCell(x, y, s.active.t);
        }
        ctx.globalAlpha = 1;

        // active
        for (const [x, y] of getBlocks(s.active)) {
          if (y >= 0) drawCell(x, y, s.active.t);
        }
      }

      // side panel
      const sx = W * CELL + 18;
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.font = "700 16px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";
      ctx.fillText("Tetris", sx, 26);

      ctx.fillStyle = "rgba(255,255,255,0.70)";
      ctx.font = "500 12px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";
      ctx.fillText(`Mode: ${modeRef.current}`, sx, 48);

      ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.font = "600 13px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";
      ctx.fillText(`Score: ${score}`, sx, 78);
      ctx.fillText(`Lines: ${lines}`, sx, 100);
      ctx.fillText(`Level: ${level}`, sx, 122);

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
    };

    const tick = (now: number) => {
      const dt = Math.min(50, now - last);
      last = now;

      if (modeRef.current === "running") {
        const s = stateRef.current;
        s.dropAcc += dt;
        const interval = s.soft ? Math.max(40, speedMs * 0.08) : speedMs;

        while (s.dropAcc >= interval) {
          s.dropAcc -= interval;
          stepDown(false);
          if (modeRef.current !== "running") break;
        }
      }

      render();
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [level, lines, score, speedMs]);

  // --- mobile gestures ---
  // 目标：
  // - 左滑/右滑：移动 1 格
  // - 上滑：不做事
  // - 下滑：硬降（当前方块直接落地并锁定，不影响逻辑正确性：会正常 spawn 下一个）
  // - 点一下：旋转
  const touchRef = useRef<{
    down: boolean;
    sx: number;
    sy: number;
    moved: boolean;
    t0: number;
  }>({
    down: false,
    sx: 0,
    sy: 0,
    moved: false,
    t0: 0,
  });

  const SWIPE_MIN = 26;
  const TAP_MAX_MS = 240;

  const onPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLDivElement).focus();
    touchRef.current.down = true;
    touchRef.current.sx = e.clientX;
    touchRef.current.sy = e.clientY;
    touchRef.current.moved = false;
    touchRef.current.t0 = performance.now();
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const t = touchRef.current;
    if (!t.down) return;

    const dx = e.clientX - t.sx;
    const dy = e.clientY - t.sy;

    // 一次手势只触发一次动作
    if (!t.moved && (Math.abs(dx) >= SWIPE_MIN || Math.abs(dy) >= SWIPE_MIN)) {
      t.moved = true;

      // 如果未开始/暂停：允许滑动直接开始（你不想要也可以删掉）
      if (modeRef.current === "idle" || modeRef.current === "paused") {
        setMode("running");
        return;
      }
      if (modeRef.current !== "running") return;

      if (Math.abs(dx) > Math.abs(dy)) {
        move(dx > 0 ? 1 : -1);
      } else {
        if (dy > 0) {
          // 下滑：硬降
          stepDown(true);
        } else {
          // 上滑：做rotate
          rotate(1);
        }
      }
    }
  };

  const onPointerUp = () => {
    const t = touchRef.current;
    if (!t.down) return;

    const dt = performance.now() - t.t0;

    if (!t.moved && dt <= TAP_MAX_MS) {
      // tap：旋转/开始/重开
      if (modeRef.current === "idle") setMode("running");
      else if (modeRef.current === "paused") setMode("running");
      else if (modeRef.current === "running") rotate(1);
      else if (modeRef.current === "gameover") reset();
    }

    t.down = false;
  };

  const onPointerCancel = () => {
    touchRef.current.down = false;
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm opacity-80">
          Mode: {mode} · Score: {score} · Lines: {lines} · Level: {level}
        </div>

        <div className="flex items-center gap-2">
          <button
            className="text-sm px-3 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10"
            onClick={() => {
              if (modeRef.current === "gameover") reset();
              setMode("running");
            }}
          >
            Start
          </button>

          <button
            className="text-sm px-3 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10"
            onClick={() =>
              setMode((m) => (m === "running" ? "paused" : m === "paused" ? "running" : m))
            }
          >
            {mode === "paused" ? "Resume" : "Pause"}
          </button>

          <button
            className="text-sm px-3 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10"
            onClick={reset}
          >
            Reset
          </button>
        </div>
      </div>

      <div className="flex justify-center">
        <div
          className="rounded-2xl overflow-hidden border border-white/10 bg-black/20 w-fit"
          style={{ touchAction: "none" }}
          tabIndex={0}
          role="application"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
        >
          <canvas ref={canvasRef} />
        </div>
      </div>

      <div className="mt-3 text-xs opacity-70 leading-relaxed">
        Keyboard: <span className="opacity-90">A/D or ←/→</span> move,{" "}
        <span className="opacity-90">W or ↑</span> rotate,{" "}
        <span className="opacity-90">S or ↓</span> soft drop,{" "}
        <span className="opacity-90">Space</span> hard drop,{" "}
        <span className="opacity-90">P</span> pause, <span className="opacity-90">R</span> restart.
        <br />
        Mobile: <span className="opacity-90">Tap</span> rotate,{" "}
        <span className="opacity-90">Swipe left/right</span> move 1,{" "}
        <span className="opacity-90">Swipe down</span> hard drop,{" "}
        <span className="opacity-90">Swipe up</span> (no action).
      </div>
    </div>
  );
}
