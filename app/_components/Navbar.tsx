"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { glass, cn } from "../_styles/glass";

type NavKey = "home" | "about" | "resume" | "games";

// These sections live on the landing page as full-page scroll panels.
// Even when you're on a nested route (e.g. /games/tetris), clicking nav jumps back to the landing page + anchor.
const items: Array<{ key: NavKey; name: string; href: string }> = [
  { key: "home", name: "Home", href: "/#home" },
  { key: "about", name: "About", href: "/#about" },
  { key: "games", name: "Games", href: "/#games" },
  { key: "resume", name: "Resume", href: "/#resume" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [activeKey, setActiveKey] = useState<NavKey>(() => (pathname === "/" ? "home" : "home"));

  const [menuOpen, setMenuOpen] = useState(false);
  // NOTE: Dropdown is portaled to <body> so its backdrop-filter samples the real page behind it,
  // instead of the navbar glass surface (which makes the blur look "broken").
  const menuRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Removed duplicate declaration of portalReady
  const [isMobilePortrait, setIsMobilePortrait] = useState(false);
  const [isMobileLandscape, setIsMobileLandscape] = useState(false);

  // ✅ measure: dropdown width should "hug" the widest tab label (+ small padding),
  // and auto-update if you add longer tabs later.
  const [dropdownW, setDropdownW] = useState<number | null>(null);

  const [portalReady, setPortalReady] = useState(false);
  const [ddPos, setDdPos] = useState<{ top: number; left: number; width: number } | null>(null);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px) and (orientation: portrait)");
    const update = () => setIsMobilePortrait(!!mq.matches);
    update();

    // Safari/iOS: use both change + orientationchange
    mq.addEventListener?.("change", update);
    window.addEventListener("orientationchange", update);
    window.addEventListener("resize", update);

    return () => {
      mq.removeEventListener?.("change", update);
      window.removeEventListener("orientationchange", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  // Mobile landscape: move navbar to a right sidebar and keep the menu always visible.
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px) and (orientation: landscape)");
    const update = () => setIsMobileLandscape(!!mq.matches);
    update();

    mq.addEventListener?.("change", update);
    window.addEventListener("orientationchange", update);
    window.addEventListener("resize", update);

    return () => {
      mq.removeEventListener?.("change", update);
      window.removeEventListener("orientationchange", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  // When we're on the landing page ("/"), highlight by current snapped section.
  useEffect(() => {
    if (pathname !== "/") return;

    const onSection = (e: Event) => {
      const ce = e as CustomEvent<{ id?: string; key?: NavKey }>;
      const key = ce.detail?.key;
      if (key) setActiveKey(key);
    };

    window.addEventListener("fullpagescroll:section", onSection as any);
    return () => window.removeEventListener("fullpagescroll:section", onSection as any);
  }, [pathname]);

  // On other routes, highlight by pathname.
  useEffect(() => {
    if (pathname === "/") return;
    if (pathname.startsWith("/games")) {
      setActiveKey("games");
      return;
    }
    setActiveKey("home");
  }, [pathname]);

  const linkItems = useMemo(() => {
    return items.map((i) => ({
      ...i,
      active: i.key === activeKey,
    }));
  }, [activeKey]);

  const routeKey: NavKey = useMemo(() => {
    if (pathname.startsWith("/about")) return "about";
    if (pathname.startsWith("/resume")) return "resume";
    if (pathname.startsWith("/games")) return "games";
    return "home";
  }, [pathname]);

  const displayKey: NavKey = pathname === "/" ? activeKey : routeKey;

  const displayName = useMemo(() => {
    return items.find((i) => i.key === displayKey)?.name ?? "Home";
  }, [displayKey]);

  // ✅ Mobile dropdown: show ALL tabs
  const menuItems = useMemo(() => items, []);

  const goTo = (key: NavKey) => {
    const href = items.find((i) => i.key === key)?.href ?? "/#home";
    setMenuOpen(false);

    // If we're not on the landing page, jump back to it.
    if (pathname !== "/") {
      window.location.href = href;
      return;
    }
    window.dispatchEvent(new CustomEvent("fullpagescroll:go", { detail: { key } }));
  };

  // Close on outside tap / ESC
  useEffect(() => {
    if (isMobileLandscape) return; // sidebar mode: menu stays visible
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen, isMobileLandscape]);

  // ✅ measure widest tab label in the CURRENT font-size so dropdown fits tightly.
  useEffect(() => {
    if (!isMobilePortrait || isMobileLandscape) {
      setDropdownW(null);
      return;
    }

    const measure = () => {
      const el = document.createElement("span");
      el.style.position = "fixed";
      el.style.left = "-9999px";
      el.style.top = "0";
      el.style.visibility = "hidden";
      el.style.whiteSpace = "nowrap";
      el.style.fontSize = "14px";
      el.style.fontWeight = "500";
      el.style.fontFamily = "inherit";

      document.body.appendChild(el);

      let max = 0;
      for (const it of items) {
        el.textContent = it.name;
        const w = Math.ceil(el.getBoundingClientRect().width);
        if (w > max) max = w;
      }

      document.body.removeChild(el);

      const horizontalPadding = 24;
      const containerPadding = 16;
      setDropdownW(max + horizontalPadding + containerPadding);
    };

    const raf = requestAnimationFrame(measure);

    const onResize = () => requestAnimationFrame(measure);
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, [isMobilePortrait, isMobileLandscape, menuOpen]);

  // ✅ Position dropdown in viewport coordinates for portal rendering.
  useEffect(() => {
    if (!isMobilePortrait || isMobileLandscape) {
      setDdPos(null);
      return;
    }
    if (!menuOpen) {
      setDdPos(null);
      return;
    }

    const compute = () => {
      const btn = buttonRef.current;
      if (!btn) return;

      const r = btn.getBoundingClientRect();
      const width = dropdownW ?? Math.ceil(r.width);
      const gutter = 10;
      const leftRaw = Math.round(r.right - width);
      const left = Math.max(gutter, Math.min(leftRaw, window.innerWidth - gutter - width));
      const top = Math.round(r.bottom + 12); // mt-3

      setDdPos({ top, left, width });
    };

    compute();
    const onResize = () => compute();
    // scroll can change the button's position relative to viewport
    const onScroll = () => compute();

    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    window.addEventListener("scroll", onScroll, true);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [menuOpen, isMobilePortrait, isMobileLandscape, dropdownW]);

  // Sidebar mode: close any previously open portrait dropdown
  useEffect(() => {
    if (isMobileLandscape) setMenuOpen(false);
  }, [isMobileLandscape]);

  // ✅ Mobile landscape: fixed right sidebar, always-visible menu
  if (isMobileLandscape) {
    return (
      <aside
        className={cn(
          "fixed top-0 bottom-0 right-0 z-50 flex flex-col",
          glass.navRail,
          "border-l border-white/25"
        )}
        style={{ width: "var(--nav-w)", paddingRight: "env(safe-area-inset-right, 0px)" }}
      >
        <div className="px-4 pt-5 pb-3">
          <Link href="/" className="font-semibold text-sm text-black">
            Dongjue Xie
          </Link>
        </div>

        <div className="px-3 pb-5 overflow-auto">
          <div className={glass.navShell}>
            <div className="p-2">
              {menuItems.map((it) => {
                const isActive = it.key === displayKey;
                return (
                  <button
                    key={it.key}
                    type="button"
                    onClick={() => (isActive ? undefined : goTo(it.key))}
                    className={cn(glass.navItem, isActive && glass.navItemActive)}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <span className="relative inline-flex flex-col items-center text-sm font-medium text-black/90 whitespace-nowrap">
                      {it.name}
                      <span
                        className={
                          "mt-0.5 h-[2px] w-full bg-black transition-opacity duration-200 " +
                          (isActive ? "opacity-100" : "opacity-0")
                        }
                      />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <header className={cn("fixed left-0 right-0 top-0 z-50", glass.navRail, "border-b border-white/25")}>
      <div className="mx-auto max-w-[1200px] px-8 py-5">
        <nav className={`flex items-center ${isMobilePortrait ? "justify-between" : "gap-12"}`}>
          {/* Name */}
          <Link href="/" className="font-semibold text-sm text-black">
            Dongjue Xie
          </Link>

          {/* Nav links */}
          {!isMobilePortrait ? (
            <div className="flex gap-10">
              {linkItems.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className={
                    "relative text-sm font-medium text-black/80 hover:text-black transition" +
                    (item.active ? " text-black" : "")
                  }
                >
                  {item.name}
                  <span
                    className={
                      "pointer-events-none absolute left-0 -bottom-1 h-[2px] w-full bg-black transition-opacity duration-200 " +
                      (item.active ? "opacity-100" : "opacity-0")
                    }
                  />
                </Link>
              ))}
            </div>
          ) : (
            <div className="relative inline-block" ref={menuRef}>
              <button
                ref={buttonRef}
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="text-sm font-semibold text-black/90 hover:text-black transition whitespace-nowrap"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label="Open section menu"
              >
                {displayName}
              </button>

              {/* Dropdown: PORTAL to body so blur samples the real page behind it */}
              {portalReady && menuOpen && ddPos
                ? createPortal(
                    <div className="fixed inset-0 z-[9999]" role="presentation">
                      {/* click-outside overlay */}
                      <div
                        className="absolute inset-0"
                        onPointerDown={() => setMenuOpen(false)}
                        aria-hidden="true"
                      />

                      {/* menu */}
                      <div
                        ref={dropdownRef}
                        className="fixed"
                        style={{ top: ddPos.top, left: ddPos.left, width: ddPos.width }}
                        role="menu"
                        onPointerDown={(e) => e.stopPropagation()}
                      >
                        {/* iOS Safari: keep transforms off the actual glass surface */}
                        <div className="transition-all duration-200 origin-top-right opacity-100 translate-y-0">
                          <div className={glass.navShell}>
                            <div className="p-2">
                              {menuItems.map((it) => {
                                const isActive = it.key === displayKey;

                                return (
                                  <button
                                    key={it.key}
                                    type="button"
                                    onClick={() => (isActive ? setMenuOpen(false) : goTo(it.key))}
                                    className={cn(glass.navItem, isActive && glass.navItemActive)}
                                    role="menuitem"
                                    aria-current={isActive ? "page" : undefined}
                                  >
                                    <span className="relative inline-flex flex-col items-center text-sm font-medium text-black/90 whitespace-nowrap">
                                      {it.name}
                                      <span
                                        className={
                                          "mt-0.5 h-[2px] w-full bg-black transition-opacity duration-200 " +
                                          (isActive ? "opacity-100" : "opacity-0")
                                        }
                                      />
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>,
                    document.body
                  )
                : null}
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
