import type { Mode } from "../lib/types";

export function createTouchHandlers(args: {
  modeRef: React.MutableRefObject<Mode>;
  setMode: (m: Mode | ((m: Mode) => Mode)) => void;
  reset: () => void;
  move: (dx: number) => void;
  rotate: () => void;
  hardDrop: () => void;
}) {
  const touchRef = {
    down: false,
    sx: 0,
    sy: 0,
    moved: false,
    t0: 0,
  };

  const SWIPE_MIN = 26;
  const TAP_MAX_MS = 240;

  const onPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLDivElement).focus();
    touchRef.down = true;
    touchRef.sx = e.clientX;
    touchRef.sy = e.clientY;
    touchRef.moved = false;
    touchRef.t0 = performance.now();
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!touchRef.down) return;

    const dx = e.clientX - touchRef.sx;
    const dy = e.clientY - touchRef.sy;

    if (!touchRef.moved && (Math.abs(dx) >= SWIPE_MIN || Math.abs(dy) >= SWIPE_MIN)) {
      touchRef.moved = true;

      // idle/paused: swipe to start
      if (args.modeRef.current === "idle" || args.modeRef.current === "paused") {
        args.setMode("running");
        return;
      }
      if (args.modeRef.current !== "running") return;

      if (Math.abs(dx) > Math.abs(dy)) {
        args.move(dx > 0 ? 1 : -1);
      } else {
        if (dy > 0) args.hardDrop(); // swipe down => hard drop
        else args.rotate(); // swipe up => rotate
      }
    }
  };

  const onPointerUp = () => {
    if (!touchRef.down) return;

    const dt = performance.now() - touchRef.t0;

    if (!touchRef.moved && dt <= TAP_MAX_MS) {
      // tap
      if (args.modeRef.current === "idle") args.setMode("running");
      else if (args.modeRef.current === "paused") args.setMode("running");
      else if (args.modeRef.current === "running") args.rotate();
      else if (args.modeRef.current === "gameover") args.reset();
    }

    touchRef.down = false;
  };

  const onPointerCancel = () => {
    touchRef.down = false;
  };

  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel };
}
