// Lengths are always stored in metres; only the display switches to feet.

export type Units = "metric" | "imperial";

export const FOOT = 0.3048;

/** Round to a sensible number of decimals for the size of the number. */
export function num(n: number, digits?: number): string {
  if (!Number.isFinite(n)) return "∞";
  const a = Math.abs(n);
  const d = digits ?? (a >= 100 ? 0 : a >= 10 ? 1 : a >= 1 ? 2 : a >= 0.1 ? 2 : 3);
  return n.toLocaleString("en-US", { maximumFractionDigits: d, minimumFractionDigits: 0 });
}

/** "12.4 m", "38 cm", "3.2 km" — or "41 ft", "9.5 in", "2.1 mi". */
export function len(m: number, units: Units): string {
  if (!Number.isFinite(m)) return "∞";
  if (units === "imperial") {
    const ft = m / FOOT;
    if (Math.abs(ft) >= 5280) return `${num(ft / 5280)} mi`;
    if (Math.abs(ft) < 3) return `${num(ft * 12, Math.abs(ft) < 0.5 ? 1 : 0)} in`;
    return `${num(ft)} ft`;
  }
  if (Math.abs(m) >= 1000) return `${num(m / 1000)} km`;
  if (Math.abs(m) < 1) return `${num(m * 100, Math.abs(m) < 0.1 ? 1 : 0)} cm`;
  return `${num(m)} m`;
}

/** Number shown in a length input (m or ft). */
export function toDisplay(m: number, units: Units): number {
  return units === "imperial" ? m / FOOT : m;
}

export function fromDisplay(v: number, units: Units): number {
  return units === "imperial" ? v * FOOT : v;
}

export function lenUnit(units: Units): string {
  return units === "imperial" ? "ft" : "m";
}

export function pct(fraction: number): string {
  if (!Number.isFinite(fraction)) return "–";
  const p = fraction * 100;
  if (p >= 100) return `${num(p, 0)}%`;
  if (p >= 10) return `${num(p, 0)}%`;
  if (p >= 1) return `${num(p, 1)}%`;
  return `${num(p, 2)}%`;
}

export function deg(rad: number): string {
  const d = (rad * 180) / Math.PI;
  return `${num(d, d >= 10 ? 1 : 2)}°`;
}

/** A 1-2-5 step close to `raw`, for ruler ticks and ground grids. */
export function niceStep(raw: number): number {
  if (!(raw > 0)) return 1;
  const p = 10 ** Math.floor(Math.log10(raw));
  const r = raw / p;
  return (r < 1.5 ? 1 : r < 3.5 ? 2 : r < 7.5 ? 5 : 10) * p;
}

/** Nice step in feet when showing imperial units, returned in metres. */
export function niceStepFor(rawM: number, units: Units): number {
  return units === "imperial" ? niceStep(rawM / FOOT) * FOOT : niceStep(rawM);
}

/** Rounds to `digits` significant digits, without float noise (62.800000000000004). */
export function roundSig(v: number, digits = 3): number {
  if (v === 0 || !Number.isFinite(v)) return v;
  const p = 10 ** (Math.floor(Math.log10(Math.abs(v))) - digits + 1);
  return +(Math.round(v / p) * p).toPrecision(12);
}
