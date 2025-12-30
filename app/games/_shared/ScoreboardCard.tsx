"use client";

import React, { useEffect, useRef, useState } from "react";

export type GameKey = "tetris" | "brickbreaker";

export default function ScoreboardCard({
  game,
  onReady,
}: {
  game: GameKey;
  onReady?: (api: {
    refresh: () => Promise<void>;
    postScoreOnce: (score: number) => Promise<void>;
    resetPostLock: () => void;
  }) => void;
}) {
  const [userName, setUserName] = useState("loading...");
  const [leaderboard, setLeaderboard] = useState<Array<{ name: string; best: number }>>([]);
  const postedRef = useRef(false);

  const endpoint = `/api/scoreboard?game=${game}`;

  const refresh = async () => {
    const r = await fetch(endpoint, {
      method: "GET",
      cache: "no-store",
      headers: { "cache-control": "no-cache" },
    });

    if (!r.ok) {
      console.error("GET scoreboard failed:", r.status);
      setUserName("user(assign failed)");
      return;
    }

    const j = await r.json();

    if (!j?.user?.name) {
      console.error("Bad scoreboard response:", j);
      setUserName("user(assign failed)");
      return;
    }

    setUserName(j.user.name);
    setLeaderboard(Array.isArray(j.leaderboard) ? j.leaderboard : []);
  };

  const postScoreOnce = async (score: number) => {
    if (postedRef.current) return;
    postedRef.current = true;

    try {
      const r = await fetch(endpoint, {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json", "cache-control": "no-cache" },
        body: JSON.stringify({ score }),
      });
      const j = await r.json();
      if (j?.leaderboard) setLeaderboard(j.leaderboard);
    } catch {
      // ignore
    }
  };

  const resetPostLock = () => {
    postedRef.current = false;
  };

  useEffect(() => {
    postedRef.current = false;
    refresh();
    onReady?.({ refresh, postScoreOnce, resetPostLock });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game]);

  return (
    <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
        <div className="text-sm opacity-70">You are</div>
        <div className="text-lg font-semibold">{userName}</div>
        <div className="mt-2 text-xs opacity-70">
          Best score is stored on server (updates on Game Over / Win).
        </div>
        <button
          className="mt-3 text-xs px-3 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10"
          onClick={refresh}
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
  );
}
