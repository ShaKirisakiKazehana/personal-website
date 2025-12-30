"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

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

  return (
    <header className="fixed left-0 right-0 top-0 z-50 bg-white/85 backdrop-blur border-b border-black/10">
      <div className="mx-auto max-w-[1200px] px-8 py-5">
        <nav className="flex items-center gap-12">
          {/* Name */}
          <Link href="/" className="font-semibold text-sm text-black">
            Dongjue Xie
          </Link>

          {/* Nav links */}
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
        </nav>
      </div>
    </header>
  );
}
