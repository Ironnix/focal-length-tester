// The app's one state: settings (what the shot is), prefs (units, theme) and the custom
// subjects. Everything is kept in localStorage; a shared link (?f=85&d=12…) wins once on load.

import { measureCoverage } from "./coverage";
import { compute } from "./model";
import { buildScene } from "./scene";
import { DEFAULT_SETTINGS, fromQuery, isShape, sanitize, toQuery, type Settings } from "./settings";
import { PRESET_SUBJECTS, type Subject } from "./subjects";
import { roundSig, type Units } from "./units";
import type { DistancePreset } from "./presets";
import type { FieldId } from "./fields";
import { aim, placement, type P } from "./placement";

export type Theme = "system" | "light" | "dark";

interface Prefs {
  units: Units;
  theme: Theme;
}

const SETTINGS_KEY = "flt:settings";
const PREFS_KEY = "flt:prefs";
const CUSTOM_KEY = "flt:custom";

function read(key: string): unknown {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // private mode or full storage: the app still works, it just won't remember
  }
}

function validSubject(v: unknown): Subject | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const pos = (n: unknown) => typeof n === "number" && Number.isFinite(n) && n > 0;
  if (typeof o.id !== "string" || typeof o.name !== "string") return null;
  if (!pos(o.width) || !pos(o.height) || !pos(o.depth)) return null;
  return {
    id: o.id,
    name: o.name.slice(0, 40),
    width: o.width as number,
    height: o.height as number,
    depth: o.depth as number,
    shape: isShape(o.shape) ? o.shape : "box",
    custom: true,
  };
}

const browser = typeof window !== "undefined";

const storedCustom = browser
  ? (Array.isArray(read(CUSTOM_KEY)) ? (read(CUSTOM_KEY) as unknown[]) : []).map(validSubject).filter((s) => s !== null)
  : [];
const shared = browser ? fromQuery(location.search.slice(1)) : null;
if (shared?.custom && !storedCustom.some((c) => c.id === shared.custom!.id)) storedCustom.push(shared.custom);
if (shared) history.replaceState(null, "", location.pathname + location.hash);

const storedPrefs = (browser ? read(PREFS_KEY) : null) as Partial<Prefs> | null;

export const settings: Settings = $state(
  shared?.settings ?? sanitize((browser ? read(SETTINGS_KEY) : null) as Partial<Settings> ?? {}),
);

export const prefs: Prefs = $state({
  units: storedPrefs?.units === "imperial" ? "imperial" : "metric",
  theme: storedPrefs?.theme === "light" || storedPrefs?.theme === "dark" ? storedPrefs.theme : "system",
});

export const library: { custom: Subject[] } = $state({ custom: storedCustom });

export function findSubject(id: string): Subject {
  return (
    PRESET_SUBJECTS.find((s) => s.id === id) ?? library.custom.find((s) => s.id === id) ?? PRESET_SUBJECTS[0]!
  );
}

class Live {
  subject = $derived(findSubject(settings.subject));
  model = $derived(compute(settings, this.subject));
  scene = $derived(buildScene(settings, this.subject, this.model, { units: prefs.units }));
  coverage = $derived(measureCoverage(this.scene.subject.solid, this.scene.crop, this.scene.subject.box));
  /** Subject size relative to the picture, from the drawn silhouette (matches the preview). */
  fill = $derived.by(() => {
    const box = this.scene.subject.box;
    const crop = this.scene.crop;
    return box ? { w: box.w / crop.w, h: box.h / crop.h } : this.model.fill;
  });
}

export const live = new Live();

// ---- actions --------------------------------------------------------------------------

export function applyPreset(p: DistancePreset) {
  setField(p.field);
  settings.distance = p.distance;
}

/** Changing the ground puts the camera back on the middle of the near end line. */
export function setField(field: FieldId) {
  settings.field = field;
  settings.camX = 0;
  settings.camZ = 0;
  settings.yaw = 0;
}

/** ~3 significant digits, so dragged values read cleanly. */
export const tidy = (v: number) => roundSig(v, 3);

function aimAt(camera: P, target: P, minus = 0) {
  const a = aim(camera, target);
  settings.distance = tidy(Math.max(0.3, a.distance - minus));
  settings.yaw = Math.round(a.yaw * 10) / 10;
}

/** Moves the subject (its centre) to a field point; the camera turns to follow it. */
export function placeSubject(at: P) {
  aimAt(placement(settings).camera, at, live.subject.depth / 2);
}

/** Moves the camera; the subject stays where it is. */
export function placeCamera(at: P) {
  const target = placement(settings).subject;
  settings.camX = Math.round(at[0] * 10) / 10;
  settings.camZ = Math.round(at[1] * 10) / 10;
  aimAt([settings.camX, settings.camZ], target);
}

export function saveCustomSubject(subject: Subject) {
  const i = library.custom.findIndex((s) => s.id === subject.id);
  if (i >= 0) library.custom[i] = subject;
  else library.custom.push(subject);
  settings.subject = subject.id;
}

export function deleteCustomSubject(id: string) {
  library.custom = library.custom.filter((s) => s.id !== id);
  if (settings.subject === id) settings.subject = DEFAULT_SETTINGS.subject;
}

export function resetSettings() {
  Object.assign(settings, DEFAULT_SETTINGS);
}

export function shareUrl(): string {
  const q = toQuery(settings, live.subject);
  return `${location.origin}${location.pathname}${q ? `?${q}` : ""}`;
}

/** Sets the ground distance so that the camera-to-subject-centre range becomes `range`. */
export function setRange(range: number) {
  const dy = live.subject.height / 2 - live.model.camera.height;
  settings.distance = Math.max(0.05, Math.sqrt(Math.max(range * range - dy * dy, 0.0025)));
}

// ---- persistence and theme ------------------------------------------------------------

function applyTheme(theme: Theme) {
  const dark = theme === "dark" || (theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

if (browser) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  $effect.root(() => {
    $effect(() => {
      const json = JSON.stringify(settings);
      clearTimeout(timer);
      timer = setTimeout(() => {
        try {
          localStorage.setItem(SETTINGS_KEY, json);
        } catch {
          // see write()
        }
      }, 300);
    });
    $effect(() => {
      write(PREFS_KEY, { units: prefs.units, theme: prefs.theme });
      applyTheme(prefs.theme);
    });
    $effect(() => {
      write(CUSTOM_KEY, $state.snapshot(library.custom));
    });
  });
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => applyTheme(prefs.theme));
}

// ---- UI state shared between components ------------------------------------------------

export type Tab = "subject" | "distance" | "lens" | "camera" | "scene";

export const ui: { tab: Tab; editing: Subject | null; toast: string } = $state({
  tab: "subject",
  editing: null,
  toast: "",
});

let toastTimer: ReturnType<typeof setTimeout> | undefined;
export function toast(message: string) {
  ui.toast = message;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (ui.toast = ""), 2200);
}
