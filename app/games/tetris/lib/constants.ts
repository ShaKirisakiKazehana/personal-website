import type { Cell } from "./types";

export const W = 10;
export const H = 20;
export const CELL = 24;

export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export const COLORS: Record<Cell, string> = {
  0: "rgba(0,0,0,0)",
  1: "rgba(110, 220, 255, 0.95)",
  2: "rgba(255, 235, 120, 0.95)",
  3: "rgba(190, 140, 255, 0.95)",
  4: "rgba(140, 255, 170, 0.95)",
  5: "rgba(255, 140, 160, 0.95)",
  6: "rgba(140, 180, 255, 0.95)",
  7: "rgba(255, 190, 120, 0.95)",
};
