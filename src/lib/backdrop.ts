// Photographic backdrops: 360° panoramas (equirectangular, CC0 from Poly Haven) drawn with
// WebGL behind the SVG scene.
//
// - A sky is infinitely far away, so it only depends on the viewing direction — correct from
//   any camera position.
// - The stadium photo was taken from one spot on the pitch. It is projected onto a box around
//   the field (the line of the advertising boards): each ray from our camera hits the box, and
//   the colour is taken from the photo in the direction from the photo's own spot to that hit
//   point. The stands therefore stay in place when the camera moves (corner, side line, …).
//
// Panorama files keep latitude −10°…+90° only (the ground below is drawn by the app).

export type SkyId = "clouds" | "clear" | "sunset" | "overcast" | "plain";

export const SKIES: { id: SkyId; label: string; file: string | null }[] = [
  { id: "clouds", label: "Partly cloudy", file: "sky-clouds.jpg" },
  { id: "clear", label: "Clear", file: "sky-clear.jpg" },
  { id: "sunset", label: "Sunset", file: "sky-sunset.jpg" },
  { id: "overcast", label: "Overcast", file: "sky-overcast.jpg" },
  { id: "plain", label: "Plain colour", file: null },
];

export interface StadiumPhoto {
  file: string;
  /** Box the photo is projected onto, in field coordinates (metres). */
  box: { minX: number; maxX: number; minZ: number; maxZ: number };
  /** Where the photo was taken (x, height, z). */
  capture: [number, number, number];
}

/**
 * "Stadium 01" by Sergej Majboroda (Poly Haven, CC0), taken near the centre spot about 1.8 m
 * up. The box comes from where the grass meets the boards in the photo: ~56–59 m to the ends,
 * 34–42 m to the sides.
 */
export const STADIUM: StadiumPhoto = {
  file: "stadium.jpg",
  box: { minX: -37.7, maxX: 37.7, minZ: -4.65, maxZ: 109.65 },
  capture: [-4.2, 1.8, 53.95],
};

const LAT_MIN = (-10 * Math.PI) / 180;
const LAT_MAX = Math.PI / 2;

export interface BackdropView {
  file: string;
  stadium: StadiumPhoto | null;
  /** Camera in field coordinates: x, height, z. */
  camera: [number, number, number];
  yaw: number;
  pitch: number;
  /** Projection focal length and visible area, image mm. */
  focal: number;
  viewW: number;
  viewH: number;
  /** Gaussian sigma of the blur, image mm (0 = sharp). */
  blur: number;
}

/** Distance along the line of sight to the stadium box (the stands behind the subject). */
export function stadiumDistance(
  s: StadiumPhoto,
  camera: [number, number],
  forward: [number, number],
): number {
  const { minX, maxX, minZ, maxZ } = s.box;
  const tx = forward[0] > 1e-9 ? (maxX - camera[0]) / forward[0] : forward[0] < -1e-9 ? (minX - camera[0]) / forward[0] : Infinity;
  const tz = forward[1] > 1e-9 ? (maxZ - camera[1]) / forward[1] : forward[1] < -1e-9 ? (minZ - camera[1]) / forward[1] : Infinity;
  return Math.max(1, Math.min(tx, tz));
}

// ---- WebGL renderer (one shared context, copied into each view's 2D canvas) --------------

const VERT = `#version 300 es
in vec2 pos;
out vec2 uv;
void main() {
  uv = pos * 0.5 + 0.5;
  gl_Position = vec4(pos, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;
in vec2 uv;
out vec4 color;
uniform sampler2D tex;
uniform vec2 halfSize;
uniform float focal;
uniform float pitch;
uniform float yaw;
uniform vec3 cam;
uniform int stadium;
uniform vec4 box;
uniform vec3 capture;
uniform vec2 latRange;
const float PI = 3.14159265359;

void main() {
  vec2 p = (uv * 2.0 - 1.0) * halfSize;
  vec3 rc = normalize(vec3(p.x, p.y, focal));
  float cp = cos(pitch), sp = sin(pitch);
  vec3 r1 = vec3(rc.x, rc.y * cp + rc.z * sp, -rc.y * sp + rc.z * cp);
  float cy = cos(yaw), sy = sin(yaw);
  vec3 d = vec3(r1.x * cy + r1.z * sy, r1.y, -r1.x * sy + r1.z * cy);

  vec3 dir = d;
  if (stadium == 1) {
    vec2 dd = vec2(abs(d.x) < 1e-6 ? 1e-6 : d.x, abs(d.z) < 1e-6 ? 1e-6 : d.z);
    vec2 t1 = (box.xz - cam.xz) / dd;
    vec2 t2 = (box.yw - cam.xz) / dd;
    vec2 tf = max(t1, t2);
    float t = min(tf.x, tf.y);
    if (t > 0.0) dir = normalize(cam + d * t - capture);
  }

  float lon = atan(dir.x, dir.z);
  float lat = asin(clamp(dir.y, -1.0, 1.0));
  vec2 st = vec2(lon / (2.0 * PI) + 0.5, (latRange.y - lat) / (latRange.y - latRange.x));
  // Mip level from the derivatives, with the longitude seam unwrapped.
  vec2 dx = dFdx(st);
  vec2 dy = dFdy(st);
  dx.x -= floor(dx.x + 0.5);
  dy.x -= floor(dy.x + 0.5);
  color = textureGrad(tex, vec2(fract(st.x), clamp(st.y, 0.0, 1.0)), dx, dy);
}`;

interface Renderer {
  gl: WebGL2RenderingContext;
  canvas: HTMLCanvasElement;
  program: WebGLProgram;
  loc: Record<string, WebGLUniformLocation | null>;
}

let renderer: Renderer | null | undefined;
const textures = new Map<string, WebGLTexture | "loading" | "failed">();
const listeners = new Set<() => void>();

function init(): Renderer | null {
  if (renderer !== undefined) return renderer;
  renderer = null;
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl2", { premultipliedAlpha: false, antialias: false });
  if (!gl) return null;
  const compile = (type: number, src: string) => {
    const sh = gl.createShader(type)!;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) ?? "shader");
    return sh;
  };
  try {
    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? "link");
    gl.useProgram(program);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(program, "pos");
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
    const loc: Renderer["loc"] = {};
    for (const n of ["tex", "halfSize", "focal", "pitch", "yaw", "cam", "stadium", "box", "capture", "latRange"]) {
      loc[n] = gl.getUniformLocation(program, n);
    }
    renderer = { gl, canvas, program, loc };
  } catch (e) {
    console.warn("Backdrop disabled:", e);
    renderer = null;
  }
  return renderer;
}

/** Called whenever a panorama finishes loading, so views can redraw. */
export function onTexture(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function texture(r: Renderer, url: string): WebGLTexture | null {
  const t = textures.get(url);
  if (t && t !== "loading" && t !== "failed") return t;
  if (t) return null;
  textures.set(url, "loading");
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.decoding = "async";
  img.onload = () => {
    const { gl } = r;
    let source: TexImageSource = img;
    const max = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
    if (img.width > max) {
      // older phones: scale down to what the GPU accepts
      const c = document.createElement("canvas");
      c.width = max;
      c.height = Math.round((img.height * max) / img.width);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      source = c;
    }
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    textures.set(url, tex);
    for (const fn of listeners) fn();
  };
  img.onerror = () => textures.set(url, "failed");
  img.src = url;
  return null;
}

export function backdropSupported(): boolean {
  return init() !== null;
}

/**
 * Draws the backdrop into `target` (its width/height in device pixels). `extra` is the
 * fraction of the view added on every side (room for the blur). Returns false while the
 * panorama is still loading or WebGL is unavailable.
 */
export function drawBackdrop(target: HTMLCanvasElement, v: BackdropView, url: string, extra: number): boolean {
  const r = init();
  if (!r) return false;
  const tex = texture(r, url);
  if (!tex) return false;
  const { gl, canvas, loc } = r;
  const w = target.width;
  const h = target.height;
  if (w < 2 || h < 2) return false;
  // The shared canvas only grows, so small thumbnails and the big view don't keep reallocating it.
  if (canvas.width < w || canvas.height < h) {
    canvas.width = Math.max(canvas.width, w);
    canvas.height = Math.max(canvas.height, h);
  }
  gl.viewport(0, 0, w, h);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.uniform1i(loc.tex!, 0);
  gl.uniform2f(loc.halfSize!, (v.viewW / 2) * (1 + 2 * extra), (v.viewH / 2) * (1 + 2 * extra));
  gl.uniform1f(loc.focal!, v.focal);
  gl.uniform1f(loc.pitch!, v.pitch);
  gl.uniform1f(loc.yaw!, v.yaw);
  gl.uniform3f(loc.cam!, ...v.camera);
  gl.uniform1i(loc.stadium!, v.stadium ? 1 : 0);
  if (v.stadium) {
    const b = v.stadium.box;
    gl.uniform4f(loc.box!, b.minX, b.maxX, b.minZ, b.maxZ);
    gl.uniform3f(loc.capture!, ...v.stadium.capture);
  }
  gl.uniform2f(loc.latRange!, LAT_MIN, LAT_MAX);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  const ctx = target.getContext("2d");
  if (!ctx) return false;
  ctx.clearRect(0, 0, w, h);
  // WebGL draws from the bottom-left corner of its canvas.
  ctx.drawImage(canvas, 0, canvas.height - h, w, h, 0, 0, w, h);
  return true;
}
