"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Mode, GameState } from "./lib/types";
import { clamp } from "./lib/math";
import { defaultLevels, scaleLevelToWidth, buildBricksScaled } from "./lib/levels";
import { initState } from "./lib/state";
import { renderFrame } from "./lib/render";
import { stepTick } from "./lib/mechanics";
import { bindKeyboard } from "./input/keyboard";
import { createPointerHandlers } from "./input/pointer";
import { useScoreboardApi } from "../_shared/useScoreboardApi";

export default function BrickBreakerClient() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null!);

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
  const scoreRef = useRef(0);
  useEffect(() => {
    scoreRef.current = scoreUI;
  }, [scoreUI]);

  const [livesUI, setLivesUI] = useState(3);
  const [levelUI, setLevelUI] = useState(1);

  const levels = useMemo(() => defaultLevels(), []);

  const stateRef = useRef<GameState>(
    initState({
      canvasW: 860,
      canvasH: 520,
      uiScale: 1,
      isMobile: false,
      levels,
      toLevel: 1,
    })
  );

  const uiScaleRef = useRef(1);
  const sizeRef = useRef({ w: 860, h: 520, dpr: 1 });

  // scoreboard (API only; UI is shown in a separate Leaderboard sheet in GamesSection)
  const scoreboard = useScoreboardApi("brickbreaker");

  const resetGame = (toLevel = 1) => {
    const { w, h } = sizeRef.current;

    scoreboard.resetPostLock();

    stateRef.current = initState({
      canvasW: w,
      canvasH: h,
      uiScale: uiScaleRef.current,
      isMobile,
      levels,
      toLevel,
    });

    setScoreUI(0);
    scoreRef.current = 0;
    setLivesUI(3);
    setLevelUI(clamp(toLevel, 1, levels.length));
    setMode("idle");
  };

  useEffect(() => {
    resetGame(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return bindKeyboard({
      modeRef,
      setMode,
      resetGame,
      sRef: stateRef,
      uiScaleRef,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pointer = createPointerHandlers({
    modeRef,
    setMode,
    resetGame,
    sRef: stateRef,
    uiScaleRef,
    sizeRef,
    wrapRef,
    isMobile,
  });

  // sizing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const parent = wrapRef.current;
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

      const s = stateRef.current;

      if (s.bricks.length === 0) {
        resetGame(1);
        return;
      }

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

      const base = levels[clamp(s.level - 1, 0, levels.length - 1)];
      const hudClearPx = isMobile ? 46 : 40;
      const scaled = scaleLevelToWidth(base, w, hudClearPx);
      const newBricks = buildBricksScaled(scaled);
      for (let i = 0; i < newBricks.length && i < s.bricks.length; i++) newBricks[i].alive = s.bricks[i].alive;
      s.bricks = newBricks;

      if (s.serveLock) {
        s.by = h - 55 - s.ph - s.br;
      } else if (Math.abs(oldBr - s.br) > 0.01) {
        s.by = clamp(s.by, s.br, h - s.br);
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

  // loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const tick = () => {
      const { w, h, dpr } = sizeRef.current;

      const end = stepTick({
        s: stateRef.current,
        mode: modeRef.current,
        canvasW: w,
        canvasH: h,
        uiScale: uiScaleRef.current,
        isMobile,
        levels,
        onMode: (m) => setMode(m),
        onScore: (delta) => setScoreUI((sc) => sc + delta),
        onLives: (n) => setLivesUI(n),
        onLevel: (n) => setLevelUI(n),
      });

      if (end.ended) {
        scoreboard.postScoreOnce(scoreRef.current);
      }

      renderFrame({
        ctx,
        dpr,
        w,
        h,
        s: stateRef.current,
        mode: modeRef.current,
        isMobile,
        uiScale: uiScaleRef.current,
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [levels, isMobile]);

  // Allow an embedding container (e.g. the scroll-snap Games section) to override
  // the canvas height via CSS variables, so the playable area can stay on-screen.
  const gameHeight = isMobile
    ? "var(--game-h-mobile, min(70vh, 520px))"
    : "var(--game-h-desktop, 520px)";
  const buttonBase = "rounded-full border border-white/10 bg-white/5 hover:bg-white/10 active:bg-white/15";
  const buttonCls = isMobile ? `text-sm px-4 py-2 ${buttonBase}` : `text-sm px-3 py-1.5 ${buttonBase}`;

  return (
    <div className="w-full flex flex-col min-h-0 flex-1">
      <div className="bb-topbar flex flex-col gap-2 mb-2 sm:mb-3 sm:flex-row sm:items-center sm:justify-between">
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
          <button className={buttonCls} onClick={() => setMode((m) => (m === "running" ? "paused" : m))}>
            Pause
          </button>
          <button className={buttonCls} onClick={() => resetGame(1)}>
            Reset
          </button>
        </div>
      </div>

      <div
        ref={wrapRef}
        className="flex-1 rounded-2xl overflow-hidden border border-white/10 bg-black/20 select-none"
        tabIndex={0}
        role="application"
        onClick={(e) => (e.currentTarget as HTMLDivElement).focus()}
        onPointerDown={(e) => {
          (e.currentTarget as HTMLDivElement).focus();
          pointer.onPointerDown(e);
        }}
        style={{ width: "100%", height: gameHeight, touchAction: "none" }}
      >
        <canvas ref={canvasRef} />
      </div>

      <div className="bb-hint mt-3 text-xs opacity-70 leading-relaxed">
        {isMobile ? (
          <>
            Mobile: <span className="opacity-90">Drag</span> to move,{" "}
            <span className="opacity-90">Tap</span> to start/launch.
          </>
        ) : (
          <>
            Desktop: <span className="opacity-90">A/D or ←/→</span> move,{" "}
            <span className="opacity-90">Space/Enter</span> start & launch,{" "}
            <span className="opacity-90">P</span> pause, <span className="opacity-90">R</span> restart.
          </>
        )}
      </div>
    </div>
  );
}
