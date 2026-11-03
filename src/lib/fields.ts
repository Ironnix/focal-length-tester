// Sports grounds drawn to scale on the ground plane. Coordinates: x across (metres, 0 = the
// camera's line of sight), z along the line of sight. The camera stands at z = 0 on the
// middle of one end line and looks down the length of the field.

export type FieldId = "none" | "football" | "hockey" | "basketball" | "tennis";

type P = [number, number];

export interface FieldLine {
  pts: P[];
  color: string;
  closed?: boolean;
  /** Line width in metres (the viewfinder draws it to scale, the map uses a hairline). */
  width: number;
}

export interface FieldArea {
  pts: P[];
  color: string;
}

export interface Field {
  id: FieldId;
  name: string;
  length: number;
  width: number;
  /** Ground around the field. */
  surround: string;
  areas: FieldArea[];
  lines: FieldLine[];
}

export const FIELD_NAMES: Record<FieldId, string> = {
  none: "None",
  football: "Football pitch",
  hockey: "Ice hockey rink",
  basketball: "Basketball court",
  tennis: "Tennis court",
};

function rect(x0: number, z0: number, x1: number, z1: number): P[] {
  return [
    [x0, z0],
    [x1, z0],
    [x1, z1],
    [x0, z1],
  ];
}

/** Arc around (cx, cz); angle 0 points along +z, 90° along +x. */
function arc(cx: number, cz: number, r: number, fromDeg: number, toDeg: number, n = 32): P[] {
  return Array.from({ length: n + 1 }, (_, i): P => {
    const a = ((fromDeg + ((toDeg - fromDeg) * i) / n) * Math.PI) / 180;
    return [cx + r * Math.sin(a), cz + r * Math.cos(a)];
  });
}

const circle = (cx: number, cz: number, r: number, n = 48) => arc(cx, cz, r, 0, 360, n);

/** The far-end copy of a feature drawn at the near end. */
function flip(pts: P[], length: number): P[] {
  return pts.map(([x, z]) => [x, length - z]);
}

function football(): Field {
  const L = 105;
  const W = 68;
  const white = "#f4f7f2";
  const lw = 0.12;
  const lines: FieldLine[] = [];
  const add = (pts: P[], closed = false) => lines.push({ pts, color: white, closed, width: lw });
  add(rect(-W / 2, 0, W / 2, L), true);
  add([
    [-W / 2, L / 2],
    [W / 2, L / 2],
  ]);
  add(circle(0, L / 2, 9.15), true);
  add(circle(0, L / 2, 0.22, 10), true);
  for (const end of [false, true]) {
    const m = (pts: P[]) => (end ? flip(pts, L) : pts);
    add(m(rect(-20.16, 0, 20.16, 16.5)), true);
    add(m(rect(-9.16, 0, 9.16, 5.5)), true);
    add(m(circle(0, 11, 0.22, 10)), true);
    add(m(arc(0, 11, 9.15, -53.1, 53.1, 24)));
    add(m(rect(-3.66, -2, 3.66, 0)), true);
  }
  for (const [cx, cz, from] of [
    [-W / 2, 0, 0],
    [W / 2, 0, 270],
    [-W / 2, L, 90],
    [W / 2, L, 180],
  ] as const) {
    add(arc(cx, cz, 1, from, from + 90, 8));
  }
  // mowing stripes along the length
  const areas: FieldArea[] = [];
  for (let i = 0; i < 18; i++) {
    const z0 = (i * L) / 18;
    areas.push({ pts: rect(-W / 2, z0, W / 2, z0 + L / 18), color: i % 2 ? "#679c55" : "#6fa75c" });
  }
  return { id: "football", name: FIELD_NAMES.football, length: L, width: W, surround: "#5e8f4f", areas, lines };
}

function rinkOutline(L: number, W: number, r: number): P[] {
  const hw = W / 2;
  return [
    ...arc(hw - r, r, r, 180, 90, 12),
    ...arc(hw - r, L - r, r, 90, 0, 12),
    ...arc(-hw + r, L - r, r, 0, -90, 12),
    ...arc(-hw + r, r, r, -90, -180, 12),
  ];
}

function hockey(): Field {
  const L = 60;
  const W = 30;
  const r = 8.5;
  const red = "#c8303a";
  const blue = "#2f5fb8";
  // half width of the rink at distance z from an end (the corners are rounded)
  const halfAt = (z: number) => W / 2 - r + Math.sqrt(Math.max(0, r * r - (r - z) ** 2));
  const lines: FieldLine[] = [{ pts: rinkOutline(L, W, r), color: "#58616b", closed: true, width: 0.2 }];
  const across = (z: number, color: string, width: number) =>
    lines.push({
      pts: [
        [-halfAt(Math.min(z, L - z)), z],
        [halfAt(Math.min(z, L - z)), z],
      ],
      color,
      width,
    });
  across(L / 2, red, 0.3);
  for (const z of [22.86, L - 22.86]) across(z, blue, 0.3);
  for (const z of [4, L - 4]) across(z, red, 0.05);
  lines.push({ pts: circle(0, L / 2, 4.5), color: blue, closed: true, width: 0.05 });
  for (const z of [10, L - 10]) {
    for (const x of [-7, 7]) lines.push({ pts: circle(x, z, 4.5), color: red, closed: true, width: 0.05 });
  }
  const goal: P[] = [
    [-0.915, 4],
    [-0.915, 2.9],
    [0.915, 2.9],
    [0.915, 4],
  ];
  lines.push({ pts: goal, color: red, width: 0.08 }, { pts: flip(goal, L), color: red, width: 0.08 });
  const areas: FieldArea[] = [{ pts: rinkOutline(L, W, r), color: "#eef3f6" }];
  const crease = arc(0, 4, 1.83, -90, 90, 16);
  areas.push({ pts: crease, color: "#a9cdea" }, { pts: flip(crease, L), color: "#a9cdea" });
  return { id: "hockey", name: FIELD_NAMES.hockey, length: L, width: W, surround: "#4b525a", areas, lines };
}

function basketball(): Field {
  const L = 28;
  const W = 15;
  const white = "#f6f1e9";
  const lw = 0.05;
  const lines: FieldLine[] = [];
  const add = (pts: P[], closed = false) => lines.push({ pts, color: white, closed, width: lw });
  add(rect(-W / 2, 0, W / 2, L), true);
  add([
    [-W / 2, L / 2],
    [W / 2, L / 2],
  ]);
  add(circle(0, L / 2, 1.8), true);
  const areas: FieldArea[] = [{ pts: rect(-W / 2, 0, W / 2, L), color: "#c99a62" }];
  for (const end of [false, true]) {
    const m = (pts: P[]) => (end ? flip(pts, L) : pts);
    areas.push({ pts: m(rect(-2.45, 0, 2.45, 5.8)), color: "#b4774a" });
    add(m(rect(-2.45, 0, 2.45, 5.8)), true);
    add(m(arc(0, 5.8, 1.8, -90, 90, 16)));
    const a = (Math.asin(6.6 / 6.75) * 180) / Math.PI;
    add(m([[-6.6, 0], ...arc(0, 1.575, 6.75, -a, a, 32), [6.6, 0]]));
    add(m(circle(0, 1.575, 0.23, 12)), true);
  }
  return { id: "basketball", name: FIELD_NAMES.basketball, length: L, width: W, surround: "#8a7562", areas, lines };
}

function tennis(): Field {
  const L = 23.77;
  const W = 10.97;
  const sw = 8.23;
  const white = "#f5f8fb";
  const lw = 0.05;
  const lines: FieldLine[] = [];
  const add = (pts: P[], closed = false) => lines.push({ pts, color: white, closed, width: lw });
  add(rect(-W / 2, 0, W / 2, L), true);
  for (const x of [-sw / 2, sw / 2]) {
    add([
      [x, 0],
      [x, L],
    ]);
  }
  for (const z of [L / 2 - 6.4, L / 2 + 6.4]) {
    add([
      [-sw / 2, z],
      [sw / 2, z],
    ]);
  }
  add([
    [0, L / 2 - 6.4],
    [0, L / 2 + 6.4],
  ]);
  for (const z of [0, L]) {
    add([
      [0, z],
      [0, z === 0 ? 0.3 : L - 0.3],
    ]);
  }
  lines.push({
    pts: [
      [-W / 2 - 0.9, L / 2],
      [W / 2 + 0.9, L / 2],
    ],
    color: "#20262c",
    width: 0.1,
  });
  const areas: FieldArea[] = [
    { pts: rect(-W / 2 - 4, -5, W / 2 + 4, L + 5), color: "#4f7f63" },
    { pts: rect(-W / 2, 0, W / 2, L), color: "#3c6c9e" },
  ];
  return { id: "tennis", name: FIELD_NAMES.tennis, length: L, width: W, surround: "#5f8a5c", areas, lines };
}

const BUILDERS: Record<Exclude<FieldId, "none">, () => Field> = { football, hockey, basketball, tennis };
const cache = new Map<FieldId, Field>();

export function getField(id: FieldId): Field | null {
  if (id === "none") return null;
  let f = cache.get(id);
  if (!f) {
    f = BUILDERS[id]();
    cache.set(id, f);
  }
  return f;
}
