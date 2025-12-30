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
  const wrapRef = useRef<HTMLDivElement | null>(null);
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
  const sizeRef = useRef({ w: 0, h: 0 });

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

  const applyClearScoring = (cleared: number) => {
    if (cleared <= 0) return;

    setLines((L) => {
      const nextL = L + cleared;
      const nextLevel = Math.floor(nextL / 10) + 1;
      setLevel(nextLevel);
      return nextL;
    });

    const addBase = cleared === 1 ? 100 : cleared === 2 ? 300 : cleared === 3 ? 500 : 800;
    const lvl = levelRef.current;
    setScore((sc) => sc + addBase * lvl);
  };

  const step = (hard: boolean) => {
    const res = stepDownOnce(stateRef.current, hard);

    if (res.scoreDelta !== 0) setScore((sc) => sc + res.scoreDelta);
    if (res.cleared > 0) applyClearScoring(res.cleared);
    if (res.gameover) setMode("gameover");
  };

  useEffect(() => {
    return bindKeyboard({
      modeRef,
      setMode,
      reset,
      move,
      rotate: () => rotate(1),
      rotateCCW: () => rotate(-1),
      hardDrop: () => step(true),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resizeCanvasToWrapper = () => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const rect = wrap.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width));
    const h = Math.max(1, Math.floor(rect.height));

    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    dprRef.current = dpr;
    sizeRef.current = { w, h };

    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
  };

  useEffect(() => {
    resizeCanvasToWrapper();

    const wrap = wrapRef.current;
    if (!wrap) return;

    const ro = new ResizeObserver(() => resizeCanvasToWrapper());
    ro.observe(wrap);

    window.addEventListener("resize", resizeCanvasToWrapper);
    window.addEventListener("orientationchange", resizeCanvasToWrapper);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", resizeCanvasToWrapper);
      window.removeEventListener("orientationchange", resizeCanvasToWrapper);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

        const interval = speedMs;

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
      }, sizeRef.current);

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [speedMs]);

  const touch = createTouchHandlers({
    modeRef,
    setMode,
    reset,
    move,
    rotate: () => rotate(1),
    hardDrop: () => step(true),
  });

  return (
    <div className="w-full h-full min-h-0 flex flex-col">
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

      <div className="flex-1 min-h-0 flex items-center justify-center">
        <div
          ref={wrapRef}
          className="rounded-2xl overflow-hidden border border-white/10 bg-black/20 w-full h-full flex items-center justify-center"
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

      {/* Desktop 不显示说明，让画布尽量大 */}
      <div className="mt-3 text-xs opacity-70 leading-relaxed md:hidden">
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
