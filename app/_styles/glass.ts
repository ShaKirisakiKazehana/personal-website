// Centralized iOS-style “glass / frosted” design tokens for the whole site.
//
// This file is intentionally the single source of truth for the “milky glass” language.
// iOS Safari can be picky about backdrop-filter, so we pair these tokens with a global
// `.glass` class in app/globals.css that applies BOTH `backdrop-filter` and
// `-webkit-backdrop-filter` using CSS variables.
//
// Usage:
//   import { glass, cn } from "../_styles/glass";
//   <div className={cn(glass.card, "p-6")}>...</div>

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

// ===== Primitives =====
const rSm = "rounded-xl";
const rMd = "rounded-2xl";
const rLg = "rounded-3xl";

// IMPORTANT: `.glass` (defined in globals.css) reads `--glass-bdf`
const glassBase = "glass";

// iOS-like “materials”: low-opacity white layers (not thick white blocks)
const bg = "bg-white/35";
const bgSoft = "bg-white/25";
const bgStrong = "bg-white/45";
const bgModal = "bg-white/55";

// Borders: iOS glass uses highlight borders (whiter) more than dark borders
const border = "border border-white/30";
const borderSoft = "border border-white/20";
const borderHair = "border border-white/15";

// Shadows: soft, large, low-contrast
const shadow = "shadow-[0_10px_30px_rgba(0,0,0,0.08)]";
const shadowElev = "shadow-[0_18px_60px_rgba(0,0,0,0.12)]";

// Backdrop recipes (CSS variables consumed by `.glass`)
const blur = "[--glass-bdf:blur(18px)_saturate(160%)]";
const blurStrong = "[--glass-bdf:blur(28px)_saturate(180%)_contrast(120%)]";

// Dark glass helpers (for game canvases / dark UI)
const bgDark = "bg-black/25";
const borderDark = "border border-white/15";
const hoverDark = "hover:bg-black/30 active:bg-black/35";
const blurDark = "[--glass-bdf:blur(18px)_saturate(140%)]";

export const glass = {
  // Containers
  header: cn(bgStrong, glassBase, blur, "border-b border-white/25"),
  sidebar: cn(bg, glassBase, blur, border, rMd, shadow),

  // Surfaces
  panel: cn(bg, glassBase, blur, border, rMd),
  panelSoft: cn(bgSoft, glassBase, blur, borderSoft, rMd),
  panelStrong: cn(bgStrong, glassBase, blur, "border-b border-white/25"),
  modal: cn(bgModal, glassBase, blurStrong, border, rLg, shadowElev),

  // Cards
  card: cn(bg, glassBase, blur, border, rMd, shadow),
  cardTight: cn(bg, glassBase, blur, border, rMd),
  cardLg: cn(bgStrong, glassBase, blur, border, rLg, shadow),

  // Interactive list item (e.g., Resume sections)
  item: cn(rMd, "transition", "border border-transparent"),
  itemHover: cn("hover:bg-white/30", glassBase, blurStrong, "hover:border-white/25"),
  itemActive: cn("bg-white/40", glassBase, blurStrong, "border border-white/35", "text-neutral-900", shadow),

  // Pills / buttons
  pill: cn("rounded-full", "transition", borderSoft, bg, glassBase, blur, shadow),
  // iOS-style: avoid harsh black hover; subtle brightening is nicer
  pillHoverDark: cn("hover:bg-white/45", "active:bg-white/50"),
  pillGhost: cn("rounded-full", "transition", borderHair, "bg-white/20", glassBase, blur),

  // Chips
  chip: cn("rounded-full", "px-2 py-1", "text-xs", "border border-white/25", "bg-white/20", glassBase, blur),
  chipSoft: cn("rounded-full", "px-3 py-1", "text-sm", "bg-white/25", glassBase, blur, "border border-white/20", "text-neutral-900"),

  // Dots
  dot: "h-2 w-2 rounded-full",
  dotOn: "bg-neutral-900",
  dotOff: "bg-neutral-400/60",

  // Dark-glass helpers (for game UIs)
  darkCard: cn(rMd, borderDark, bgDark, glassBase, blurDark),
  darkPill: cn("rounded-full", borderDark, bgDark, glassBase, blurDark, hoverDark),

  // Navbar / dropdown shells (dropdown should be “most glassy”)
  navRail:cn(bg, glassBase, blur, border, shadow),

  navShell: cn(bg, glassBase, blur, border, rMd, shadow),
  navItem: cn("relative w-full rounded-xl py-2 text-center transition", "hover:bg-white/22", "active:bg-white/28"),
  navItemActive: cn("bg-white/26", "border border-white/20"),

  // Radii exports (optional)
  rSm,
  rMd,
  rLg,
};
