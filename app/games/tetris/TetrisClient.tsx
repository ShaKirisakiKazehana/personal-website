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

  // --- Leaderboard / identity ---
  const [userName, setUserName] = useState<string>("user?");
  const [leaderboard, setLeaderboard] = useState<Array<{ name: string; best: number }>>([]);
  const postedRef = useRef(false);

  const refreshBoard = async () => {
    try {
      const r = await fetch("/api/tetris", { method: "GET" });
      const j = await r.json();
      setUserName(j.user?.name ?? "user?");
      setLeaderboard(j.leaderboard ?? []);
    } catch {
      // ignore
    }
  };

  const stateRef = useRef<GameState>(initGameState());
  const dprRef = useRef(1);

  const speedMs = useMemo(() => {
    const base = 700;
    const v = base - (level - 1) * 60;
    return clamp(v, 120, base);
  }, [level]);

  const reset = () => {
    postedRef.current = false; // ✅新一局允许再次提交
    stateRef.current = initGameState();
    setScore(0);
    setLines(0);
    setLevel(1);
    setMode("idle");
  };

  // init
  useEffect(() => {
    reset();
    refreshBoard(); // ✅进入页面就分配 user + 拉排行榜
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

    // lines + level
    setLines((L) => {
      const nextL = L + cleared;
      const nextLevel = Math.floor(nextL / 10) + 1;
      setLevel(nextLevel);
      return nextL;
    });

    // score
    const addBase = cleared === 1 ? 100 : cleared === 2 ? 300 : cleared === 3 ? 500 : 800;
    const lvl = levelRef.current;
    setScore((sc) => sc + addBase * lvl);
  };

  const postScoreOnce = (finalScore: number) => {
    if (postedRef.current) return;
    postedRef.current = true;

    fetch("/api/tetris", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score: finalScore }),
    })
      .then((r) => r.json())
      .then((j) => {
        if (j?.leaderboard) setLeaderboard(j.leaderboard);
      })
      .catch(() => {});
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
      // ✅只提交一次：用 ref 的最新分数
      postScoreOnce(scoreRef.current);
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
      // ↓/S：按住第一次触发 hard drop，repeat 忽略（在 keyboard.ts 里处理）
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // canvas setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    dprRef.current = dpr;

    const ww = W * CELL + 180; // playfield + side panel
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
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [speedMs]);

  // touch handlers（tap/up-swipe rotate, down-swipe hard drop）
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
      {/* top bar */}
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

      {/* leaderboard */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="text-sm opacity-70">You are</div>
          <div className="text-lg font-semibold">{userName}</div>
          <div className="mt-2 text-xs opacity-70">
            Best score is stored on server (updates on Game Over).
          </div>
          <button
            className="mt-3 text-xs px-3 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10"
            onClick={refreshBoard}
          >
            Refresh leaderboard
          </button>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="text-sm opacity-70">Leaderboard (Top 10)</div>
          <div className="mt-2 space-y-1">
            {leaderboard.length === 0 ? (
              <div className="text-xs opacity-60">No data yet.</div>
            ) : (
              leaderboard.map((u, i) => (
                <div key={`${u.name}-${i}`} className="flex justify-between text-sm">
                  <span className="opacity-90">
                    {i + 1}. {u.name}
                  </span>
                  <span className="tabular-nums opacity-90">{u.best}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* canvas */}
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
        <span className="opacity-90">↓ or S</span> hard drop (hold = once),{" "}
        <span className="opacity-90">Space</span> hard drop,{" "}
        <span className="opacity-90">P</span> pause, <span className="opacity-90">R</span> restart.
        <br />
        Mobile: <span className="opacity-90">Tap / Swipe up</span> rotate,{" "}
        <span className="opacity-90">Swipe left/right</span> move 1,{" "}
        <span className="opacity-90">Swipe down</span> hard drop.
      </div>
    </div>
  );
}
