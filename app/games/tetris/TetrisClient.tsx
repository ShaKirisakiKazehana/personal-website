"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Mode, GameState } from "./lib/types";
import { W, H, CELL, clamp } from "./lib/constants";
import { initGameState } from "./lib/state";
import { tryMove, tryRotate, stepDownOnce } from "./lib/mechanics";
import { renderFrame } from "./lib/render";
import { bindKeyboard } from "./input/keyboard";
import { createTouchHandlers } from "./input/touch";

export default function TetrisClient() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const [mode, setMode] = useState<Mode>("idle");
  const modeRef = useRef<Mode>("idle");
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  const [lines, setLines] = useState(0);
  const linesRef = useRef(0);
  useEffect(() => {
    linesRef.current = lines;
  }, [lines]);

  const [level, setLevel] = useState(1);
  const levelRef = useRef(1);
  useEffect(() => {
    levelRef.current = level;
  }, [level]);

  const stateRef = useRef<GameState>(initGameState());

  const dprRef = useRef(1);

  const speedMs = useMemo(() => {
    const base = 700;
    const v = base - (level - 1) * 60;
    return clamp(v, 120, base);
  }, [level]);

  const reset = () => {
    stateRef.current = initGameState();
    setScore(0);
    setLines(0);
    setLevel(1);
    setMode("idle");
  };

  // init
  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const move = (dx: number) => {
    tryMove(stateRef.current, dx);
  };

  const rotate = (dir: 1 | -1) => {
    tryRotate(stateRef.current, dir);
  };

  const setSoft = (v: boolean) => {
    stateRef.current.soft = v;
  };

  const applyClearScoring = (cleared: number) => {
    if (cleared <= 0) return;

    // lines + level
    setLines((L) => {
      const nextL = L + cleared;
      const nextLevel = Math.floor(nextL / 10) + 1;
      setLevel(nextLevel);
      return nextL;
    });

    // score (按“当前level”加分：跟你原逻辑一致)
    const addBase = cleared === 1 ? 100 : cleared === 2 ? 300 : cleared === 3 ? 500 : 800;
    const lvl = levelRef.current;
    setScore((sc) => sc + addBase * lvl);
  };

  const step = (hard: boolean) => {
    const res = stepDownOnce(stateRef.current, hard);

    if (res.scoreDelta !== 0) {
      setScore((sc) => sc + res.scoreDelta);
    }

    if (res.cleared > 0) {
      applyClearScoring(res.cleared);
    }

    if (res.gameover) {
      setMode("gameover");
    }
  };

  // keyboard bind
  useEffect(() => {
    return bindKeyboard({
      modeRef,
      setMode,
      reset,
      move,
      rotate: () => rotate(1),
      rotateCCW: () => rotate(-1),
      hardDrop: () => step(true),
      setSoft,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // canvas setup (固定像素尺寸)
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

    const tick = (now: number) => {
      const dt = Math.min(50, now - last);
      last = now;

      if (modeRef.current === "running") {
        const s = stateRef.current;
        s.dropAcc += dt;

        const interval = s.soft ? Math.max(40, speedMs * 0.08) : speedMs;

        while (s.dropAcc >= interval) {
          s.dropAcc -= interval;
          step(false);
          if (modeRef.current !== "running") break;
        }
      }

      renderFrame(ctx, dprRef.current, stateRef.current, {
        mode: modeRef.current,
        score: scoreRef.current,
        lines: linesRef.current,
        level: levelRef.current,
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [speedMs]);

  // touch handlers
  const touch = createTouchHandlers({
    modeRef,
    setMode,
    reset,
    move,
    rotate: () => rotate(1),
    hardDrop: () => step(true),
  });

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
          onPointerDown={touch.onPointerDown}
          onPointerMove={touch.onPointerMove}
          onPointerUp={touch.onPointerUp}
          onPointerCancel={touch.onPointerCancel}
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
        <span className="opacity-90">Swipe up</span> rotate.
      </div>
    </div>
  );
}
