import { describe, expect, test } from "bun:test";
import { compute } from "../src/lib/model";
import {
  angleOfView,
  autoCoc,
  blurDisc,
  cropFactor,
  depthOfField,
  distanceToFit,
  focalToFit,
  frameOf,
  imageDistance,
} from "../src/lib/optics";
import { aim, placement, toCamera } from "../src/lib/placement";
import { DEFAULT_SETTINGS, fromQuery, toQuery } from "../src/lib/settings";
import { PRESET_SUBJECTS } from "../src/lib/subjects";

const ff = frameOf({ sensorW: 36, sensorH: 24, squeeze: 1, aspect: null, portrait: false });
const deg = (r: number) => (r * 180) / Math.PI;

describe("framing", () => {
  test("50 mm on full frame has the textbook angle of view", () => {
    expect(deg(angleOfView(ff.width, 50))).toBeCloseTo(39.6, 1);
    expect(deg(angleOfView(ff.height, 50))).toBeCloseTo(27.0, 1);
  });

  test("crop factors", () => {
    expect(cropFactor(36, 24)).toBeCloseTo(1, 5);
    expect(cropFactor(23.5, 15.6)).toBeCloseTo(1.53, 2);
    expect(cropFactor(17.3, 13)).toBeCloseTo(2.0, 1);
  });

  test("frame width at 10 m with 50 mm (thin lens)", () => {
    // 36 mm × (10000 − 50) / 50 = 7.164 m
    expect((ff.width * 10) / imageDistance(50, 10)).toBeCloseTo(7.164, 3);
  });

  test("aspect crop keeps the shorter side", () => {
    const wide = frameOf({ sensorW: 36, sensorH: 24, squeeze: 1, aspect: 16 / 9, portrait: false });
    expect(wide.width).toBeCloseTo(36);
    expect(wide.height).toBeCloseTo(20.25);
    const square = frameOf({ sensorW: 36, sensorH: 24, squeeze: 1, aspect: 1, portrait: true });
    expect(square.width).toBeCloseTo(24);
    expect(square.height).toBeCloseTo(24);
  });

  test("2× anamorphic doubles the image width", () => {
    const a = frameOf({ sensorW: 24.89, sensorH: 18.66, squeeze: 2, aspect: 2.39, portrait: false });
    expect(a.width / a.height).toBeCloseTo(2.39);
    expect(a.height).toBeCloseTo(18.66);
    expect(a.usedW).toBeCloseTo((18.66 * 2.39) / 2);
  });

  test("portrait swaps width and height", () => {
    const p = frameOf({ sensorW: 36, sensorH: 24, squeeze: 1, aspect: null, portrait: true });
    expect(p.width).toBe(24);
    expect(p.height).toBe(36);
  });
});

describe("depth of field", () => {
  test("50 mm f/8 at 5 m on full frame (c = 0.03)", () => {
    const d = depthOfField(50, 8, 0.03, 5);
    expect(d.hyperfocal).toBeCloseTo(10.47, 1);
    expect(d.near).toBeCloseTo(3.39, 1);
    expect(d.far).toBeCloseTo(9.52, 1);
  });

  test("beyond the hyperfocal distance the far limit is infinity", () => {
    const d = depthOfField(24, 11, 0.03, 5);
    expect(d.far).toBe(Infinity);
    expect(d.total).toBe(Infinity);
  });

  test("auto circle of confusion", () => {
    expect(autoCoc(36, 24)).toBeCloseTo(0.03, 3);
  });

  test("blur disc is zero at the focus distance and grows behind it", () => {
    expect(blurDisc(85, 1.4, 3, 3)).toBeCloseTo(0, 6);
    const near = blurDisc(85, 1.4, 3, 6);
    const far = blurDisc(85, 1.4, 3, 30);
    expect(far).toBeGreaterThan(near);
    expect(blurDisc(85, 1.4, 3, Infinity)).toBeGreaterThan(far);
  });
});

describe("fitting", () => {
  test("focal and distance to fit agree with each other", () => {
    const person = { w: 0.5, h: 1.75 };
    const f = focalToFit(ff, person.w, person.h, 10, 0.9);
    // with that focal length, the fitting distance is the same 10 m
    expect(distanceToFit(ff, person.w, person.h, f, 0.9)).toBeCloseTo(10, 5);
  });

  test("the model reports ~90% fill after applying the fit", () => {
    const person = PRESET_SUBJECTS[0]!;
    const m0 = compute(DEFAULT_SETTINGS, person);
    const m1 = compute({ ...DEFAULT_SETTINGS, focal: m0.fit.focal }, person);
    expect(Math.max(m1.fill.h, m1.fill.w)).toBeCloseTo(0.9, 3);
  });
});

describe("share links", () => {
  test("round trip", () => {
    const s = { ...DEFAULT_SETTINGS, focal: 135, distance: 23.77, field: "tennis" as const, portrait: true };
    const q = toQuery(s, PRESET_SUBJECTS[0]!);
    const back = fromQuery(q);
    expect(back?.settings.focal).toBe(135);
    expect(back?.settings.distance).toBe(23.77);
    expect(back?.settings.field).toBe("tennis");
    expect(back?.settings.portrait).toBe(true);
  });

  test("compare links carry both setups", () => {
    const a = { ...DEFAULT_SETTINGS, focal: 24, distance: 8 };
    const b = { ...DEFAULT_SETTINGS, focal: 400, distance: 120, sensor: "apsc" };
    const back = fromQuery(toQuery(a, PRESET_SUBJECTS[0]!, { settings: b, subject: PRESET_SUBJECTS[0]! }))!;
    expect(back.settings.focal).toBe(24);
    expect(back.versus?.settings.focal).toBe(400);
    expect(back.versus?.settings.sensor).toBe("apsc");
    // B equal to the defaults still counts as a compare link
    expect(fromQuery(toQuery(DEFAULT_SETTINGS, PRESET_SUBJECTS[0]!, { settings: DEFAULT_SETTINGS, subject: PRESET_SUBJECTS[0]! }))?.versus).not.toBeNull();
  });

  test("ignores unrelated query strings", () => {
    expect(fromQuery("utm_source=x")).toBeNull();
  });

  test("clamps nonsense", () => {
    expect(fromQuery("f=-5&d=abc")?.settings.focal).toBe(1);
    expect(fromQuery("f=-5&d=abc")?.settings.distance).toBe(DEFAULT_SETTINGS.distance);
  });
});

describe("placement on a field", () => {
  const base = { ...DEFAULT_SETTINGS, field: "football" as const };

  test("default camera looks down the field", () => {
    const p = placement({ ...base, distance: 105 });
    expect(p.subject[0]).toBeCloseTo(0);
    expect(p.subject[1]).toBeCloseTo(105);
  });

  test("a field point straight ahead lands on the camera axis", () => {
    // camera in a corner, aiming at the centre spot
    const a = aim([-34, 0], [0, 52.5]);
    const p = placement({ ...base, camX: -34, camZ: 0, yaw: a.yaw, distance: a.distance });
    const [x, z] = toCamera(p, [0, 52.5]);
    expect(x).toBeCloseTo(0, 6);
    expect(z).toBeCloseTo(Math.hypot(34, 52.5), 6);
    expect(p.subject[0]).toBeCloseTo(0, 6);
    expect(p.subject[1]).toBeCloseTo(52.5, 6);
  });

  test("turning right puts the old forward on the left", () => {
    const p = placement({ ...base, yaw: 90 });
    // field point ahead of the original view (+z) is now to the camera's left
    expect(toCamera(p, [0, 10])[0]).toBeCloseTo(-10, 6);
  });

  test("without a field the position is ignored", () => {
    const p = placement({ ...DEFAULT_SETTINGS, field: "none", camX: 20, yaw: 45 });
    expect(p.camera).toEqual([0, 0]);
    expect(p.forward[0]).toBeCloseTo(0);
  });

  test("camera position survives a share link", () => {
    const q = toQuery({ ...base, camX: -34, camZ: 0, yaw: 32.9 }, PRESET_SUBJECTS[0]!);
    const back = fromQuery(q)!.settings;
    expect([back.camX, back.camZ, back.yaw]).toEqual([-34, 0, 32.9]);
  });
});
