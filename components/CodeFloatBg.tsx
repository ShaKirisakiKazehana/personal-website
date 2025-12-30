"use client";

import { useEffect, useRef } from "react";

type CodeFloatBgProps = {
  /** 手机端是否启用（默认 false） */
  enableOnMobile?: boolean;

  /**
   * 颜色强度：默认 "strong"
   * - "soft": 更淡灰
   * - "strong": 灰黑更明显（白底更清楚）
   */
  tone?: "soft" | "strong";
};

export default function CodeFloatBg({
  enableOnMobile = false,
  tone = "strong",
}: CodeFloatBgProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Respect reduced motion
    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;

    // Mobile off by default
    const isMobile = window.innerWidth < 768;
    if (isMobile && !enableOnMobile) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));

    const resize = () => {
      const { innerWidth: W, innerHeight: H } = window;
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ctx.imageSmoothingEnabled = false;
      // @ts-ignore
      ctx.textRendering = "geometricPrecision";
    };

    resize();
    window.addEventListener("resize", resize);

    // ====== Config ======
    const fontFamily =
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";

    const w = () => window.innerWidth;
    const h = () => window.innerHeight;

    // Keep center “quiet” so it won't fight your hero text
    const quietCenterRadius = () => Math.min(w(), h()) * 0.28;
    const centerX = () => w() / 2;
    const centerY = () => h() / 2;

    // 数量/生成频率（你想更多/更少就调这里）
    const maxCount = Math.floor(24 + (w() * h()) / 180000);
    const spawnEveryMs = 140;

    const fontSizeMin = 11;
    const fontSizeMax = 17;

    // 白底更清晰：透明度更高一些
    const alphaMin = tone === "strong" ? 0.16 : 0.12;
    const alphaMax = tone === "strong" ? 0.38 : 0.26;

    // 速度
    const speedMin = 0.12;
    const speedMax = 0.34;

    // 颜色：灰黑（不是纯黑，避免太抢）
    const ink = tone === "strong"
    ? "rgb(10,10,10)"
    : "rgb(45,45,45)";
    // ====================

    // ====== Code-ish vocab (C/C++ + a bit JS/General) ======
    const cKeywords = [
      "int",
      "char",
      "void",
      "float",
      "double",
      "long",
      "short",
      "signed",
      "unsigned",
      "struct",
      "typedef",
      "enum",
      "static",
      "extern",
      "const",
      "volatile",
      "sizeof",
      "return",
      "break",
      "continue",
      "switch",
      "case",
      "default",
      "if",
      "else",
      "for",
      "while",
      "do",
      "NULL",
      "true",
      "false",
    ];

    const cStd = [
      "printf",
      "scanf",
      "malloc",
      "calloc",
      "realloc",
      "free",
      "memcpy",
      "memset",
      "strlen",
      "strcmp",
      "strcpy",
      "fopen",
      "fclose",
      "fread",
      "fwrite",
      "EOF",
      "stderr",
      "stdin",
      "stdout",
    ];

    const preproc = [
      "#include <stdio.h>",
      "#include <stdlib.h>",
      "#define",
      "#ifdef",
      "#ifndef",
      "#endif",
      "#pragma",
    ];

    const ops = [
      "==",
      "!=",
      "<=",
      ">=",
      "&&",
      "||",
      "++",
      "--",
      "+=",
      "-=",
      "*=",
      "/=",
      "->",
      "<<",
      ">>",
      "&",
      "|",
      "^",
      "~",
      "!",
      ";",
      "{}",
      "[]",
      "()",
    ];

    const snippets = [
      "for(i=0;i<n;i++)",
      "while(ptr!=NULL)",
      "if(err!=0){return -1;}",
      "printf(\"%d\", x);",
      "return 0;",
      "x = (a*b) + c;",
      "p = malloc(n*sizeof(int));",
      "free(p);",
      "size_t len = strlen(s);",
      "switch(x){case 0:break;}",
      "/* TODO */",
      "// fixme",
    ];

    const glyphs =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_{}[]();<>/\\|+-=*:.,!?#@$%&";

    const pick = <T,>(arr: T[]) => arr[(Math.random() * arr.length) | 0];
    const rand = (min: number, max: number) => min + Math.random() * (max - min);

    const distance = (x1: number, y1: number, x2: number, y2: number) =>
      Math.hypot(x1 - x2, y1 - y2);

    const randomCodeText = () => {
      // 以“代码 token/片段”为主，少量字符点缀
      const r = Math.random();
      if (r < 0.24) return pick(cKeywords);
      if (r < 0.44) return pick(cStd) + "()";
      if (r < 0.56) return pick(preproc);
      if (r < 0.70) return pick(ops);
      if (r < 0.90) return pick(snippets);

      // 少量字符/短 token
      const g = glyphs;
      const t = Math.random();
      if (t < 0.6) return g[(Math.random() * g.length) | 0];
      return g[(Math.random() * g.length) | 0] + g[(Math.random() * g.length) | 0];
    };

    type Particle = {
      x: number;
      y: number;
      vy: number;
      text: string;
      size: number;
      alpha: number;
      life: number; // seconds
      age: number; // seconds
      wobble: number;
      swapAt: number; // next swap time
    };

    const particles: Particle[] = [];
    let lastTs = performance.now();
    let lastSpawn = performance.now();

    const spawn = () => {
      if (particles.length >= maxCount) return;

      for (let i = 0; i < 12; i++) {
        const x = rand(0, w());
        const y = rand(h() * 0.78, h() + 30);

        const inQuiet =
          distance(x, y - h() * 0.25, centerX(), centerY()) < quietCenterRadius();
        if (inQuiet) continue;

        particles.push({
          x,
          y,
          vy: rand(speedMin, speedMax),
          text: randomCodeText(),
          size: rand(fontSizeMin, fontSizeMax),
          alpha: rand(alphaMin, alphaMax),
          life: rand(6.0, 11.0),
          age: 0,
          wobble: rand(0.15, 0.55),
          swapAt: rand(0.9, 2.3),
        });
        return;
      }
    };

    const draw = (dt: number) => {
      ctx.clearRect(0, 0, w(), h());

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.age += dt;

        // 偶尔换一下内容（更像飘动的“代码碎片”）
        if (p.age >= p.swapAt) {
          p.swapAt += rand(1.0, 2.6);
          if (Math.random() < 0.55) p.text = randomCodeText();
        }

        // move up
        p.y -= p.vy * (dt * 60);
        p.x += Math.sin(p.age * 1.8) * p.wobble;

        // fade in/out
        const t = p.age / p.life;
        const fade = t < 0.15 ? t / 0.15 : t > 0.85 ? (1 - t) / 0.15 : 1;

        ctx.globalAlpha = p.alpha * Math.max(0, Math.min(1, fade));
        ctx.font = `${p.size}px ${fontFamily}`;
        ctx.fillStyle = ink;

        ctx.fillText(p.text, Math.round(p.x), Math.round(p.y));

        if (p.age >= p.life || p.y < -60) {
          particles.splice(i, 1);
        }
      }

      ctx.globalAlpha = 1;
    };

    const loop = (ts: number) => {
      const dt = Math.min(0.05, (ts - lastTs) / 1000);
      lastTs = ts;

      if (ts - lastSpawn >= spawnEveryMs) {
        lastSpawn = ts;
        spawn();
        if (Math.random() < 0.25) spawn(); // 偶尔双发，稍微更“活”
      }

      draw(dt);
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [enableOnMobile, tone]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10"
    />
  );
}
