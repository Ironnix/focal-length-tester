// Sensor formats, frame crops, anamorphic squeezes and the lens stops offered in the UI.

export interface SensorFormat {
  id: string;
  name: string;
  /** Short label for the viewfinder caption. */
  short: string;
  group: "Photo" | "Cinema";
  /** Landscape size in mm. */
  w: number;
  h: number;
}

export const SENSORS: SensorFormat[] = [
  { id: "mf645", name: "Medium format 645 (53.4×40)", short: "MF 645", group: "Photo", w: 53.4, h: 40 },
  { id: "mf44", name: "Medium format (44×33)", short: "MF 44×33", group: "Photo", w: 43.8, h: 32.9 },
  { id: "ff", name: "Full frame (36×24)", short: "Full frame", group: "Photo", w: 36, h: 24 },
  { id: "apsc", name: "APS-C (Sony, Nikon, Fuji)", short: "APS-C", group: "Photo", w: 23.5, h: 15.6 },
  { id: "apsc-canon", name: "APS-C (Canon)", short: "APS-C", group: "Photo", w: 22.3, h: 14.9 },
  { id: "mft", name: "Micro Four Thirds", short: "MFT", group: "Photo", w: 17.3, h: 13 },
  { id: "1in", name: '1-inch', short: '1"', group: "Photo", w: 13.2, h: 8.8 },
  { id: "phone", name: 'Smartphone main (1/1.3")', short: "Phone", group: "Photo", w: 9.8, h: 7.35 },
  { id: "lf", name: "Large format cine (36.7×25.5)", short: "LF", group: "Cinema", w: 36.7, h: 25.54 },
  { id: "s35", name: "Super 35 open gate (24.9×18.7)", short: "S35", group: "Cinema", w: 24.89, h: 18.66 },
  { id: "s35-169", name: "Super 35 16:9 (24.9×14)", short: "S35 16:9", group: "Cinema", w: 24.89, h: 14 },
  { id: "s16", name: "Super 16 (12.5×7.4)", short: "S16", group: "Cinema", w: 12.52, h: 7.41 },
];

export const CUSTOM_SENSOR = "custom";

export function findSensor(id: string): SensorFormat | undefined {
  return SENSORS.find((s) => s.id === id);
}

export interface AspectOption {
  id: string;
  /** Landscape width / height; null keeps the sensor's own shape. */
  ratio: number | null;
  label: string;
  /** Label when the camera is turned to portrait. */
  portrait: string;
}

export const ASPECTS: AspectOption[] = [
  { id: "native", ratio: null, label: "Native", portrait: "Native" },
  { id: "3:2", ratio: 3 / 2, label: "3:2", portrait: "2:3" },
  { id: "4:3", ratio: 4 / 3, label: "4:3", portrait: "3:4" },
  { id: "5:4", ratio: 5 / 4, label: "5:4", portrait: "4:5" },
  { id: "1:1", ratio: 1, label: "1:1", portrait: "1:1" },
  { id: "16:9", ratio: 16 / 9, label: "16:9", portrait: "9:16" },
  { id: "1.85", ratio: 1.85, label: "1.85:1", portrait: "1:1.85" },
  { id: "2:1", ratio: 2, label: "2:1", portrait: "1:2" },
  { id: "2.39", ratio: 2.39, label: "2.39:1", portrait: "1:2.39" },
  { id: "2.76", ratio: 2.76, label: "2.76:1", portrait: "1:2.76" },
];

export function findAspect(id: string): AspectOption {
  return ASPECTS.find((a) => a.id === id) ?? ASPECTS[0]!;
}

export const SQUEEZES = [1, 1.25, 1.33, 1.5, 1.6, 1.8, 2];

/** Third stops from f/0.95 to f/32, plus f/45 and f/64 for large format. */
export const APERTURES = [
  0.95, 1, 1.1, 1.2, 1.4, 1.6, 1.8, 2, 2.2, 2.5, 2.8, 3.2, 3.5, 4, 4.5, 5, 5.6, 6.3, 7.1, 8, 9, 10, 11, 13, 14, 16,
  18, 20, 22, 25, 29, 32, 45, 64,
];

export const APERTURE_CHIPS = [1.4, 2, 2.8, 4, 5.6, 8, 11, 16];

export const FOCAL_CHIPS = [14, 24, 35, 50, 85, 135, 200, 400, 600];

export const FOCAL_MIN = 4;
export const FOCAL_MAX = 2000;

export const MEGAPIXELS = [12, 20, 24, 33, 45, 50, 61, 100];

export function fmtAperture(n: number): string {
  return `f/${Number.isInteger(n) ? n : n.toFixed(n < 1 ? 2 : 1).replace(/\.0$/, "")}`;
}
