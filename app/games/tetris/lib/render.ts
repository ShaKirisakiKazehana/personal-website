import type { GameState, Cell, Mode } from "./types";
import { W, H, COLORS, clamp } from "./constants";
import { PIECES } from "./pieces";
import { collides, getBlocks } from "./mechanics";

type Viewport = { w: number; h: number };

function colorForPieceType(t: unknown): string {
  const direct = (COLORS as any)[t as any];
  if (typeof direct === "string") return direct;

  const maybePiece = (PIECES as any)[t as any];
  const pieceColorKey = maybePiece?.color;
  const viaPiece = (COLORS as any)[pieceColorKey as any];
  if (typeof viaPiece === "string") return viaPiece;

  // Fallback: if COLORS itself is already a color map of strings, return a safe neutral.
  return "rgba(255,255,255,0.45)";
}

function computeLayout(view: Viewport) {
  // Dynamic layout that prioritizes using available space (BrickBreaker-style):
  // 1) Prefer side panel when possible (landscape / enough width).
  // 2) Fall back to stacked panel (portrait / narrow).
  const d = {
    minCell: 12,
    maxCell: 40,
    panelFactor: 7.5, // panel width ~= 7.5 * cell
    padFactor: 0.75, // padding ~= 0.75 * cell
  };

  const fitsSide = (cell: number) => {
    const p = Math.round(cell * d.padFactor);
    const pw = Math.round(cell * d.panelFactor);
    const needW = W * cell + pw + p * 3; // left pad + gap + right pad
    const needH = H * cell + p * 2;
    return needW <= view.w && needH <= view.h;
  };

  const fitsStacked = (cell: number) => {
    const p = Math.round(cell * d.padFactor);
    const panelH = Math.max(
      Math.round(cell * 7.5),
      Math.min(220, Math.floor(view.h * 0.32))
    );
    const needW = W * cell + p * 2;
    const needH = H * cell + panelH + p * 3;
    return needW <= view.w && needH <= view.h;
  };

  // Try side layout by searching the largest cell that fits.
  // Heuristic: if the viewport is reasonably wide, strongly prefer side.
  const wideEnough = view.w / Math.max(1, view.h) >= 1.05 || view.w >= 520;

  if (wideEnough) {
    for (let cell = d.maxCell; cell >= d.minCell; cell--) {
      if (!fitsSide(cell)) continue;

      const p = Math.round(cell * d.padFactor);
      const pw = Math.round(cell * d.panelFactor);

      const fieldW = W * cell;
      const fieldH = H * cell;

      const totalW = fieldW + pw + p * 3; // left pad + gap + right pad
      let startX = Math.floor((view.w - totalW) / 2);
      startX = Math.max(p, startX);

      const fieldX = startX + p;
      let fieldY = Math.floor((view.h - fieldH) / 2);
      fieldY = Math.max(p, fieldY);

      const panelX = fieldX + fieldW + p;
      const panelY = fieldY;

      return {
        stacked: false as const,
        cell,
        pad: p,
        fieldX,
        fieldY,
        fieldW,
        fieldH,
        panelX,
        panelY,
        panelW: pw,
        panelH: fieldH,
      };
    }
  }

  // Stacked (mobile portrait / narrow widths): search largest cell that fits.
  for (let cell = d.maxCell; cell >= d.minCell; cell--) {
    if (!fitsStacked(cell)) continue;

    const p = Math.round(cell * d.padFactor);
    const pw = Math.round(cell * d.panelFactor);
    const panelH = Math.max(
      Math.round(cell * 7.5),
      Math.min(220, Math.floor(view.h * 0.32))
    );

    const fieldW = W * cell;
    const fieldH = H * cell;

    const fieldX = Math.floor((view.w - fieldW) / 2);
    const fieldY = p;

    const panelX = Math.floor((view.w - (fieldW + 0)) / 2); // align with field
    const panelY = fieldY + fieldH + p;

    return {
      stacked: true as const,
      cell,
      pad: p,
      fieldX,
      fieldY,
      fieldW,
      fieldH,
      panelX,
      panelY,
      panelW: Math.max(fieldW, pw),
      panelH,
    };
  }

  // Absolute last resort: minimal cell, stacked.
  const cell = d.minCell;
  const p = Math.round(cell * d.padFactor);
  const fieldW = W * cell;
  const fieldH = H * cell;
  return {
    stacked: true as const,
    cell,
    pad: p,
    fieldX: Math.floor((view.w - fieldW) / 2),
    fieldY: p,
    fieldW,
    fieldH,
    panelX: p,
    panelY: p + fieldH + p,
    panelW: fieldW,
    panelH: Math.round(cell * 7.5),
  };
}


export function renderFrame(
  ctx: CanvasRenderingContext2D,
  dpr: number,
  s: GameState,
  ui: { mode: Mode; score: number; lines: number; level: number },
  view: Viewport
) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const lay = computeLayout(view);

  // bg
  ctx.clearRect(0, 0, view.w, view.h);
  ctx.fillStyle = "rgba(7, 12, 22, 1)";
  ctx.fillRect(0, 0, view.w, view.h);

  // playfield frame
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fillRect(lay.fieldX, lay.fieldY, lay.fieldW, lay.fieldH);

  // grid
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  for (let x = 0; x <= W; x++) {
    ctx.beginPath();
    ctx.moveTo(lay.fieldX + x * lay.cell, lay.fieldY);
    ctx.lineTo(lay.fieldX + x * lay.cell, lay.fieldY + lay.fieldH);
    ctx.stroke();
  }
  for (let y = 0; y <= H; y++) {
    ctx.beginPath();
    ctx.moveTo(lay.fieldX, lay.fieldY + y * lay.cell);
    ctx.lineTo(lay.fieldX + lay.fieldW, lay.fieldY + y * lay.cell);
    ctx.stroke();
  }

  // locked blocks
  for (let y = 0; y < H; y++) {
    const row = s.board[y];
    if (!row) continue;
    for (let x = 0; x < W; x++) {
      const c = row[x] ?? 0;
      if (c === 0) continue;
      ctx.fillStyle = COLORS[c as Cell];
      ctx.fillRect(
        lay.fieldX + x * lay.cell + 1,
        lay.fieldY + y * lay.cell + 1,
        lay.cell - 2,
        lay.cell - 2
      );
    }
  }

  // current piece
  for (const [x, y] of getBlocks(s.active)) {
    if (y < 0) continue;
    ctx.fillStyle = colorForPieceType(s.active.t);
    ctx.fillRect(
      lay.fieldX + x * lay.cell + 1,
      lay.fieldY + y * lay.cell + 1,
      lay.cell - 2,
      lay.cell - 2
    );
  }

  // ghost
  let ghost = { ...s.active };
  while (true) {
    const next = { ...ghost, y: ghost.y + 1 };
    if (collides(next, s.board)) break;
    ghost = next;
  }

  // Draw ghost with the SAME color as the active piece, but translucent.
  ctx.save();
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = colorForPieceType(s.active.t);
  for (const [x, y] of getBlocks(ghost)) {
    if (y < 0) continue;
    ctx.fillRect(
      lay.fieldX + x * lay.cell + 2,
      lay.fieldY + y * lay.cell + 2,
      lay.cell - 4,
      lay.cell - 4
    );
  }
  ctx.restore();

  // side / bottom panel background
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  ctx.fillRect(lay.panelX, lay.panelY, lay.panelW, lay.panelH);

  const base = lay.cell;
  const titleSize = Math.round(base * 0.9);
  const textSize = Math.round(base * 0.55);
  const smallSize = Math.round(base * 0.5);

  const sx = lay.panelX + lay.pad;
  let sy = lay.panelY + lay.pad + titleSize;

  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font = `700 ${titleSize}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto`;
  ctx.fillText("Tetris", sx, sy);

  sy += Math.round(base * 0.9);
  ctx.fillStyle = "rgba(255,255,255,0.70)";
  ctx.font = `500 ${smallSize}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto`;
  ctx.fillText(`Mode: ${ui.mode}`, sx, sy);

  sy += Math.round(base * 1.1);
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font = `600 ${textSize}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto`;
  ctx.fillText(`Score: ${ui.score}`, sx, sy);

  sy += Math.round(base * 0.9);
  ctx.fillText(`Lines: ${ui.lines}`, sx, sy);

  sy += Math.round(base * 0.9);
  ctx.fillText(`Level: ${ui.level}`, sx, sy);

  // next piece preview (if there is room)
  const previewTop = sy + Math.round(base * 0.9);
  const previewBox = Math.min(Math.round(base * 5.5), Math.max(0, lay.panelH - (previewTop - lay.panelY) - lay.pad));
  if (previewBox >= base * 4) {
    const boxX = sx;
    const boxY = previewTop;

    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(boxX, boxY, previewBox, previewBox);

    const nextPiece = (typeof s.next === "number" && PIECES[s.next]) || null;

    if (nextPiece) {
      const nBlocks = getBlocks({ t: s.next, rot: 0, x: 0, y: 0 });

      // center preview
      const minX = Math.min(...nBlocks.map(([x]) => x));
      const maxX = Math.max(...nBlocks.map(([x]) => x));
      const minY = Math.min(...nBlocks.map(([, y]) => y));
      const maxY = Math.max(...nBlocks.map(([, y]) => y));
      const bw = maxX - minX + 1;
      const bh = maxY - minY + 1;

      const c = Math.floor(previewBox / 6); // use a smaller cell inside preview
      const ox = boxX + Math.floor((previewBox - bw * c) / 2) - minX * c;
      const oy = boxY + Math.floor((previewBox - bh * c) / 2) - minY * c;

      // color should match the actual tetromino type (same scheme as falling piece)
      ctx.fillStyle = colorForPieceType(s.next);
      for (const b of nBlocks) {
        const [bx, by] = b;
        ctx.fillRect(ox + bx * c + 1, oy + by * c + 1, c - 2, c - 2);
      }
    }
  }

  // overlays
  if (ui.mode !== "running") {
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(lay.fieldX, lay.fieldY, lay.fieldW, lay.fieldH);

    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.font = `800 ${Math.round(base * 1.0)}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto`;
    const msg =
      ui.mode === "idle"
        ? "Press Start"
        : ui.mode === "paused"
        ? "Paused"
        : ui.mode === "gameover"
        ? "Game Over"
        : ui.mode === "win"
        ? "You Win!"
        : "";
    const tw = ctx.measureText(msg).width;
    ctx.fillText(msg, lay.fieldX + (lay.fieldW - tw) / 2, lay.fieldY + lay.fieldH / 2);

    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.font = `600 ${Math.round(base * 0.55)}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto`;
    const tip = "Arrows: move / rotate • Space: drop";
    const tw2 = ctx.measureText(tip).width;
    ctx.fillText(tip, lay.fieldX + (lay.fieldW - tw2) / 2, lay.fieldY + lay.fieldH / 2 + Math.round(base * 1.2));
  }
}
