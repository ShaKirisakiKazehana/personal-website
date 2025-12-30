import React from "react";
import type { Mode, GameState } from "../lib/types";
import { applyDeltaMove, launchBall } from "../lib/mechanics";

export function createPointerHandlers(args: {
  modeRef: React.MutableRefObject<Mode>;
  setMode: (m: Mode | ((m: Mode) => Mode)) => void;
  resetGame: (toLevel?: number) => void;
  sRef: React.MutableRefObject<GameState>;
  uiScaleRef: React.MutableRefObject<number>;
  sizeRef: React.MutableRefObject<{ w: number; h: number; dpr: number }>;
  wrapRef: React.RefObject<HTMLDivElement>;
  isMobile: boolean;
}) {
  const pointerRef = {
    active: false,
    pointerId: -1,
    startX: 0,
    startY: 0,
    startT: 0,
    lastX: 0,
    moved: false,
  };

  const TAP_MS = 220;
  const TAP_MOVE_PX = 10;

  const handleTapAction = () => {
    const m = args.modeRef.current;
    const s = args.sRef.current;
    if (m === "idle") args.setMode("running");
    else if (m === "running") launchBall(s, args.uiScaleRef.current);
    else if (m === "paused") args.setMode("running");
    else if (m === "gameover" || m === "win") args.resetGame(1);
  };

  let moveListener: ((ev: PointerEvent) => void) | null = null;
  let upListener: ((ev: PointerEvent) => void) | null = null;

  const stopWindowListeners = () => {
    if (moveListener) window.removeEventListener("pointermove", moveListener);
    if (upListener) window.removeEventListener("pointerup", upListener);
    if (upListener) window.removeEventListener("pointercancel", upListener as any);
    moveListener = null;
    upListener = null;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!e.isPrimary) return;

    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);

    pointerRef.active = true;
    pointerRef.pointerId = e.pointerId;
    pointerRef.startX = e.clientX;
    pointerRef.startY = e.clientY;
    pointerRef.startT = performance.now();
    pointerRef.lastX = e.clientX;
    pointerRef.moved = false;

    moveListener = (ev: PointerEvent) => {
      if (!pointerRef.active) return;
      if (ev.pointerId !== pointerRef.pointerId) return;

      const dx = ev.clientX - pointerRef.lastX;
      if (dx !== 0) {
        pointerRef.moved = true;

        const { w } = args.sizeRef.current;
        const wrap = args.wrapRef.current;
        const rectW = wrap?.getBoundingClientRect().width;

        applyDeltaMove(args.sRef.current, {
          deltaClientX: dx,
          canvasW: w,
          wrapRectW: rectW,
          isMobile: args.isMobile,
        });

        pointerRef.lastX = ev.clientX;
      }
    };

    upListener = (ev: PointerEvent) => {
      if (!pointerRef.active) return;
      if (ev.pointerId !== pointerRef.pointerId) return;

      pointerRef.active = false;
      stopWindowListeners();

      const elapsed = performance.now() - pointerRef.startT;
      const movedX = Math.abs(ev.clientX - pointerRef.startX);
      const movedY = Math.abs(ev.clientY - pointerRef.startY);

      const isTap = !pointerRef.moved && elapsed <= TAP_MS && movedX <= TAP_MOVE_PX && movedY <= TAP_MOVE_PX;
      if (isTap) handleTapAction();
    };

    window.addEventListener("pointermove", moveListener, { passive: true });
    window.addEventListener("pointerup", upListener, { passive: true });
    window.addEventListener("pointercancel", upListener as any, { passive: true });
  };

  return { onPointerDown };
}
