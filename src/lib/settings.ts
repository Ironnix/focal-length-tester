import type { FieldId } from "./fields";
import type { ShapeId } from "./shapes";
import type { Subject } from "./subjects";
import { findAspect, findSensor } from "./camera";
import type { SkyId } from "./backdrop";

export type Background = "trees" | "city" | "stadium" | "none";

export interface Settings {
  subject: string;
  /** Ground distance from the camera to the front of the subject, m. */
  distance: number;
  focal: number;
  aperture: number;
  focusOnSubject: boolean;
  /** Focus distance when not focusing on the subject, m. */
  focus: number;
  sensor: string;
  /** Custom sensor, mm. */
  sensorW: number;
  sensorH: number;
  aspect: string;
  squeeze: number;
  portrait: boolean;
  megapixels: number;
  cocAuto: boolean;
  coc: number;
  camHeightAuto: boolean;
  camHeight: number;
  background: Background;
  /** Distance from the subject to the background, m (not used by "stadium"). */
  bgGap: number;
  sky: SkyId;
  field: FieldId;
  /** Camera position on the field (m, field coordinates) and viewing direction (degrees,
   *  0 = down the length of the field, positive = towards +x). Only used with a field. */
  camX: number;
  camZ: number;
  yaw: number;
  reference: boolean;
  thirds: boolean;
  focusZone: boolean;
  sensorFrames: boolean;
  labels: boolean;
  fillTarget: number;
}

export const DEFAULT_SETTINGS: Settings = {
  subject: "person",
  distance: 52.5,
  focal: 200,
  aperture: 2.8,
  focusOnSubject: true,
  focus: 52.5,
  sensor: "ff",
  sensorW: 36,
  sensorH: 24,
  aspect: "native",
  squeeze: 1,
  portrait: false,
  megapixels: 24,
  cocAuto: true,
  coc: 0.03,
  camHeightAuto: true,
  camHeight: 1.6,
  background: "stadium",
  bgGap: 62,
  sky: "clouds",
  field: "football",
  camX: 0,
  camZ: 0,
  yaw: 0,
  reference: false,
  thirds: false,
  focusZone: true,
  sensorFrames: false,
  labels: true,
  fillTarget: 0.9,
};

const FIELDS: FieldId[] = ["none", "football", "hockey", "basketball", "tennis"];
const BACKGROUNDS: Background[] = ["trees", "city", "stadium", "none"];
const SKY_IDS: SkyId[] = ["clouds", "clear", "sunset", "overcast", "plain"];
const SHAPES: ShapeId[] = [
  "person",
  "bust",
  "cat",
  "dog",
  "horse",
  "bird",
  "eagle",
  "car",
  "bus",
  "motorcycle",
  "smallplane",
  "airliner",
  "house",
  "box",
];

export const isShape = (v: unknown): v is ShapeId => SHAPES.includes(v as ShapeId);

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Takes anything (stored JSON, a shared link) and returns valid settings. */
export function sanitize(raw: Partial<Record<keyof Settings, unknown>>): Settings {
  const d = DEFAULT_SETTINGS;
  const n = (v: unknown, fallback: number, lo: number, hi: number) =>
    typeof v === "number" && Number.isFinite(v) ? clamp(v, lo, hi) : fallback;
  const b = (v: unknown, fallback: boolean) => (typeof v === "boolean" ? v : fallback);
  const s = (v: unknown, fallback: string) => (typeof v === "string" && v ? v : fallback);
  const sensor = s(raw.sensor, d.sensor);
  return {
    subject: s(raw.subject, d.subject),
    distance: n(raw.distance, d.distance, 0.05, 50000),
    focal: n(raw.focal, d.focal, 1, 5000),
    aperture: n(raw.aperture, d.aperture, 0.7, 128),
    focusOnSubject: b(raw.focusOnSubject, d.focusOnSubject),
    focus: n(raw.focus, d.focus, 0.05, 50000),
    sensor: sensor === "custom" || findSensor(sensor) ? sensor : d.sensor,
    sensorW: n(raw.sensorW, d.sensorW, 1, 200),
    sensorH: n(raw.sensorH, d.sensorH, 1, 200),
    aspect: findAspect(s(raw.aspect, d.aspect)).id,
    squeeze: n(raw.squeeze, d.squeeze, 1, 3),
    portrait: b(raw.portrait, d.portrait),
    megapixels: n(raw.megapixels, d.megapixels, 0.3, 1000),
    cocAuto: b(raw.cocAuto, d.cocAuto),
    coc: n(raw.coc, d.coc, 0.001, 1),
    camHeightAuto: b(raw.camHeightAuto, d.camHeightAuto),
    camHeight: n(raw.camHeight, d.camHeight, 0.01, 2000),
    background: BACKGROUNDS.includes(raw.background as Background) ? (raw.background as Background) : d.background,
    bgGap: n(raw.bgGap, d.bgGap, 0.1, 50000),
    sky: SKY_IDS.includes(raw.sky as SkyId) ? (raw.sky as SkyId) : d.sky,
    field: FIELDS.includes(raw.field as FieldId) ? (raw.field as FieldId) : d.field,
    camX: n(raw.camX, d.camX, -1000, 1000),
    camZ: n(raw.camZ, d.camZ, -1000, 1000),
    yaw: n(raw.yaw, d.yaw, -360, 360),
    reference: b(raw.reference, d.reference),
    thirds: b(raw.thirds, d.thirds),
    focusZone: b(raw.focusZone, d.focusZone),
    sensorFrames: b(raw.sensorFrames, d.sensorFrames),
    labels: b(raw.labels, d.labels),
    fillTarget: n(raw.fillTarget, d.fillTarget, 0.05, 1),
  };
}

/** The stadium photo belongs to the football pitch; elsewhere it falls back to trees. */
export function backgroundOf(s: Settings): Background {
  return s.background === "stadium" && s.field !== "football" ? "trees" : s.background;
}

export function sensorSize(s: Settings): { w: number; h: number; short: string; name: string } {
  const f = findSensor(s.sensor);
  if (f) return { w: f.w, h: f.h, short: f.short, name: f.name };
  return { w: s.sensorW, h: s.sensorH, short: "Custom", name: `Custom (${s.sensorW}×${s.sensorH} mm)` };
}

// ---- shareable links ------------------------------------------------------------------

/** Short query keys for the settings that describe a shot (view toggles stay local). */
const KEYS: [keyof Settings, string][] = [
  ["subject", "s"],
  ["distance", "d"],
  ["focal", "f"],
  ["aperture", "a"],
  ["focusOnSubject", "fs"],
  ["focus", "fd"],
  ["sensor", "sn"],
  ["sensorW", "sw"],
  ["sensorH", "sh"],
  ["aspect", "ar"],
  ["squeeze", "sq"],
  ["portrait", "p"],
  ["megapixels", "mp"],
  ["cocAuto", "ca"],
  ["coc", "c"],
  ["camHeightAuto", "ha"],
  ["camHeight", "h"],
  ["background", "bg"],
  ["bgGap", "bd"],
  ["sky", "sk"],
  ["field", "fl"],
  ["camX", "cx"],
  ["camZ", "cz"],
  ["yaw", "yw"],
  ["reference", "r"],
];

/** Settings that describe a shot; compare mode keeps one set per setup. */
export const SHOT_KEYS: (keyof Settings)[] = KEYS.map(([key]) => key);

export interface Shared {
  settings: Settings;
  custom: Subject | null;
}

/** Query string for a shot; `versus` adds the second setup of compare mode. */
export function toQuery(s: Settings, subject: Subject, versus?: { settings: Settings; subject: Subject }): string {
  const q = new URLSearchParams();
  for (const [key, short] of KEYS) {
    const v = s[key];
    if (v === DEFAULT_SETTINGS[key]) continue;
    q.set(short, typeof v === "boolean" ? (v ? "1" : "0") : String(typeof v === "number" ? +v.toFixed(4) : v));
  }
  if (subject.custom) {
    q.set("cn", subject.name);
    q.set("cw", String(subject.width));
    q.set("ch", String(subject.height));
    q.set("cd", String(subject.depth));
    q.set("cs", subject.shape);
  }
  if (versus) q.set("vs", toQuery(versus.settings, versus.subject) || "_");
  return q.toString();
}

export function fromQuery(query: string): (Shared & { versus: Shared | null }) | null {
  const q = new URLSearchParams(query);
  if (![...q.keys()].some((k) => k === "vs" || KEYS.some(([, short]) => short === k))) return null;
  const raw: Partial<Record<keyof Settings, unknown>> = {};
  for (const [key, short] of KEYS) {
    const v = q.get(short);
    if (v === null) continue;
    const def = DEFAULT_SETTINGS[key];
    raw[key] = typeof def === "boolean" ? v === "1" : typeof def === "number" ? Number(v) : v;
  }
  let custom: Subject | null = null;
  const cw = Number(q.get("cw"));
  const ch = Number(q.get("ch"));
  if (q.get("cn") && cw > 0 && ch > 0) {
    const shape = q.get("cs");
    custom = {
      id: String(raw.subject ?? "custom-shared"),
      name: q.get("cn")!.slice(0, 40),
      width: cw,
      height: ch,
      depth: Math.max(0.01, Number(q.get("cd")) || Math.min(cw, ch)),
      shape: isShape(shape) ? shape : "box",
      custom: true,
    };
  }
  const vs = q.get("vs");
  const versus = vs ? (fromQuery(vs) ?? { settings: sanitize({}), custom: null }) : null;
  return { settings: sanitize(raw), custom, versus: versus && { settings: versus.settings, custom: versus.custom } };
}

