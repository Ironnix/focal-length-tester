// Builds the drawn viewfinder: a pinhole projection of a simple world (ground, distant
// hills, a background row, the subject) with depth-of-field blur per depth.
//
// World: x to the right, y up, z away from the camera (metres); the ground is y = 0 and the
// subject's front stands at z = distance. Screen: "image mm" of the delivered picture,
// centred on the optical axis, y down — the SVG viewBox uses the same units.

import { getField, type FieldLine } from "./fields";
import type { Model } from "./model";
import { blurDisc } from "./optics";
import type { Settings } from "./settings";
import { pathFrom, SHAPES, type Pt, type Shape } from "./shapes";
import { REFERENCE_PERSON, type Subject } from "./subjects";
import { len, niceStepFor, type Units } from "./units";

type V3 = [number, number, number];

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface BlurFilter {
  id: string;
  sx: number;
  sy: number;
}

export interface Drawn {
  d: string;
  fill?: string;
  stroke?: string;
  width?: number;
  filter: string | null;
}

export interface Silhouette {
  solid: string[];
  light: string[];
  filter: string | null;
  box: Rect | null;
}

export interface Scene {
  view: Rect;
  crop: Rect;
  horizon: number;
  sky: string;
  ground: string;
  filters: BlurFilter[];
  hills: Drawn | null;
  areas: Drawn[];
  lines: Drawn[];
  backdrop: Drawn[];
  subject: Silhouette;
  reference: Silhouette | null;
  zone: { fill: string; edges: string[]; focus: string } | null;
  labels: { x: number; y: number; text: string }[];
  fontSize: number;
}

export interface SceneOptions {
  /** Thumbnails: no grid, labels, zone or windows. */
  lite?: boolean;
  units: Units;
}

const NEAR = 0.05;
const SKY = "#dfe8ef";
const GROUND = "#aeb79d";
const HILLS = "#b9c4cc";
const TREES = "#58745a";
const CITY = "#8c96a1";
const WINDOWS = "#cdd5dc";

class Camera {
  readonly cos: number;
  readonly sin: number;
  constructor(
    readonly focal: number,
    readonly height: number,
    pitch: number,
  ) {
    this.cos = Math.cos(pitch);
    this.sin = Math.sin(pitch);
  }
  /** Depth along the optical axis. */
  depth([, y, z]: V3): number {
    return (y - this.height) * this.sin + z * this.cos;
  }
  /** Screen point of a world point in front of the camera. */
  screen(p: V3): Pt {
    const ry = p[1] - this.height;
    const zc = ry * this.sin + p[2] * this.cos;
    const yc = ry * this.cos - p[2] * this.sin;
    return [(this.focal * p[0]) / zc, (-this.focal * yc) / zc];
  }
}

/** Keeps the part of a world polygon in front of the near plane (Sutherland–Hodgman). */
function clipNear(cam: Camera, poly: V3[]): V3[] {
  const out: V3[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]!;
    const b = poly[(i + 1) % poly.length]!;
    const da = cam.depth(a) - NEAR;
    const db = cam.depth(b) - NEAR;
    if (da >= 0) out.push(a);
    if (da >= 0 !== db >= 0) {
      const t = da / (da - db);
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]);
    }
  }
  return out;
}

function polyPath(cam: Camera, poly: V3[], smooth = false): string {
  const clipped = clipNear(cam, poly);
  if (clipped.length < 3) return "";
  return pathFrom(clipped.map((p) => cam.screen(p)), smooth);
}

const ground = (pts: [number, number][]): V3[] => pts.map(([x, z]) => [x, 0, z]);

/** Deterministic pseudo-random number in [0, 1) for an integer pair. */
function hash(a: number, b = 0): number {
  let h = Math.imul(a ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(b + 0x632be5ab, 0xc2b2ae35);
  h ^= h >>> 15;
  h = Math.imul(h, 0x2c1b3c6d);
  h ^= h >>> 13;
  return ((h >>> 0) % 100000) / 100000;
}

export function buildScene(s: Settings, subject: Subject, m: Model, opts: SceneOptions): Scene {
  const { frame } = m;
  const cam = new Camera(m.projection, m.camera.height, m.camera.pitch);
  const crop: Rect = { x: -frame.width / 2, y: -frame.height / 2, w: frame.width, h: frame.height };
  const view: Rect =
    s.outsideCrop && !opts.lite
      ? { x: -frame.fullWidth / 2, y: -frame.fullHeight / 2, w: frame.fullWidth, h: frame.fullHeight }
      : crop;
  const fontSize = crop.h * 0.028;

  // ---- blur -------------------------------------------------------------------------
  const filters: BlurFilter[] = [];
  const byKey = new Map<string, string>();
  // Gaussian sigma for a blur disc; anamorphic bokeh is an upright oval (narrower across the squeeze).
  const squeezeX = frame.portrait ? 1 : frame.squeeze;
  const squeezeY = frame.portrait ? frame.squeeze : 1;
  const minSigma = crop.h / 1500;
  const blurFor = (distance: number): string | null => {
    if (opts.lite) return null;
    const b = blurDisc(m.focal, m.aperture, m.focus, distance) * 0.33;
    const sx = b / squeezeX;
    const sy = b / squeezeY;
    if (Math.max(sx, sy) < minSigma) return null;
    // Round so nearby depths share one filter.
    const key = `${sx.toPrecision(2)}:${sy.toPrecision(2)}`;
    let id = byKey.get(key);
    if (!id) {
      id = `b${filters.length}`;
      byKey.set(key, id);
      filters.push({ id, sx: +sx.toPrecision(2), sy: +sy.toPrecision(2) });
    }
    return id;
  };

  // Half width of the visible world at a depth, with margin for blur and pitch.
  const halfWidthAt = (z: number) => (z * view.w) / 2 / cam.focal + z * 0.05 + 2;

  // ---- sky, ground, hills ------------------------------------------------------------
  const horizon = cam.focal * Math.tan(m.camera.pitch);
  const field = getField(s.field);

  const hillZ = 3000;
  const hillHalf = halfWidthAt(hillZ) * 1.2 + 200;
  const hillPts: V3[] = [];
  const steps = 90;
  for (let i = 0; i <= steps; i++) {
    const x = -hillHalf + (2 * hillHalf * i) / steps;
    const h = 70 + 45 * Math.sin(x / 420 + 0.6) + 28 * Math.sin(x / 170 + 2.1) + 12 * Math.sin(x / 61 + 4);
    hillPts.push([x, Math.max(8, h), hillZ]);
  }
  hillPts.push([hillHalf, 0, hillZ], [-hillHalf, 0, hillZ]);
  const hills: Drawn = { d: polyPath(cam, hillPts), fill: HILLS, filter: blurFor(hillZ) };

  // ---- ground areas (fields, focus zone) ----------------------------------------------
  const areas: Drawn[] = [];
  if (field) {
    for (const a of field.areas) areas.push({ d: polyPath(cam, ground(a.pts)), fill: a.color, filter: null });
  }

  // ---- lines on the ground, banded by depth so each band gets its own blur -------------
  // Painted lines (worldWidth set) become ground quads, so they foreshorten like the real
  // thing; grid lines are hairlines.
  const lines: Drawn[] = [];
  const groups = new Map<string, { d: string[]; color: string; painted: boolean; filter: string | null }>();
  const hairline = crop.h / 700;
  const addLine = (pts: [number, number][], color: string, worldWidth: number | null, closed = false) => {
    const all = closed ? [...pts, pts[0]!] : pts;
    for (let i = 0; i < all.length - 1; i++) {
      const [x0, z0] = all[i]!;
      const [x1, z1] = all[i + 1]!;
      const segLen = Math.hypot(x1 - x0, z1 - z0);
      if (segLen === 0) continue;
      const nearZ = Math.max(NEAR, Math.min(z0, z1));
      const pieces = Math.min(200, Math.max(1, Math.ceil(segLen / Math.max(0.3, nearZ * 0.1))));
      // half-width offset across the line, on the ground
      const nx = worldWidth ? (-(z1 - z0) / segLen) * (worldWidth / 2) : 0;
      const nz = worldWidth ? ((x1 - x0) / segLen) * (worldWidth / 2) : 0;
      for (let k = 0; k < pieces; k++) {
        const t0 = k / pieces;
        const t1 = (k + 1) / pieces;
        let a: V3 = [x0 + (x1 - x0) * t0, 0, z0 + (z1 - z0) * t0];
        let b: V3 = [x0 + (x1 - x0) * t1, 0, z0 + (z1 - z0) * t1];
        const da = cam.depth(a) - NEAR;
        const db = cam.depth(b) - NEAR;
        if (da < 0 && db < 0) continue;
        const mid = Math.max(NEAR, (cam.depth(a) + cam.depth(b)) / 2);
        const band = Math.round(Math.log(mid) / Math.log(1.15));
        const key = `${band}|${color}|${worldWidth ? 1 : 0}`;
        let g = groups.get(key);
        if (!g) {
          g = { d: [], color, painted: !!worldWidth, filter: blurFor(1.15 ** band) };
          groups.set(key, g);
        }
        if (worldWidth) {
          g.d.push(
            polyPath(cam, [
              [a[0] - nx, 0, a[2] - nz],
              [b[0] - nx, 0, b[2] - nz],
              [b[0] + nx, 0, b[2] + nz],
              [a[0] + nx, 0, a[2] + nz],
            ]),
          );
          continue;
        }
        if (da < 0) a = lerp3(a, b, da / (da - db));
        else if (db < 0) b = lerp3(a, b, da / (da - db));
        const [ua, va] = cam.screen(a);
        const [ub, vb] = cam.screen(b);
        g.d.push(`M${ua.toFixed(4)} ${va.toFixed(4)}L${ub.toFixed(4)} ${vb.toFixed(4)}`);
      }
    }
  };

  const labels: Scene["labels"] = [];
  if (field && !opts.lite) {
    for (const l of field.lines as FieldLine[]) addLine(l.pts, l.color, l.width, l.closed);
  } else if (!field && !opts.lite) {
    // A ground grid that scales with the subject distance.
    const step = niceStepFor(s.distance / 4, opts.units);
    const zMax = Math.min(s.distance * 3 + step, 20000);
    const count = Math.min(80, Math.floor(zMax / step));
    const xHalf = halfWidthAt(zMax);
    const cols = Math.min(40, Math.ceil(halfWidthAt(s.distance * 1.5) / step));
    for (let k = 1; k <= count; k++) {
      addLine(
        [
          [-xHalf, k * step],
          [xHalf, k * step],
        ],
        "rgba(255,255,255,0.55)",
        null,
      );
    }
    for (let j = -cols; j <= cols; j++) {
      addLine(
        [
          [j * step, 0],
          [j * step, count * step],
        ],
        "rgba(255,255,255,0.4)",
        null,
      );
    }
  }
  for (const g of groups.values()) {
    const d = g.d.join("");
    if (!d) continue;
    // Painted lines get a hairline outline too, so far-away lines don't vanish.
    lines.push(
      g.painted
        ? { d, fill: g.color, stroke: g.color, width: hairline * 0.6, filter: g.filter }
        : { d, stroke: g.color, width: hairline, filter: g.filter },
    );
  }

  // Distance labels along the left edge of the picture. When labels get crowded towards
  // the horizon, the label step grows (×2, ×5, ×10 …) so the numbers stay round.
  if (s.labels && !opts.lite) {
    let step = niceStepFor(s.distance / 4, opts.units);
    let lastY = Infinity;
    let z = step;
    for (let guard = 0; guard < 200 && z < 1e5; guard++, z += step) {
      if (cam.depth([0, 0, z]) <= NEAR) continue;
      const [, y] = cam.screen([0, 0, z]);
      if (y > crop.y + crop.h - fontSize * 0.4) continue;
      if (y < crop.y + fontSize * 1.6 || y < horizon + fontSize * 0.8) break;
      if (lastY - y < fontSize * 1.6) {
        step = niceStepFor(step * 1.8, opts.units);
        z = Math.ceil(z / step) * step - step;
        continue;
      }
      labels.push({ x: crop.x + fontSize * 0.5, y: y - fontSize * 0.3, text: len(z, opts.units) });
      lastY = y;
    }
  }

  // ---- background row --------------------------------------------------------------
  const backdrop: Drawn[] = [];
  if (m.background !== null) {
    const zb = m.background;
    const filter = blurFor(zb);
    const half = halfWidthAt(zb) + 20;
    if (s.background === "trees") {
      let spacing = 5.5;
      if ((2 * half) / spacing > 160) spacing = (2 * half) / 160;
      const K = Math.ceil(half / spacing);
      const d: string[] = [];
      for (let k = -K; k <= K; k++) {
        const x = k * spacing + (hash(k, 1) - 0.5) * spacing * 0.6;
        const h = 7 + 7 * hash(k, 2);
        const rx = h * (0.26 + 0.12 * hash(k, 3));
        const ry = h * 0.4;
        const cy = h - ry;
        const crown: V3[] = Array.from({ length: 14 }, (_, i) => {
          const a = (i / 14) * Math.PI * 2;
          const r = 0.86 + 0.2 * hash(k, i + 10);
          return [x + rx * r * Math.cos(a), cy + ry * r * Math.sin(a), zb] as V3;
        });
        d.push(polyPath(cam, crown, true));
        const tw = 0.2 + h * 0.015;
        d.push(
          polyPath(cam, [
            [x - tw, 0, zb],
            [x + tw, 0, zb],
            [x + tw, cy, zb],
            [x - tw, cy, zb],
          ]),
        );
      }
      backdrop.push({ d: d.join(""), fill: TREES, filter });
    } else if (s.background === "city") {
      const slot = 22;
      const K = Math.ceil(half / slot);
      const bodies: string[] = [];
      const windows: string[] = [];
      // Windows only when they are large enough to see.
      const storey = (3.2 * cam.focal) / Math.max(NEAR, zb);
      const showWindows = !opts.lite && storey > crop.h / 160;
      for (let k = -K; k <= K; k++) {
        const w = 13 + 8 * hash(k, 1);
        const x0 = k * slot + (slot - w) * hash(k, 2) - slot / 2;
        const h = 10 + 32 * hash(k, 3) ** 1.6;
        const outline: V3[] = [
          [x0, 0, zb],
          [x0 + w, 0, zb],
          [x0 + w, h, zb],
          [x0, h, zb],
        ];
        bodies.push(polyPath(cam, outline));
        if (showWindows) {
          const cols = Math.floor((w - 1.5) / 3);
          const rows = Math.floor((h - 3) / 3.2);
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              const wx = x0 + 1.5 + c * 3;
              const wy = 2.4 + r * 3.2;
              windows.push(
                polyPath(cam, [
                  [wx, wy, zb],
                  [wx + 1.5, wy, zb],
                  [wx + 1.5, wy + 1.7, zb],
                  [wx, wy + 1.7, zb],
                ]),
              );
            }
          }
        }
      }
      backdrop.push({ d: bodies.join(""), fill: CITY, filter });
      if (windows.length) backdrop.push({ d: windows.join(""), fill: WINDOWS, filter });
    }
  }

  // ---- subject and reference person -------------------------------------------------
  const subjectSil = silhouette(cam, SHAPES[subject.shape], subject.width, subject.height, 0, s.distance, blurFor(m.subjectRange));
  let reference: Silhouette | null = null;
  if (s.reference && subject.id !== REFERENCE_PERSON.id) {
    const r = REFERENCE_PERSON;
    const x = subject.width / 2 + 0.4 + r.width / 2;
    const range = Math.hypot(s.distance, r.height / 2 - m.camera.height);
    reference = silhouette(cam, SHAPES[r.shape], r.width, r.height, x, s.distance, blurFor(range));
  }

  // ---- focus zone on the ground -------------------------------------------------------
  let zone: Scene["zone"] = null;
  if (s.focusZone && !opts.lite) {
    const near = Math.max(NEAR, m.dof.near);
    const far = Math.min(Number.isFinite(m.dof.far) ? m.dof.far : 1e5, 1e5);
    const wNear = halfWidthAt(near) * 3;
    const wFar = halfWidthAt(far) * 3;
    const fill = polyPath(cam, [
      [-wNear, 0, near],
      [wNear, 0, near],
      [wFar, 0, far],
      [-wFar, 0, far],
    ]);
    const edge = (z: number) => {
      if (!Number.isFinite(z) || z > 1e5 || cam.depth([0, 0, z]) <= NEAR) return "";
      const w = halfWidthAt(z) * 3;
      const [ua, va] = cam.screen([-w, 0, z]);
      const [ub, vb] = cam.screen([w, 0, z]);
      return `M${ua} ${va}L${ub} ${vb}`;
    };
    zone = {
      fill,
      edges: [edge(m.dof.near), edge(m.dof.far)].filter(Boolean),
      focus: edge(m.focus),
    };
  }

  return {
    view,
    crop,
    horizon,
    sky: SKY,
    ground: field ? field.surround : GROUND,
    filters,
    hills,
    areas,
    lines,
    backdrop,
    subject: subjectSil,
    reference,
    zone,
    labels,
    fontSize,
  };
}

function lerp3(a: V3, b: V3, t: number): V3 {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/** Projects a shape standing on the ground, centred at x, front at z. */
function silhouette(
  cam: Camera,
  shape: Shape,
  width: number,
  height: number,
  x: number,
  z: number,
  filter: string | null,
): Silhouette {
  const [bw, bh] = shape.box;
  const toWorld = ([px, py]: Pt): V3 => [x + (px / bw - 0.5) * width, height * (1 - py / bh), z];
  const solid: string[] = [];
  const light: string[] = [];
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const part of shape.parts) {
    const world = part.pts.map(toWorld);
    const clipped = clipNear(cam, world);
    if (clipped.length < 3) continue;
    const pts = clipped.map((p) => cam.screen(p));
    if (!part.light) {
      for (const [u, v] of pts) {
        minX = Math.min(minX, u);
        maxX = Math.max(maxX, u);
        minY = Math.min(minY, v);
        maxY = Math.max(maxY, v);
      }
    }
    (part.light ? light : solid).push(pathFrom(pts, part.smooth));
  }
  const box = Number.isFinite(minX) ? { x: minX, y: minY, w: maxX - minX, h: maxY - minY } : null;
  return { solid, light, filter, box };
}

/** Outline of another sensor format at the same focal length, in this picture's units. */
export function sensorOutline(w: number, h: number, squeeze: number, portrait: boolean): Rect {
  const ww = portrait ? h : w * squeeze;
  const hh = portrait ? w * squeeze : h;
  return { x: -ww / 2, y: -hh / 2, w: ww, h: hh };
}
