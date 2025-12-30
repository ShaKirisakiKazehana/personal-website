"use client";

import { useEffect, useRef } from "react";

type MatrixRainBgProps = {
  /** 强度：越大越明显（默认 0.12，建议 0.08~0.18） */
  opacity?: number;
  /** 列密度：越小列越多（默认 18，建议 14~24） */
  columnWidth?: number;
  /** 字号（默认 14） */
  fontSize?: number;
  /** 速度倍率（默认 1.0） */
  speed?: number;
  /** 移动端是否启用（默认 false） */
  enableOnMobile?: boolean;
  /** 是否启用“头部亮点”(经典 Matrix 高亮头字符) */
  highlightHead?: boolean;

  /** 拖尾衰减强度：越大消失越快（默认 0.12，建议 0.08~0.18） */
  fadeAlpha?: number;

  /** 把接近透明的像素直接归零的阈值（0~255）。默认 10 */
  alphaKillThreshold?: number;

  /** 每隔多少帧做一次阈值清理（默认 8） */
  cleanupEveryNFrames?: number;

  /**
   * 行高倍率：竖向间距 = fontSize * lineHeight（默认 1.25）
   * 想“竖着更隔开”就调大：1.3~1.6
   */
  lineHeight?: number;

  /**
   * 是否启用“网格对齐”的下落（默认 true）：
   * 字会落在固定行距格点上，会更清晰、更像矩阵雨
   */
  snapToGrid?: boolean;
};

export default function MatrixRainBg({
  opacity = 0.12,
  columnWidth = 18,
  fontSize = 14,
  speed = 1.0,
  enableOnMobile = false,
  highlightHead = true,
  fadeAlpha = 0.12,
  alphaKillThreshold = 10,
  cleanupEveryNFrames = 8,
  lineHeight = 1.25,
  snapToGrid = true,
}: MatrixRainBgProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reducedMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
    if (reducedMotion) return;

    const isMobile = window.innerWidth < 768;
    if (isMobile && !enableOnMobile) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));

    // ---- Character set ----
    const katakana =
      "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンヴ";
    const hiragana =
      "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん";
    const kanji =
      "天地玄黄宇宙洪荒日月盈昃辰宿列张山川草木刀剣鍛冶国風花雪月光影幻影无极大道龍虎雷電心技体";
    const ascii =
      "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz@#$%&*+-=<>[]{}()/\\|;:.,!?";
    const cjkPunc = "「」『』（）【】《》〈〉。、・—…";
    const chars = (ascii + katakana + hiragana + kanji + cjkPunc).split("");
    const pickChar = () => chars[(Math.random() * chars.length) | 0];

    // Fonts
    const fontFamily =
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, " +
      '"Noto Sans Mono CJK JP", "Noto Sans JP", "Noto Sans SC", "PingFang SC", "Hiragino Sans", "Microsoft YaHei", monospace';

    let width = 0;
    let height = 0;

    let drops: number[] = [];
    let cols = 0;

    // 行距（竖向间隔）
    const rowStep = Math.max(8, Math.round(fontSize * lineHeight));

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;

      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // 更清晰：不要做图像平滑（对文字也能减少一些“糊感”）
      ctx.imageSmoothingEnabled = false;

      // 每次 resize 重新设置字体（确保一致）
      ctx.font = `${fontSize}px ${fontFamily}`;
      ctx.textBaseline = "top";

      cols = Math.max(1, Math.floor(width / columnWidth));

      // 让每列初始落点对齐网格（更整齐）
      drops = new Array(cols).fill(0).map(() => {
        const y = Math.random() * height;
        return snapToGrid ? Math.floor(y / rowStep) * rowStep : y;
      });

      ctx.clearRect(0, 0, width, height);
    };

    resize();
    window.addEventListener("resize", resize);

    // 速度：按“行”移动
    const rowsPerFrame = Math.max(0.5, 1.0 * speed); // 0.5~2.5 都挺自然
    const stepPerFrame = snapToGrid ? rowStep * rowsPerFrame : fontSize * 0.85 * speed;

    let frame = 0;

    const cleanupNearlyTransparentPixels = () => {
      if (cleanupEveryNFrames <= 0) return;
      frame++;
      if (frame % cleanupEveryNFrames !== 0) return;

      const img = ctx.getImageData(0, 0, width, height);
      const data = img.data;
      const thr = Math.max(0, Math.min(255, alphaKillThreshold));

      for (let i = 3; i < data.length; i += 4) {
        if (data[i] > 0 && data[i] <= thr) data[i] = 0;
      }
      ctx.putImageData(img, 0, 0);
    };

    const loop = () => {
      // 1) 拖尾衰减
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = `rgba(0, 0, 0, ${fadeAlpha})`;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      // 2) 阈值清理（无闪、彻底消残影）
      cleanupNearlyTransparentPixels();

      // 3) 画字（用 source-over，保证字边缘最清晰）
      ctx.globalCompositeOperation = "source-over";

      for (let i = 0; i < cols; i++) {
        const x = i * columnWidth;
        const y = drops[i];

        const char = pickChar();

        // 让 x/y 对齐整数像素，减少亚像素糊边
        const px = Math.round(x);
        const py = snapToGrid ? Math.round(y / rowStep) * rowStep : Math.round(y);

        ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
        ctx.fillText(char, px, py);

        if (highlightHead) {
          ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(0.42, opacity * 2.4)})`;
          ctx.fillText(char, px, py);
        }

        drops[i] = y + stepPerFrame;

        if (drops[i] > height + rowStep * 2) {
          if (Math.random() > 0.975) {
            const reset = -Math.random() * 300;
            drops[i] = snapToGrid ? Math.floor(reset / rowStep) * rowStep : reset;
          }
        }

        // 少量“活力”扰动，但保持网格感
        if (Math.random() < 0.01) {
          drops[i] += stepPerFrame * (Math.random() * 1.5);
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [
    opacity,
    columnWidth,
    fontSize,
    speed,
    enableOnMobile,
    highlightHead,
    fadeAlpha,
    alphaKillThreshold,
    cleanupEveryNFrames,
    lineHeight,
    snapToGrid,
  ]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
    />
  );
}
