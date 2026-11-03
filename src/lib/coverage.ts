// How much of the picture the subject's silhouette covers, measured by rasterising the
// drawn paths into a small canvas (exact for any outline, overlaps counted once).

import type { Rect } from "./scene";

export interface Coverage {
  /** Share of the picture area covered by the subject. */
  frame: number;
  /** Share of the subject that is inside the picture. */
  visible: number;
}

let canvas: HTMLCanvasElement | null = null;

function context(w: number, h: number): CanvasRenderingContext2D | null {
  if (typeof document === "undefined") return null;
  canvas ??= document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  return canvas.getContext("2d", { willReadFrequently: true });
}

/** Covered share of `area` (0–1) when the paths are filled. */
function coveredShare(paths: Path2D[], area: Rect, resolution: number): number {
  if (area.w <= 0 || area.h <= 0) return 0;
  const aspect = area.w / area.h;
  const w = Math.max(8, Math.round(aspect >= 1 ? resolution : resolution * aspect));
  const h = Math.max(8, Math.round(aspect >= 1 ? resolution / aspect : resolution));
  const ctx = context(w, h);
  if (!ctx) return 0;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.setTransform(w / area.w, 0, 0, h / area.h, (-area.x * w) / area.w, (-area.y * h) / area.h);
  ctx.fillStyle = "#000";
  for (const p of paths) ctx.fill(p);
  const data = ctx.getImageData(0, 0, w, h).data;
  let sum = 0;
  for (let i = 3; i < data.length; i += 4) sum += data[i]!;
  return sum / 255 / (w * h);
}

export function measureCoverage(paths: string[], frame: Rect, subjectBox: Rect | null): Coverage {
  if (!subjectBox || !paths.length) return { frame: 0, visible: 0 };
  const p2d = paths.filter(Boolean).map((d) => new Path2D(d));
  const inFrame = coveredShare(p2d, frame, 240) * frame.w * frame.h;
  const total = coveredShare(p2d, subjectBox, 240) * subjectBox.w * subjectBox.h;
  return {
    frame: inFrame / (frame.w * frame.h),
    visible: total > 0 ? Math.min(1, inFrame / total) : 0,
  };
}
