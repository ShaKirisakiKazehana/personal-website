"use client";

import { useEffect, useMemo, useRef } from "react";
import type { GameKey } from "./ScoreboardCard";

// Lightweight API helper (no UI). Games can use this to:
// 1) ensure the server assigns a user via GET
// 2) submit best score once per run
export function useScoreboardApi(game: GameKey) {
  const postedRef = useRef(false);

  const endpoint = useMemo(() => `/api/scoreboard?game=${game}`, [game]);

  const refresh = async () => {
    await fetch(endpoint, {
      method: "GET",
      cache: "no-store",
      headers: { "cache-control": "no-cache" },
    }).catch(() => {});
  };

  const postScoreOnce = async (score: number) => {
    if (postedRef.current) return;
    postedRef.current = true;
    await fetch(endpoint, {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json", "cache-control": "no-cache" },
      body: JSON.stringify({ score }),
    }).catch(() => {});
  };

  const resetPostLock = () => {
    postedRef.current = false;
  };

  // Assign user as soon as the game mounts.
  useEffect(() => {
    postedRef.current = false;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

  return { refresh, postScoreOnce, resetPostLock };
}
