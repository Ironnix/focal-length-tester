// Everything the page shows, computed from the settings and the subject in one pass.

import { findAspect } from "./camera";
import {
  angleOfView,
  autoCoc,
  blurDisc,
  cropFactor,
  depthOfField,
  diffractionLimit,
  distanceToFit,
  focalToFit,
  frameOf,
  imageDistance,
  magnification,
  sensorPixels,
  type DepthOfField,
  type Frame,
} from "./optics";
import { STADIUM, stadiumDistance } from "./backdrop";
import { placement } from "./placement";
import { backgroundOf, sensorSize, type Settings } from "./settings";
import type { Subject } from "./subjects";

export interface Model {
  sensor: { w: number; h: number; short: string; name: string };
  frame: Frame;
  aspectLabel: string;
  focal: number;
  aperture: number;
  /** Distance along the optical axis the lens is focused at, m. */
  focus: number;
  /** Lens-to-sensor distance used for the projection, mm. */
  projection: number;
  coc: number;
  cropFactor: number;
  equivFocal: number;
  equivAperture: number;
  /** Angle of view at infinity focus, radians. */
  aov: { h: number; v: number; d: number };
  /** Size of the frame at the subject's distance, m. */
  frameAtSubject: { w: number; h: number };
  /** Subject size relative to the frame (1 = exactly fills it). */
  fill: { w: number; h: number };
  dof: DepthOfField;
  magnification: number;
  /** Distance (m) of the background from the camera, null without background. */
  background: number | null;
  /** Blur disc diameters on the sensor, mm. */
  blur: { background: number; infinity: number; subject: number };
  pixels: {
    sensorW: number;
    sensorH: number;
    pitch: number;
    /** Delivered picture (desqueezed, cropped, oriented). */
    frameW: number;
    frameH: number;
    subjectW: number;
    subjectH: number;
  };
  /** Subject size on the sensor, mm (physical). */
  onSensor: { w: number; h: number };
  diffraction: number;
  fit: { focal: number; distance: number };
  camera: { height: number; pitch: number };
  /** Distance from the camera to the subject's centre (what "focus on subject" uses), m. */
  subjectRange: number;
}

export function compute(s: Settings, subject: Subject): Model {
  const sensor = sensorSize(s);
  const aspect = findAspect(s.aspect);
  const frame = frameOf({
    sensorW: sensor.w,
    sensorH: sensor.h,
    squeeze: s.squeeze,
    aspect: aspect.ratio,
    portrait: s.portrait,
  });

  // The camera aims at the subject's centre; by default it also stands at that height.
  const centreY = subject.height / 2;
  const camHeight = s.camHeightAuto ? centreY : s.camHeight;
  const pitch = Math.atan2(centreY - camHeight, s.distance);
  const subjectRange = Math.hypot(s.distance, centreY - camHeight);
  const focus = s.focusOnSubject ? subjectRange : s.focus;

  const projection = imageDistance(s.focal, focus);
  const coc = s.cocAuto ? autoCoc(sensor.w, sensor.h) : s.coc;
  const cf = cropFactor(sensor.w, sensor.h);

  const frameW = (frame.width * subjectRange) / projection;
  const frameH = (frame.height * subjectRange) / projection;

  const dof = depthOfField(s.focal, s.aperture, coc, focus);
  const background = backgroundOf(s);
  let bg: number | null = null;
  if (background === "stadium") {
    const p = placement(s);
    bg = stadiumDistance(STADIUM, p.camera, p.forward);
  } else if (background !== "none") {
    bg = s.distance + subject.depth / 2 + s.bgGap;
  }

  const px = sensorPixels(s.megapixels, sensor.w, sensor.h);
  const usedPxW = (frame.usedW / sensor.w) * px.width * frame.squeeze;
  const usedPxH = (frame.usedH / sensor.h) * px.height;
  const outPxW = s.portrait ? usedPxH : usedPxW;
  const outPxH = s.portrait ? usedPxW : usedPxH;

  const fillW = subject.width / frameW;
  const fillH = subject.height / frameH;
  const m = magnification(s.focal, focus);
  // On the physical sensor the squeeze axis is compressed.
  const squeezeAcross = s.portrait ? 1 : frame.squeeze;
  const squeezeUp = s.portrait ? frame.squeeze : 1;

  return {
    sensor,
    frame,
    aspectLabel: s.portrait ? aspect.portrait : aspect.label,
    focal: s.focal,
    aperture: s.aperture,
    focus,
    projection,
    coc,
    cropFactor: cf,
    equivFocal: s.focal * cf,
    equivAperture: s.aperture * cf,
    aov: {
      h: angleOfView(frame.width, s.focal),
      v: angleOfView(frame.height, s.focal),
      d: angleOfView(Math.hypot(frame.width, frame.height), s.focal),
    },
    frameAtSubject: { w: frameW, h: frameH },
    fill: { w: fillW, h: fillH },
    dof,
    magnification: m,
    background: bg,
    blur: {
      background: bg === null ? 0 : blurDisc(s.focal, s.aperture, focus, bg),
      infinity: blurDisc(s.focal, s.aperture, focus, Infinity),
      subject: blurDisc(s.focal, s.aperture, focus, subjectRange),
    },
    pixels: {
      sensorW: px.width,
      sensorH: px.height,
      pitch: px.pitch,
      frameW: outPxW,
      frameH: outPxH,
      subjectW: fillW * outPxW,
      subjectH: fillH * outPxH,
    },
    onSensor: {
      w: (fillW * frame.width) / squeezeAcross,
      h: (fillH * frame.height) / squeezeUp,
    },
    diffraction: diffractionLimit(px.pitch),
    fit: {
      focal: focalToFit(frame, subject.width, subject.height, subjectRange, s.fillTarget),
      distance: distanceToFit(frame, subject.width, subject.height, s.focal, s.fillTarget),
    },
    camera: { height: camHeight, pitch },
    subjectRange,
  };
}
