"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { resumeCards, type ResumeCard } from "./resumeData";
import { glass, cn } from "../_styles/glass";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function ResumeDeck() {
  const cards = useMemo(() => resumeCards, []);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);

  // ✅ Mobile dropdown (Navbar-like)
  const [menuOpen, setMenuOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [ddPos, setDdPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  // Swipe tracking
  const touchRef = useRef<{
    x0: number;
    y0: number;
    t0: number;
    scrollY0: number;
    lockedHoriz: boolean;
    dragging: boolean;
  } | null>(null);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  const goTo = (idx: number) => {
    setMenuOpen(false);
    setActive(clamp(idx, 0, cards.length - 1));
  };
  const prev = () => goTo(activeRef.current - 1);
  const next = () => goTo(activeRef.current + 1);

  // ✅ Close dropdown when clicking outside (button + portaled panel)
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (!menuOpen) return;
      const t = e.target as Node;
      if (buttonRef.current?.contains(t)) return;
      if (panelRef.current?.contains(t)) return;
      setMenuOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [menuOpen]);

  // ✅ Position dropdown (portaled to <body>) so backdrop-filter samples the real page, not the sticky header.
  useEffect(() => {
    if (!menuOpen) {
      setDdPos(null);
      return;
    }
    const el = buttonRef.current;
    if (!el) return;

    const r = el.getBoundingClientRect();
    // Keep it aligned to the button's right edge.
    const width = Math.min(Math.max(240, Math.ceil(r.width)), 320);
    const left = Math.round(r.right - width);
    const top = Math.round(r.bottom + 12);
    setDdPos({ top, left, width });
  }, [menuOpen]);

  // ✅ Keep dropdown aligned on scroll/resize while open
  useEffect(() => {
    if (!menuOpen) return;
    const update = () => {
      const el = buttonRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const width = ddPos?.width ?? Math.min(Math.max(240, Math.ceil(r.width)), 320);
      const left = Math.round(r.right - width);
      const top = Math.round(r.bottom + 12);
      setDdPos({ top, left, width });
    };

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, [menuOpen, ddPos?.width]);

  // ✅ ESC to close
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  // ✅ Keyboard navigation (ArrowLeft/ArrowRight)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();

      if (tag === "input" || tag === "textarea" || target?.isContentEditable) return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      }
    };

    window.addEventListener("keydown", onKeyDown, { passive: false });
    return () => window.removeEventListener("keydown", onKeyDown as any);
  }, [cards.length]);

  // ✅ Keep current card on rotate/resize
  useEffect(() => {
    let t: number | null = null;
    const keep = () => {
      if (t) window.clearTimeout(t);
      t = window.setTimeout(() => {
        setActive((x) => clamp(x, 0, cards.length - 1));
      }, 120);
    };
    window.addEventListener("resize", keep);
    window.addEventListener("orientationchange", keep);
    return () => {
      window.removeEventListener("resize", keep);
      window.removeEventListener("orientationchange", keep);
      if (t) window.clearTimeout(t);
    };
  }, [cards.length]);

  // ✅ Touch swipe (mobile) with vertical lock to reduce page jumping
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchRef.current = {
      x0: t.clientX,
      y0: t.clientY,
      t0: Date.now(),
      scrollY0: typeof window !== "undefined" ? window.scrollY : 0,
      lockedHoriz: false,
      dragging: true,
    };
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const st = touchRef.current;
    if (!st?.dragging) return;

    const t = e.touches[0];
    const dx = t.clientX - st.x0;
    const dy = t.clientY - st.y0;

    const looksHorizontal = Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.15;
    if (looksHorizontal) st.lockedHoriz = true;

    if (st.lockedHoriz) {
      e.preventDefault();
      if (typeof window !== "undefined") window.scrollTo({ top: st.scrollY0, behavior: "auto" });
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const st = touchRef.current;
    touchRef.current = null;
    if (!st) return;

    const t = e.changedTouches[0];
    const dx = t.clientX - st.x0;
    const dt = Date.now() - st.t0;

    const swipe = Math.abs(dx) > 45 || (Math.abs(dx) > 22 && dt < 220);
    if (!swipe) return;

    if (dx > 0) prev();
    else next();
  };

  return (
    <div className="w-full overflow-x-hidden">
      <div className={cn("sticky top-0 z-20", glass.header)}>
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 md:px-8 py-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-lg font-semibold text-neutral-900">Resume</div>
            <div className="text-xs text-neutral-500">
              {active + 1} / {cards.length} · ← / → 切换 · Mobile swipe
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* ✅ Mobile: Navbar-like dropdown showing current section */}
            <div className="md:hidden relative">
              <button
                ref={buttonRef}
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className={cn(
                  "text-sm font-semibold text-black/90 hover:text-black transition",
                  "max-w-[52vw] truncate"
                )}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label="Open resume section menu"
              >
                {cards[active]?.title ?? "Sections"}
              </button>

              {/* Dropdown: PORTAL to body so blur samples the real page behind it (not this sticky header). */}
              {portalReady && menuOpen && ddPos
                ? createPortal(
                    <>
                      {/* click-outside overlay */}
                      <div className="fixed inset-0 z-[9998]" onClick={() => setMenuOpen(false)} aria-hidden="true" />

                      <div
                        className="fixed z-[9999]"
                        style={{ top: ddPos.top, left: ddPos.left, width: ddPos.width }}
                        role="menu"
                      >
                        {/* Keep transforms on an outer wrapper; keep the actual glass surface un-transformed. */}
                        <div className="transition-all duration-200 origin-top-right opacity-100 translate-y-0">
                          <div ref={panelRef} className={cn(glass.navShell, "p-2 max-h-72 overflow-auto")}>
                            {cards.map((c, idx) => {
                              const isActive = idx === active;
                              return (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => {
                                    if (!isActive) goTo(idx);
                                    setMenuOpen(false);
                                  }}
                                  className={cn(glass.navItem, isActive && glass.navItemActive)}
                                  role="menuitem"
                                  aria-current={isActive ? "page" : undefined}
                                >
                                  <span className="relative inline-flex flex-col items-center text-sm font-medium text-black/90 whitespace-nowrap">
                                    {c.title}
                                    <span
                                      className={cn(
                                        "mt-0.5 h-[2px] w-full bg-black transition-opacity duration-200",
                                        isActive ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </>,
                    document.body
                  )
                : null}
            </div>

            <a href="/resume.pdf" target="_blank" rel="noreferrer" className="text-sm text-neutral-600 hover:text-neutral-900">
              PDF ↗
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 md:px-8 py-6">
        <div className="grid gap-6 md:grid-cols-[260px_1fr] items-start">
          <aside className="hidden md:block">
            <div className="sticky top-[88px]">
              <div className={cn(glass.sidebar, "p-3")}>
                <div className="text-xs font-medium text-neutral-600 px-2 pb-2">Sections</div>
                <div className="flex flex-col">
                  {cards.map((c, idx) => (
                    <button
                      key={c.id}
                      onClick={() => goTo(idx)}
                      className={cn(
                        glass.item,
                        "text-left px-2 py-2 text-sm",
                        idx === active ? glass.itemActive : "text-neutral-900",
                        glass.itemHover
                      )}
                    >
                      {c.title}
                      {"subtitle" in c && c.subtitle ? (
                        <div className={idx === active ? "text-neutral-700 text-xs" : "text-neutral-700/80 text-xs"}>
                          {c.subtitle}
                        </div>
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <main>
            <div
              className={cn("relative overflow-hidden overscroll-contain", "select-none")}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              style={{ touchAction: "pan-y" }}
            >
              <div className="flex transition-transform duration-300 ease-out" style={{ transform: `translateX(${-active * 100}%)` }}>
                {cards.map((card) => (
                  <div key={card.id} className="w-full shrink-0">
                    <div className="w-full max-w-[780px]">
                      <CardView card={card} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden md:flex items-center justify-between mt-4 max-w-[780px]">
                <button
                  onClick={prev}
                  disabled={active === 0}
                  className={cn(glass.pill, "px-4 py-2 text-sm font-medium disabled:opacity-40", glass.pillHoverDark)}
                >
                  ← Prev
                </button>
                <button
                  onClick={next}
                  disabled={active === cards.length - 1}
                  className={cn(glass.pill, "px-4 py-2 text-sm font-medium disabled:opacity-40", glass.pillHoverDark)}
                >
                  Next →
                </button>
              </div>

              <div className="mt-4 flex items-center gap-2 md:hidden">
                {cards.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className={cn(glass.dot, i === active ? glass.dotOn : glass.dotOff)}
                    aria-label={`Go to card ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function CardView({ card }: { card: ResumeCard }) {
  return (
    <div className={cn(glass.card, "p-6")}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xl font-semibold text-neutral-900">{card.title}</div>
          {"subtitle" in card && card.subtitle ? <div className="mt-1 text-sm text-neutral-700/80">{card.subtitle}</div> : null}
        </div>

        {"tags" in card && card.tags?.length ? (
          <div className="flex flex-wrap gap-2 justify-end">
            {card.tags.map((t) => (
              <span key={t} className={cn(glass.chip, "text-neutral-900")}>
                {t}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {"groups" in card ? (
        <div className="mt-5 space-y-4">
          {card.groups.map((g) => (
            <div key={g.label}>
              <div className="text-xs font-medium text-neutral-700/80">{g.label}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {g.items.map((it) => (
                  <span key={it} className={glass.chipSoft}>
                    {it}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <ul className="mt-5 space-y-2 text-sm text-neutral-900">
          {card.bullets.map((b, i) => (
            <li key={i} className="leading-relaxed">
              <span className="mr-2 text-neutral-700/70">•</span>
              {b}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
