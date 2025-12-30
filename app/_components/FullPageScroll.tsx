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
  const activeIndexRef = useRef(0);

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

  function setActiveIndex(idx: number) {
    const el = containerRef.current;
    if (!el) return;
    const list = Array.from(el.querySelectorAll(sectionSelector)) as HTMLElement[];
    if (!list.length) return;

    const clamped = Math.max(0, Math.min(list.length - 1, idx));
    activeIndexRef.current = clamped;

    for (let i = 0; i < list.length; i++) {
      list[i].setAttribute("data-index", String(i));
      list[i].setAttribute("data-active", i === clamped ? "true" : "false");
    }

    // Notify navbar (and any other listeners) which section is active.
    const activeEl = list[clamped];
    const id = activeEl?.id || undefined;
    const key = (activeEl?.getAttribute("data-section") as any) || undefined;
    window.dispatchEvent(new CustomEvent("fullpagescroll:section", { detail: { id, key } }));
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

    // Initialize attributes and keep active section updated for per-page effects.
    setActiveIndex(getActiveIndex());
    const sections = Array.from(el.querySelectorAll(sectionSelector)) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        // Pick the most visible section.
        let bestIdx = activeIndexRef.current;
        let bestRatio = 0;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const target = entry.target as HTMLElement;
          const idxStr = target.getAttribute("data-index");
          const idx = idxStr ? Number(idxStr) : sections.indexOf(target);
          if (entry.intersectionRatio > bestRatio) {
            bestRatio = entry.intersectionRatio;
            bestIdx = idx;
          }
        }
        setActiveIndex(bestIdx);
      },
      { root: el, threshold: [0.55, 0.65, 0.75, 0.85] }
    );
    for (const s of sections) io.observe(s);

    const scrollToHash = () => {
      const raw = window.location.hash || "";
      const hash = raw.startsWith("#") ? raw.slice(1) : raw;
      if (!hash) return;

      const list = Array.from(el.querySelectorAll(sectionSelector)) as HTMLElement[];
      const targetIdx = list.findIndex((s) => s.id === hash);
      if (targetIdx >= 0) {
        scrollToIndex(targetIdx);
        setActiveIndex(targetIdx);
      }
    };

    // Initial hash (e.g. open /#about)
    scrollToHash();

    // Hash navigation (navbar links on landing page)
    window.addEventListener("hashchange", scrollToHash);


    const onWheel = (e: WheelEvent) => {
      // If the user is interacting with an embedded widget/game, don't hijack scrolling.
      const target = e.target as HTMLElement | null;
      if (target?.closest?.("[data-no-snap]")) return;

      // Let trackpads do natural scrolling when user scrolls mostly horizontally.
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;

      // Ignore tiny deltas (some devices emit small continuous values).
      if (Math.abs(e.deltaY) < 12) return;

      e.preventDefault();
      step(e.deltaY > 0 ? 1 : -1);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      // Don't hijack keys when focus is inside an embedded widget/game.
      const t = e.target as HTMLElement | null;
      if (t?.closest?.("[data-no-snap]")) return;

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
      const target = e.target as HTMLElement | null;
      if (target?.closest?.("[data-no-snap]")) {
        touchStartYRef.current = null;
        touchStartXRef.current = null;
        return;
      }
      const t = e.touches[0];
      touchStartYRef.current = t?.clientY ?? null;
      touchStartXRef.current = t?.clientX ?? null;
    };

    const onTouchEnd = (e: TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest?.("[data-no-snap]")) return;

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
      io.disconnect();
      el.removeEventListener("wheel", onWheel as any);
      window.removeEventListener("keydown", onKeyDown as any);
      el.removeEventListener("touchstart", onTouchStart as any);
      el.removeEventListener("touchend", onTouchEnd as any);
      window.removeEventListener("hashchange", scrollToHash as any);
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
