import type { Mode } from "../lib/types";

export function bindKeyboard(args: {
  modeRef: React.MutableRefObject<Mode>;
  setMode: (m: Mode | ((m: Mode) => Mode)) => void;
  reset: () => void;
  move: (dx: number) => void;
  rotate: () => void;
  rotateCCW: () => void;
  hardDrop: () => void;
  setSoft: (v: boolean) => void;
}) {
  const down = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement | null;
    const tag = target?.tagName?.toLowerCase();
    if (tag === "input" || tag === "textarea" || (target as any)?.isContentEditable) return;

    const m = args.modeRef.current;

    if (["ArrowLeft", "ArrowRight", "ArrowDown", " "].includes(e.key)) e.preventDefault();

    if (e.key === " " || e.key === "Enter") {
      if (m === "idle") args.setMode("running");
      else if (m === "paused") args.setMode("running");
      else if (m === "running") args.hardDrop();
      else if (m === "gameover") args.reset();
      return;
    }

    if (e.key.toLowerCase() === "p") {
      args.setMode((cur) => (cur === "running" ? "paused" : cur === "paused" ? "running" : cur));
      return;
    }

    if (e.key.toLowerCase() === "r") {
      args.reset();
      return;
    }

    if (m !== "running") return;

    if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") args.move(-1);
    if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") args.move(1);
    if (e.key === "ArrowUp" || e.key.toLowerCase() === "w") args.rotate();
    if (e.key.toLowerCase() === "q") args.rotateCCW();
    if (e.key === "ArrowDown" || e.key.toLowerCase() === "s") args.setSoft(true);
  };

  const up = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key.toLowerCase() === "s") args.setSoft(false);
  };

  window.addEventListener("keydown", down, { passive: false });
  window.addEventListener("keyup", up);

  return () => {
    window.removeEventListener("keydown", down as any);
    window.removeEventListener("keyup", up);
  };
}
