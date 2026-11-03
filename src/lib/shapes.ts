// Hand-drawn subject silhouettes. Each shape is drawn in its own box (x right, y down)
// whose proportions match the real subject; the scene stretches the box to the subject's
// width × height. Outlines are point lists; `smooth` rounds them through edge midpoints,
// and a point listed twice stays a sharp corner.

export type Pt = [number, number];

export interface Part {
  pts: Pt[];
  smooth: boolean;
  /** Drawn lighter on top of the silhouette (windows, hubs); ignored for coverage. */
  light?: boolean;
}

export interface Shape {
  box: [number, number];
  parts: Part[];
}

export type ShapeId =
  | "person"
  | "bust"
  | "cat"
  | "dog"
  | "horse"
  | "bird"
  | "eagle"
  | "car"
  | "bus"
  | "motorcycle"
  | "smallplane"
  | "airliner"
  | "house"
  | "box";

function pairs(flat: number[]): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < flat.length; i += 2) out.push([flat[i]!, flat[i + 1]!]);
  return out;
}

/** Right half from the axis down to the axis again, completed by its mirror image. */
function mirrored(axis: number, flat: number[]): Pt[] {
  const half = pairs(flat);
  const back = half
    .slice(1, -1)
    .reverse()
    .map(([x, y]): Pt => [2 * axis - x, y]);
  return [...half, ...back];
}

function ellipse(cx: number, cy: number, rx: number, ry: number, n = 24): Pt[] {
  return Array.from({ length: n }, (_, i): Pt => {
    const a = (i / n) * Math.PI * 2;
    return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
  });
}

/** Points along an arc, angles in degrees (0 = right, 90 = down). */
function arc(cx: number, cy: number, r: number, from: number, to: number, n = 10): Pt[] {
  return Array.from({ length: n + 1 }, (_, i): Pt => {
    const a = ((from + ((to - from) * i) / n) * Math.PI) / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  });
}

function rect(x: number, y: number, w: number, h: number): Pt[] {
  return [
    [x, y],
    [x + w, y],
    [x + w, y + h],
    [x, y + h],
  ];
}

const solid = (pts: Pt[], smooth = true): Part => ({ pts, smooth });
const light = (pts: Pt[], smooth = false): Part => ({ pts, smooth, light: true });

/** Wheel arch cut into a body outline: from the rear end of the arch over the top to the front. */
function wheelArch(cx: number, bottom: number, r: number): Pt[] {
  return [[cx + r, bottom], ...arc(cx, bottom, r, 0, -180, 12), [cx - r, bottom]];
}

const person: Shape = {
  box: [50, 175],
  parts: [
    solid(ellipse(25, 11, 9.5, 11)),
    solid(
      mirrored(25, [
        25, 20, 29, 20.5, 29.5, 25, 38, 27.5, 44, 30, 47.5, 36, 48.5, 55, 49, 75, 49.5, 92, 49.5, 99, 46, 102, 44, 99,
        43.5, 90, 42.5, 70, 41.5, 47, 40, 42, 39, 55, 39.5, 72, 41, 90, 40.5, 110, 38.5, 135, 37.5, 160, 38.5, 170, 41,
        173.5, 41, 175, 41, 175, 29, 175, 29, 175, 29.5, 168, 29, 140, 27.5, 110, 26, 96, 25, 94,
      ]),
    ),
  ],
};

const bust: Shape = {
  box: [48, 45],
  parts: [
    solid(ellipse(24, 12, 8.6, 12)),
    solid(
      mirrored(24, [24, 21, 27.5, 21.5, 28, 26, 29, 28.5, 34, 30.5, 41, 33, 45.5, 36.5, 47.3, 40, 48, 45, 48, 45, 24, 45]),
    ),
  ],
};

const cat: Shape = {
  box: [57, 34],
  parts: [
    // far-side legs
    solid(pairs([19.6, 20, 20, 33.5, 20, 34, 20, 34, 23.5, 34, 23.5, 34, 23.3, 26, 23, 20])),
    solid(pairs([34, 21, 34.3, 33.5, 34.3, 34, 34.3, 34, 37.8, 34, 37.8, 34, 37.6, 27, 37.4, 21])),
    solid(
      pairs([
        1, 12.5, 2, 10, 4, 7, 5, 1.5, 5, 1.5, 8.5, 5, 11, 1, 11, 1, 13, 7, 15, 10.5, 20, 12, 30, 12.8, 40, 11.5, 44, 12.5,
        48, 10, 51, 4.5, 54, 1.2, 56, 1.5, 56, 1.5, 55.5, 3.8, 53, 7.5, 50, 14, 46, 17.5, 44.5, 21, 43.5, 27, 44.5, 33,
        44.5, 34, 44.5, 34, 40, 34, 40, 34, 40.5, 27, 38, 22.5, 28, 23.5, 19, 22.5, 17.5, 27, 17.5, 33.5, 17.5, 34, 17.5,
        34, 13, 34, 13, 34, 13.5, 27, 12.5, 21, 10, 17.5, 5, 16, 2.5, 14.5,
      ]),
    ),
  ],
};

const dog: Shape = {
  box: [108, 75],
  parts: [
    solid(pairs([45, 42, 46, 72, 46.5, 75, 46.5, 75, 52.5, 75, 52.5, 75, 52, 70, 51.5, 44])),
    solid(pairs([70, 41, 70.5, 56, 71.5, 72, 72, 75, 72, 75, 78, 75, 78, 75, 77.5, 70, 77.5, 52, 77, 41])),
    solid(
      pairs([
        1.5, 20, 2.5, 16.5, 11, 13, 13.5, 8, 18, 3.5, 23, 4, 26, 9, 32, 15, 38, 17, 60, 18.5, 78, 18, 86, 19.5, 90, 21,
        97, 25, 104, 31, 108, 33, 107, 35, 99, 30.5, 91, 27, 88, 34, 88, 44, 86, 52, 87, 72, 88, 75, 88, 75, 81, 75, 81,
        75, 81, 70, 80, 55, 78, 44, 72, 40, 55, 44, 44, 45, 42, 52, 42, 72, 43, 75, 43, 75, 36, 75, 36, 75, 36, 70, 36,
        52, 33, 42, 28, 33, 22, 27, 13, 24, 5, 23,
      ]),
    ),
  ],
};

const horse: Shape = {
  box: [226, 220],
  parts: [
    // far legs
    solid(pairs([87, 118, 89, 176, 88, 205, 90, 220, 90, 220, 101, 220, 101, 220, 100, 207, 100, 178, 99, 122])),
    solid(
      pairs([148, 118, 158, 150, 161, 162, 158, 196, 160, 214, 162, 220, 162, 220, 150, 220, 150, 220, 150, 206, 148, 180, 145, 160, 138, 124]),
    ),
    solid(
      pairs([
        2, 64, 3, 57, 12, 42, 20, 26, 23, 20, 25, 12, 27, 3, 27, 3, 31, 15, 34, 20, 46, 26, 62, 38, 78, 52, 90, 58, 110,
        64, 150, 63, 182, 59, 198, 64, 210, 74, 220, 100, 226, 136, 226, 136, 218, 138, 212, 110, 204, 90, 203, 104, 200,
        122, 194, 140, 196, 160, 194, 195, 196, 212, 198, 220, 198, 220, 186, 220, 186, 220, 185, 206, 183, 182, 180, 160,
        174, 132, 166, 124, 130, 128, 100, 126, 86, 124, 84, 140, 82, 175, 81, 205, 83, 220, 83, 220, 71, 220, 71, 220,
        71, 210, 70, 178, 68, 142, 64, 116, 60, 104, 54, 88, 46, 68, 38, 52, 32, 52, 24, 58, 12, 70, 4, 70,
      ]),
    ),
  ],
};

const bird: Shape = {
  box: [150, 95],
  parts: [
    solid(pairs([64, 76, 66, 90, 63, 95, 63, 95, 70, 95, 70, 95, 69, 90, 69, 76]), false),
    solid(
      pairs([
        1, 30, 1, 30, 14, 23, 22, 14, 34, 10, 46, 14, 58, 26, 80, 36, 105, 48, 148, 70, 148, 70, 146, 78, 146, 78, 100, 70,
        80, 74, 62, 78, 40, 70, 24, 57, 16, 43, 14, 34, 1, 31,
      ]),
    ),
  ],
};

const eagle: Shape = {
  box: [200, 62],
  parts: [
    solid(
      mirrored(100, [
        100, 0, 103, 2, 105, 8, 107, 12, 125, 13, 150, 12, 172, 13, 186, 15, 194, 18, 200, 21, 200, 21, 193, 24, 200, 27,
        200, 27, 192, 30, 197, 34, 197, 34, 188, 36, 170, 39, 145, 42, 120, 45, 108, 44, 106, 50, 112, 60, 112, 60, 100,
        62,
      ]),
    ),
  ],
};

const car: Shape = {
  box: [470, 145],
  parts: [
    solid([
      ...pairs([
        4, 112, 1, 96, 4, 80, 14, 66, 60, 58, 125, 52, 180, 18, 205, 4, 290, 1, 340, 8, 395, 42, 440, 46, 462, 52, 468, 70,
        468, 100, 462, 115, 430, 117,
      ]),
      ...wheelArch(360, 117, 40),
      ...wheelArch(95, 117, 40),
      [20, 117],
    ]),
    solid(ellipse(95, 111, 34, 34, 20)),
    solid(ellipse(360, 111, 34, 34, 20)),
    light(pairs([140, 50, 184, 20, 207, 10, 250, 9, 250, 50])),
    light(pairs([258, 50, 258, 9, 290, 8, 330, 14, 370, 48])),
    light(ellipse(95, 111, 15, 15, 16), true),
    light(ellipse(360, 111, 15, 15, 16), true),
  ],
};

const bus: Shape = {
  box: [1200, 320],
  parts: [
    solid(
      [
        ...pairs([6, 292, 0, 270, 0, 60, 6, 22, 30, 5, 70, 0, 1185, 0, 1196, 6, 1200, 30, 1200, 280, 1194, 292]),
        ...wheelArch(980, 292, 60),
        ...wheelArch(230, 292, 60),
      ],
      false,
    ),
    solid(ellipse(230, 272, 48, 48, 20)),
    solid(ellipse(980, 272, 48, 48, 20)),
    light(pairs([8, 40, 30, 14, 70, 10, 70, 175, 8, 180])),
    light(rect(110, 175, 70, 105)),
    ...Array.from({ length: 9 }, (_, i) => light(rect(100 + i * 118, 50, 106, 105))),
    light(ellipse(230, 272, 20, 20, 16), true),
    light(ellipse(980, 272, 20, 20, 16), true),
  ],
};

const motorcycle: Shape = {
  box: [210, 115],
  parts: [
    solid(ellipse(36, 84, 31, 31, 22)),
    solid(ellipse(174, 84, 31, 31, 22)),
    solid(
      pairs([
        32, 80, 46, 36, 52, 18, 47, 12, 50, 8, 62, 11, 60, 20, 70, 30, 90, 25, 108, 29, 118, 35, 150, 33, 168, 33, 196,
        37, 205, 43, 196, 48, 176, 52, 176, 84, 166, 89, 130, 77, 118, 92, 85, 96, 68, 80, 58, 66, 44, 88,
      ]),
    ),
    light(ellipse(36, 84, 14, 14, 16), true),
    light(ellipse(174, 84, 14, 14, 16), true),
  ],
};

const smallplane: Shape = {
  box: [830, 272],
  parts: [
    solid(rect(0, 30, 5, 180), false),
    solid(
      pairs([
        4, 120, 14, 106, 40, 100, 125, 95, 178, 64, 176, 58, 182, 50, 182, 50, 330, 50, 330, 50, 332, 60, 380, 84, 560,
        104, 700, 108, 770, 18, 770, 18, 810, 14, 810, 14, 820, 110, 828, 128, 790, 132, 700, 134, 520, 141, 330, 160,
        200, 168, 150, 170, 80, 160, 30, 145, 8, 132,
      ]),
    ),
    solid(pairs([688, 118, 830, 116, 830, 126, 690, 127]), false),
    solid(pairs([200, 158, 210, 158, 255, 62, 247, 60]), false),
    solid(pairs([228, 160, 240, 160, 268, 240, 258, 244]), false),
    solid(pairs([56, 150, 66, 150, 70, 246, 60, 246]), false),
    solid(ellipse(265, 250, 22, 22, 18)),
    solid(ellipse(65, 254, 18, 18, 18)),
    light(pairs([132, 94, 176, 68, 328, 64, 368, 86, 330, 100, 140, 104]), true),
  ],
};

const airliner: Shape = {
  box: [376, 118],
  parts: [
    solid(
      pairs([
        1, 86, 4, 76, 12, 67, 24, 62, 300, 61, 318, 58, 352, 2, 352, 2, 368, 1, 368, 1, 372, 50, 376, 62, 374, 68, 340,
        82, 300, 96, 250, 101, 40, 101, 20, 99, 8, 94, 3, 90,
      ]),
    ),
    solid(pairs([115, 93, 200, 88, 240, 92, 200, 96]), false),
    solid(pairs([125, 100, 130, 93, 165, 94, 170, 101, 165, 109, 130, 110])),
    solid(pairs([318, 70, 370, 66, 372, 70, 320, 74]), false),
    solid(pairs([161, 100, 167, 100, 167, 112, 161, 112]), false),
    solid(pairs([39, 100, 43, 100, 43, 112, 39, 112]), false),
    solid(ellipse(164, 113, 5, 5, 12)),
    solid(ellipse(41, 114, 4, 4, 12)),
    light(rect(30, 69, 270, 2.6)),
    light(pairs([7, 71, 13, 66.5, 22, 66, 20, 70.5])),
  ],
};

const house: Shape = {
  box: [100, 80],
  parts: [
    solid(pairs([6, 80, 6, 42, 0, 42, 50, 2, 100, 42, 94, 42, 94, 80]), false),
    solid(pairs([68, 17, 68, 5, 76, 5, 76, 23]), false),
    light(rect(14, 48, 14, 14)),
    light(rect(72, 48, 14, 14)),
    light(rect(44, 58, 12, 22)),
    light(rect(45, 22, 10, 10)),
  ],
};

const box: Shape = {
  box: [100, 100],
  parts: [
    solid(
      pairs([
        0, 6, 0, 6, 6, 0, 6, 0, 94, 0, 94, 0, 100, 6, 100, 6, 100, 94, 100, 94, 94, 100, 94, 100, 6, 100, 6, 100, 0, 94,
        0, 94,
      ]),
    ),
  ],
};

export const SHAPES: Record<ShapeId, Shape> = {
  person,
  bust,
  cat,
  dog,
  horse,
  bird,
  eagle,
  car,
  bus,
  motorcycle,
  smallplane,
  airliner,
  house,
  box,
};

export const SHAPE_NAMES: Record<ShapeId, string> = {
  person: "Person",
  bust: "Head & shoulders",
  cat: "Cat",
  dog: "Dog",
  horse: "Horse",
  bird: "Small bird",
  eagle: "Bird in flight",
  car: "Car",
  bus: "Bus",
  motorcycle: "Motorcycle",
  smallplane: "Small plane",
  airliner: "Airliner",
  house: "House",
  box: "Box",
};

/** Closed SVG path through points; rounded via edge midpoints when `smooth`. */
export function pathFrom(pts: Pt[], smooth: boolean): string {
  const n = pts.length;
  if (n < 2) return "";
  const f = (v: number) => Math.round(v * 1000) / 1000;
  if (!smooth) return `M${pts.map(([x, y]) => `${f(x)} ${f(y)}`).join("L")}Z`;
  const mid = (a: Pt, b: Pt): Pt => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const start = mid(pts[n - 1]!, pts[0]!);
  let d = `M${f(start[0])} ${f(start[1])}`;
  for (let i = 0; i < n; i++) {
    const p = pts[i]!;
    const m = mid(p, pts[(i + 1) % n]!);
    d += `Q${f(p[0])} ${f(p[1])} ${f(m[0])} ${f(m[1])}`;
  }
  return `${d}Z`;
}
