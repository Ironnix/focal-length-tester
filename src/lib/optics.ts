// Thin-lens optics. Sensor sizes and focal lengths in mm, distances in metres unless a
// name says otherwise. Distances are measured from the lens to the subject.

/** Diagonal of a 36×24 frame, the reference for crop factors. */
export const FF_DIAGONAL = Math.hypot(36, 24);

/** Wavelength used for the diffraction estimate (green light), in mm. */
const WAVELENGTH = 0.00055;

export interface FrameInput {
  /** Physical sensor size, landscape, in mm. */
  sensorW: number;
  sensorH: number;
  /** Anamorphic squeeze (1 = spherical lens). */
  squeeze: number;
  /** Wanted landscape aspect ratio, null = the sensor's own. */
  aspect: number | null;
  portrait: boolean;
}

/**
 * The picture as it is delivered: desqueezed and cropped, in "image mm" — what a sensor of
 * that size would record through a spherical lens. Width and height follow the orientation.
 */
export interface Frame {
  width: number;
  height: number;
  /** The whole desqueezed sensor image before the aspect crop. */
  fullWidth: number;
  fullHeight: number;
  /** Physical sensor area that is used, landscape, in mm. */
  usedW: number;
  usedH: number;
  squeeze: number;
  portrait: boolean;
}

export function frameOf(i: FrameInput): Frame {
  const fullW = i.sensorW * i.squeeze;
  const fullH = i.sensorH;
  let w = fullW;
  let h = fullH;
  if (i.aspect) {
    if (fullW / fullH > i.aspect) w = fullH * i.aspect;
    else h = fullW / i.aspect;
  }
  const shape = i.portrait
    ? { width: h, height: w, fullWidth: fullH, fullHeight: fullW }
    : { width: w, height: h, fullWidth: fullW, fullHeight: fullH };
  return { ...shape, usedW: w / i.squeeze, usedH: h, squeeze: i.squeeze, portrait: i.portrait };
}

export function cropFactor(sensorW: number, sensorH: number): number {
  return FF_DIAGONAL / Math.hypot(sensorW, sensorH);
}

/** Circle of confusion from the usual "diagonal / 1442" rule: 0.030 mm on full frame. */
export function autoCoc(sensorW: number, sensorH: number): number {
  return Math.hypot(sensorW, sensorH) / 1442;
}

/** Angle of view (radians) of an image size through a focal length (both mm). */
export function angleOfView(size: number, focal: number): number {
  return 2 * Math.atan(size / (2 * focal));
}

/**
 * Lens-to-sensor distance when focused at `focusM` (mm). It replaces the focal length in
 * the pinhole projection, so framing changes a little at close focus like a real lens.
 */
export function imageDistance(focal: number, focusM: number): number {
  const u = focusM * 1000;
  return u > focal * 1.001 ? (focal * u) / (u - focal) : focal * 1000;
}

/** Size (m) that an image dimension (mm) covers at a distance (m). */
export function coverageAt(imageSize: number, focal: number, focusM: number, distanceM: number): number {
  return (imageSize * distanceM) / imageDistance(focal, focusM);
}

export interface DepthOfField {
  near: number;
  far: number;
  hyperfocal: number;
  total: number;
}

export function depthOfField(focal: number, fNumber: number, coc: number, focusM: number): DepthOfField {
  const f = focal;
  const u = focusM * 1000;
  const H = (f * f) / (fNumber * coc) + f;
  const near = (u * (H - f)) / (H + u - 2 * f);
  const far = u >= H ? Infinity : (u * (H - f)) / (H - u);
  return {
    near: near / 1000,
    far: far / 1000,
    hyperfocal: H / 1000,
    total: far === Infinity ? Infinity : (far - near) / 1000,
  };
}

/** Blur disc diameter on the sensor (mm) of a point at `xM` while focused at `focusM`. */
export function blurDisc(focal: number, fNumber: number, focusM: number, xM: number): number {
  const u = focusM * 1000;
  if (u <= focal) return 0;
  const atInfinity = (focal * focal) / (fNumber * (u - focal));
  if (!Number.isFinite(xM)) return atInfinity;
  const x = xM * 1000;
  return (atInfinity * Math.abs(x - u)) / x;
}

/** Image magnification at the focus distance (subject size × m = size on the sensor). */
export function magnification(focal: number, focusM: number): number {
  const u = focusM * 1000;
  return u > focal ? focal / (u - focal) : Infinity;
}

/**
 * Focal length (mm) that makes the subject fill `target` of the frame at `distanceM`
 * (the tighter of width and height decides).
 */
export function focalToFit(frame: Frame, subjectW: number, subjectH: number, distanceM: number, target: number) {
  const u = distanceM * 1000;
  const byW = (frame.width * u) / (frame.width + (subjectW * 1000) / target);
  const byH = (frame.height * u) / (frame.height + (subjectH * 1000) / target);
  return Math.min(byW, byH);
}

/** Distance (m) at which the subject fills `target` of the frame with focal length `focal`. */
export function distanceToFit(frame: Frame, subjectW: number, subjectH: number, focal: number, target: number) {
  const byW = focal * ((subjectW * 1000) / (target * frame.width) + 1);
  const byH = focal * ((subjectH * 1000) / (target * frame.height) + 1);
  return Math.max(byW, byH) / 1000;
}

export interface SensorPixels {
  /** Whole sensor, landscape. */
  width: number;
  height: number;
  /** Pixel pitch in mm. */
  pitch: number;
}

export function sensorPixels(megapixels: number, sensorW: number, sensorH: number): SensorPixels {
  const width = Math.sqrt((megapixels * 1e6 * sensorW) / sensorH);
  return { width, height: (megapixels * 1e6) / width, pitch: sensorW / width };
}

/** f-number where the Airy disc reaches two pixels — from there on, stopping down softens. */
export function diffractionLimit(pitch: number): number {
  return (2 * pitch) / (2.44 * WAVELENGTH);
}

export function airyDisc(fNumber: number): number {
  return 2.44 * WAVELENGTH * fNumber;
}
