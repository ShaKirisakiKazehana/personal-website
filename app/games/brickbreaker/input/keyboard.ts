import type { Mode, GameState } from "../lib/types";
import { launchBall } from "../lib/mechanics";

export function bindKeyboard(args: {
  modeRef: React.MutableRefObject<Mode>;
  setMode: (m: Mode | ((m: Mode) => Mode)) => void;
  resetGame: (toLevel?: number) => void;
  sRef: React.MutableRefObject<GameState>;
  uiScaleRef: React.MutableRefObject<number>;
}) {
  const down = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement | null;
    const tag = target?.tagName?.toLowerCase();
    if (tag === "input" || tag === "textarea" || (target as any)?.isContentEditable) return;

    const s = args.sRef.current;

    // Prevent page scroll while using arrow keys/space inside the game.
    if ([" ", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) e.preventDefault();

    if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") s.left = true;
    if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") s.right = true;

    const m = args.modeRef.current;

    if (e.key === " " || e.key === "Enter") {
      if (m === "idle") args.setMode("running");
      else if (m === "running") launchBall(s, args.uiScaleRef.current);
      else if (m === "paused") args.setMode("running");
      else if (m === "gameover" || m === "win") args.resetGame(1);
    }

    if (e.key.toLowerCase() === "p") {
      args.setMode((cur) => (cur === "running" ? "paused" : cur === "paused" ? "running" : cur));
    }

    if (e.key.toLowerCase() === "r") args.resetGame(1);
  };

  const up = (e: KeyboardEvent) => {
    const s = args.sRef.current;
    if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") s.left = false;
    if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") s.right = false;
  };

  window.addEventListener("keydown", down, { passive: false });
  window.addEventListener("keyup", up);

  return () => {
    window.removeEventListener("keydown", down as any);
    window.removeEventListener("keyup", up);
  };
}
