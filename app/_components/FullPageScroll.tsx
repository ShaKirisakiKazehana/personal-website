"use client";

import React, { useEffect, useMemo, useRef } from "react";

type Props = {
  children: React.ReactNode;
  /** CSS selector used to find snap sections inside the container */
  sectionSelector?: string;
  /** Lock duration (ms) to avoid multiple scroll jumps per wheel gesture */
  lockMs?: number;
};

/**
 * Full-page scroll helper:
 * - Mouse wheel: one gesture -> next/prev section
 * - Touch: swipe up/down -> next/prev section
 *
 * Pair with CSS:
 *   .snap-container { scroll-snap-type: y mandatory; overflow-y:auto; height:100vh }
 *   .snap-section { min-height:100vh; scroll-snap-align:start }
 */
export default function FullPageScroll({
  children,
  sectionSelector = "[data-snap-section]",
  lockMs = 700,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lockedRef = useRef(false);
  const touchStartYRef = useRef<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);

  const sections = useMemo(() => {
    const el = containerRef.current;
    if (!el) return [] as HTMLElement[];
    return Array.from(el.querySelectorAll(sectionSelector)) as HTMLElement[];
  }, [sectionSelector]);

  function getActiveIndex(): number {
    const el = containerRef.current;
    if (!el) return 0;

    const list = Array.from(el.querySelectorAll(sectionSelector)) as HTMLElement[];
    if (!list.length) return 0;

    const mid = el.scrollTop + el.clientHeight / 2;
    let best = 0;
    let bestDist = Number.POSITIVE_INFINITY;
    for (let i = 0; i < list.length; i++) {
      const top = list[i].offsetTop;
      const dist = Math.abs(top - mid);
      if (dist < bestDist) {
        best = i;
        bestDist = dist;
      }
    }
    return best;
  }

  function scrollToIndex(nextIndex: number) {
    const el = containerRef.current;
    if (!el) return;
    const list = Array.from(el.querySelectorAll(sectionSelector)) as HTMLElement[];
    if (!list.length) return;

    const idx = Math.max(0, Math.min(list.length - 1, nextIndex));
    list[idx].scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function step(dir: 1 | -1) {
    if (lockedRef.current) return;
    lockedRef.current = true;
    window.setTimeout(() => {
      lockedRef.current = false;
    }, lockMs);

    const current = getActiveIndex();
    scrollToIndex(current + dir);
  }

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      // Let trackpads do natural scrolling when user scrolls mostly horizontally.
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;

      // Ignore tiny deltas (some devices emit small continuous values).
      if (Math.abs(e.deltaY) < 12) return;

      e.preventDefault();
      step(e.deltaY > 0 ? 1 : -1);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      // Only handle keys when focus isn't inside an input.
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || target?.isContentEditable) return;

      if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        step(1);
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        step(-1);
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      touchStartYRef.current = t?.clientY ?? null;
      touchStartXRef.current = t?.clientX ?? null;
    };

    const onTouchEnd = (e: TouchEvent) => {
      const startY = touchStartYRef.current;
      const startX = touchStartXRef.current;
      touchStartYRef.current = null;
      touchStartXRef.current = null;

      const t = e.changedTouches[0];
      if (startY == null || startX == null || !t) return;

      const dy = t.clientY - startY;
      const dx = t.clientX - startX;

      // Ignore mostly-horizontal swipes.
      if (Math.abs(dx) > Math.abs(dy)) return;

      // Threshold so small taps don't trigger.
      if (Math.abs(dy) < 50) return;

      step(dy < 0 ? 1 : -1);
    };

    // Wheel needs passive:false to allow preventDefault.
    el.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeyDown, { passive: false });
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("wheel", onWheel as any);
      window.removeEventListener("keydown", onKeyDown as any);
      el.removeEventListener("touchstart", onTouchStart as any);
      el.removeEventListener("touchend", onTouchEnd as any);
    };
  }, [lockMs, sectionSelector]);

  // NOTE: don't use `sections` directly in render (it reads DOM). It's here
  // so the component is easy to debug in dev tools if needed.
  void sections;

  return (
    <div ref={containerRef} className="snap-container">
      {children}
    </div>
  );
}
