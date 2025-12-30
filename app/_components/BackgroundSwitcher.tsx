"use client";

import React, { useEffect, useState } from "react";

// These two background effects are assumed to already exist in your repo
// under /components (based on your current imports).
import MatrixRainBg from "@/components/MatrixRainBg";
import CodeFloatBg from "@/components/CodeFloatBg";

type BgMode = "matrix" | "code";

/**
 * Global background switcher for the landing page.
 * - When the active snap section is #about -> use CodeFloatBg
 * - Otherwise -> use MatrixRainBg
 */
export default function BackgroundSwitcher() {
  const [mode, setMode] = useState<BgMode>("matrix");

  useEffect(() => {
    const onSection = (e: Event) => {
      const ce = e as CustomEvent<{ id?: string; key?: string }>;
      const key = ce.detail?.key || ce.detail?.id || "home";
      setMode(key === "about" ? "code" : "matrix");
    };

    window.addEventListener("fullpagescroll:section", onSection as any);
    return () => window.removeEventListener("fullpagescroll:section", onSection as any);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      {/* Matrix rain (default) */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 ${
          mode === "matrix" ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden
      >
        <MatrixRainBg
          opacity={0.14}
          fontSize={16}
          columnWidth={28}
          speed={0.2}
          enableOnMobile={true}
          highlightHead={true}
        />
      </div>

      {/* Code float background (About section) */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 ${
          mode === "code" ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden
      >
        <CodeFloatBg tone="strong" />
      </div>
    </div>
  );
}
