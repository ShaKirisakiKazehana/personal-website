"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";

type GameKey = "tetris" | "brickbreaker";

const TetrisClient = dynamic(() => import("../games/tetris/TetrisClient"), { ssr: false });
const BrickBreakerClient = dynamic(() => import("../games/brickbreaker/BrickBreakerClient"), { ssr: false });

// Local wrapper so we don't pull the scoreboard UI into SSR.
const Scoreboard = dynamic(() => import("../games/_shared/ScoreboardCard"), { ssr: false });

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
          {!selected && <h2 className="text-4xl font-semibold tracking-tight">Games</h2>}
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
              {/* Game + actions layout:
                  - Mobile: column (buttons below the game)
                  - Desktop: row (buttons on the right side, vertical)
              */}
              <div className="flex-1 min-h-0 pt-2 flex flex-col md:flex-row md:items-stretch gap-4">
                {/* Game area */}
                <div className="flex-1 min-h-0 min-w-0 flex flex-col">
                  <div
                    ref={stageRef}
                    tabIndex={0}
                    data-no-snap
                    className="game-stage game-stage--fullscreen game-fullscreen flex-1 min-h-0 rounded-3xl border border-black/10 bg-white/70 outline-none focus:ring-2 focus:ring-black/20"
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
                      ["--game-h-mobile" as any]: "min(70svh, 520px)",
                      ["--game-h-desktop" as any]: "min(70vh, 560px)",
                    }}
                    
                  >
                    {selected === "tetris" ? <TetrisClient /> : <BrickBreakerClient />}
                  </div>
                </div>

                {/* Action buttons:
                    - Mobile: below the game (row)
                    - Desktop: right side (column)
                */}
                <div
                  className="
                    w-full
                    flex items-center justify-center gap-2 py-3
                    md:w-[180px] md:py-0
                    md:flex-col md:items-stretch md:justify-start
                    md:pt-2
                  "
                >
                  <button
                    type="button"
                    onClick={() => {
                      setShowLb(false);
                      setSelected(null);
                    }}
                    className="inline-flex items-center justify-center rounded-full border border-black/15 bg-white/80 px-4 py-2 text-sm font-medium shadow-sm backdrop-blur hover:bg-black hover:text-white transition"
                  >
                    Back
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowLb(true)}
                    className="inline-flex items-center justify-center rounded-full border border-black/15 bg-white/80 px-4 py-2 text-sm font-medium shadow-sm backdrop-blur hover:bg-black hover:text-white transition"
                  >
                    Leaderboard
                  </button>
                </div>
              </div>

              {/* Leaderboard sheet/modal */}
              {showLb && selected && (
                <div
                  className="fixed inset-0 z-[60] flex items-start justify-center bg-black/20 p-4"
                  role="dialog"
                  aria-modal="true"
                >
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
                      {selected === "tetris" ? <Scoreboard game="tetris" /> : <Scoreboard game="brickbreaker" />}
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
