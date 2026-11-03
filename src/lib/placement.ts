// Where the camera stands and where it looks. On a field the camera can stand anywhere and
// always aims at the subject; without a field it sits at the origin looking along +z.
//
// Field coordinates: x across, z along the field (see fields.ts). Camera coordinates:
// x' to the camera's right, z' straight ahead — what scene.ts projects.

import type { Field } from "./fields";
import type { Settings } from "./settings";

export type P = [number, number];

export interface Placement {
  camera: P;
  /** Unit vectors on the ground, as [x, z]. */
  forward: P;
  right: P;
  /** Front centre of the subject. */
  subject: P;
  yaw: number;
}

export function placement(s: Settings): Placement {
  const onField = s.field !== "none";
  const camera: P = onField ? [s.camX, s.camZ] : [0, 0];
  const yaw = onField ? (s.yaw * Math.PI) / 180 : 0;
  const forward: P = [Math.sin(yaw), Math.cos(yaw)];
  const right: P = [Math.cos(yaw), -Math.sin(yaw)];
  return {
    camera,
    forward,
    right,
    subject: [camera[0] + forward[0] * s.distance, camera[1] + forward[1] * s.distance],
    yaw,
  };
}

/** A point `ahead` metres along the line of sight and `side` metres to the right of it. */
export function along(p: Placement, ahead: number, side = 0): P {
  return [
    p.camera[0] + p.forward[0] * ahead + p.right[0] * side,
    p.camera[1] + p.forward[1] * ahead + p.right[1] * side,
  ];
}

/** Field point → camera coordinates [x', z']. */
export function toCamera(p: Placement, [x, z]: P): P {
  const dx = x - p.camera[0];
  const dz = z - p.camera[1];
  return [dx * p.right[0] + dz * p.right[1], dx * p.forward[0] + dz * p.forward[1]];
}

/** Ground distance and yaw (degrees) from a camera spot to a point. */
export function aim(from: P, to: P): { distance: number; yaw: number } {
  const dx = to[0] - from[0];
  const dz = to[1] - from[1];
  return { distance: Math.hypot(dx, dz), yaw: (Math.atan2(dx, dz) * 180) / Math.PI };
}

export interface CameraSpot {
  id: string;
  label: string;
  at: P;
}

/** Typical places to stand around a field. */
export function cameraSpots(field: Field): CameraSpot[] {
  const { length: L, width: W } = field;
  return [
    { id: "end", label: "End line", at: [0, 0] },
    { id: "behind", label: "Behind the end", at: [0, -Math.max(3, L * 0.06)] },
    { id: "corner", label: "Corner", at: [-W / 2, 0] },
    { id: "side", label: "Side line, middle", at: [-W / 2 - 1.5, L / 2] },
  ];
}
