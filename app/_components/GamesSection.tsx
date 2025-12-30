"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";

type GameKey = "tetris" | "brickbreaker";

const TetrisClient = dynamic(() => import("../games/tetris/TetrisClient"), { ssr: false });
const BrickBreakerClient = dynamic(() => import("../games/brickbreaker/BrickBreakerClient"), { ssr: false });

export default function GamesSection() {
  const [selected, setSelected] = useState<GameKey | null>(null);
  const [showLb, setShowLb] = useState(false);
  const stageRef = useRef<HTMLDivElement | null>(null);

  const title = useMemo(() => {
    if (selected === "tetris") return "Tetris";
    if (selected === "brickbreaker") return "Brick Breaker";
    return "";
  }, [selected]);

  // Focus the embedded game stage so arrow keys / space go to the game and not page scroll.
  useEffect(() => {
    if (!selected) return;
    const t = window.setTimeout(() => stageRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [selected]);

  // Prevent background scroll while the leaderboard sheet is open.
  useEffect(() => {
    if (!showLb) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showLb]);

  return (
    <section id="games" data-snap-section data-section="games" className="snap-section">
      <main
        className={
          selected
            ? "mx-auto max-w-[1200px] px-4 sm:px-8 w-full h-[calc(100svh-var(--nav-h))] flex flex-col"
            : "mx-auto max-w-[1200px] px-8 w-full"
        }
      >
        {/*
          Mobile UX goal: when a game is selected, keep the playable area on-screen.
          So we tighten vertical spacing and let the game stage take priority.
        */}
        <div className={selected ? "section-inner pt-3 flex-1 flex flex-col" : "section-inner pt-16"}>
          {/* When playing, hide the big section title so the game can take over the screen. */}
          {!selected && (
            <h2 className="text-4xl font-semibold tracking-tight">Games</h2>
          )}
          {!selected && (
            <p className="mt-6 text-sm text-neutral-600 max-w-[70ch]">
              Mini games you can play directly in the browser.
            </p>
          )}

          {!selected ? (
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setSelected("tetris")}
                className="text-left rounded-2xl border border-black/10 bg-white/70 p-6 hover:bg-white transition"
              >
                <div className="text-sm font-semibold">Tetris</div>
                <div className="mt-1 text-sm text-neutral-600">Classic blocks · rotate · clear lines</div>
              </button>

              <button
                type="button"
                onClick={() => setSelected("brickbreaker")}
                className="text-left rounded-2xl border border-black/10 bg-white/70 p-6 hover:bg-white transition"
              >
                <div className="text-sm font-semibold">Brick Breaker</div>
                <div className="mt-1 text-sm text-neutral-600">Canvas arcade · score/levels</div>
              </button>
            </div>
          ) : (
            <>
              {/* Top-right action buttons (kept on a single row) */}

              {/* Embedded game stage replaces the list (no full navigation / refresh)
                  Mobile goal: the game should take the whole available viewport. */}
              <div className="flex-1 flex flex-col min-h-0 pt-2">
                <div
                  ref={stageRef}
                  tabIndex={0}
                  data-no-snap
                  className="game-stage game-stage--fullscreen game-fullscreen rounded-3xl border border-black/10 bg-white/70 outline-none focus:ring-2 focus:ring-black/20"
                  onKeyDown={(e) => {
                    const k = e.key;
                    if (
                      k === "ArrowUp" ||
                      k === "ArrowDown" ||
                      k === "ArrowLeft" ||
                      k === "ArrowRight" ||
                      k === " " ||
                      k === "PageUp" ||
                      k === "PageDown"
                    ) {
                      e.preventDefault();
                    }
                  }}
                  style={{
                    // Let individual games consume as much height as possible.
                    ["--game-h-mobile" as any]: "calc(100% - 56px)",
                    ["--game-h-desktop" as any]: "calc(100% - 56px)",
                  }}
                >
                  {selected === "tetris" ? <TetrisClient /> : <BrickBreakerClient />}
                </div>
              </div>

              {/* Action buttons below the game UI (no overlay) */}
              <div className="w-full flex items-center justify-center gap-2 py-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowLb(false);
                    setSelected(null);
                  }}
                  className="inline-flex items-center rounded-full border border-black/15 bg-white/80 px-4 py-2 text-sm font-medium shadow-sm backdrop-blur hover:bg-black hover:text-white transition"
                >
                  Back
                </button>

                <button
                  type="button"
                  onClick={() => setShowLb(true)}
                  className="inline-flex items-center rounded-full border border-black/15 bg-white/80 px-4 py-2 text-sm font-medium shadow-sm backdrop-blur hover:bg-black hover:text-white transition"
                >
                  Leaderboard
                </button>
              </div>
              {/* Leaderboard sheet/modal */}
              {showLb && selected && (
                <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/20 p-4" role="dialog" aria-modal="true">
                  <div className="leaderboard-sheet w-full max-w-[720px] rounded-3xl border border-black/10 bg-white/95 backdrop-blur p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold">{title} · Leaderboard</div>
                      <button
                        type="button"
                        onClick={() => setShowLb(false)}
                        className="rounded-full border border-black/15 bg-white px-4 py-2 text-sm font-medium hover:bg-black hover:text-white transition"
                      >
                        Close
                      </button>
                    </div>

                    <div className="mt-4">
                      {/* Reuse the shared scoreboard UI, but keep it separate from the game stage */}
                      {selected === "tetris" ? (
                        // dynamic import path keeps client-only
                        <Scoreboard game="tetris" />
                      ) : (
                        <Scoreboard game="brickbreaker" />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </main>
    </section>
  );
}

// Local wrapper so we don't pull the scoreboard UI into SSR.
const Scoreboard = dynamic(() => import("../games/_shared/ScoreboardCard"), { ssr: false });