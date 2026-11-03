<script lang="ts">
  import Maximize from "@lucide/svelte/icons/maximize-2";
  import { fmtAperture } from "~/lib/camera";
  import { airyDisc } from "~/lib/optics";
  import { live, prefs, settings, setRange } from "~/lib/store.svelte";
  import { deg, len, num, pct } from "~/lib/units";
  import Segmented from "./ui/Segmented.svelte";

  const m = $derived(live.model);
  const u = $derived(prefs.units);
  const fill = $derived(live.fill);
  const cov = $derived(live.coverage);

  const mp = (w: number, h: number) => `${num(Math.round(w), 0)} × ${num(Math.round(h), 0)} px`;
  const ratio = (r: number) => (r >= 1 ? `${num(r, 2)}:1` : `1:${num(1 / r, 1)}`);

  const groups = $derived([
    {
      title: "Framing",
      rows: [
        ["Subject height in frame", pct(fill.h)],
        ["Subject width in frame", pct(fill.w)],
        ["Picture area covered", pct(cov.frame)],
        ["Subject visible", pct(cov.visible)],
        ["Frame at subject", `${len(m.frameAtSubject.w, u)} × ${len(m.frameAtSubject.h, u)}`],
        ["Angle of view", `${deg(m.aov.h)} × ${deg(m.aov.v)}`],
        ["Diagonal angle", deg(m.aov.d)],
        ["Magnification", Number.isFinite(m.magnification) ? `1:${num(1 / m.magnification, 1)}` : "–"],
        ["Camera height", `${len(m.camera.height, u)}${Math.abs(m.camera.pitch) > 0.002 ? `, tilted ${deg(m.camera.pitch)}` : ""}`],
      ],
    },
    {
      title: "Lens & sensor",
      rows: [
        ["Sensor", m.sensor.name],
        ["Crop factor", `${num(m.cropFactor, 2)}×`],
        ["Full-frame equivalent", `${num(m.equivFocal, 0)} mm`],
        ["Same depth of field as", `${fmtAperture(+m.equivAperture.toFixed(1))} on full frame`],
        ...(m.frame.squeeze > 1
          ? [
              ["Anamorphic", `${m.frame.squeeze}× squeeze`],
              ["Horizontally as wide as", `${num(m.focal / m.frame.squeeze, 0)} mm spherical`],
            ]
          : []),
        ["Picture", mp(m.pixels.frameW, m.pixels.frameH)],
        ["Aspect ratio", ratio(m.frame.width / m.frame.height)],
        ["Subject in pixels", mp(m.pixels.subjectW, m.pixels.subjectH)],
        ["Subject on sensor", `${num(m.onSensor.w, 2)} × ${num(m.onSensor.h, 2)} mm`],
        ["Pixel pitch", `${num(m.pixels.pitch * 1000, 2)} µm`],
        [
          "Diffraction",
          m.aperture > m.diffraction
            ? `softening (Airy disc ${num(airyDisc(m.aperture) / m.pixels.pitch, 1)} px)`
            : `starts beyond ~${fmtAperture(+m.diffraction.toFixed(1))}`,
        ],
      ],
    },
    {
      title: "Focus",
      rows: [
        ["Focused at", len(m.focus, u)],
        ["Near / far limit", `${len(m.dof.near, u)} / ${len(m.dof.far, u)}`],
        ["Depth of field", Number.isFinite(m.dof.total) ? len(m.dof.total, u) : "to infinity"],
        ["In front / behind", `${len(m.focus - m.dof.near, u)} / ${len(m.dof.far - m.focus, u)}`],
        ["Hyperfocal distance", len(m.dof.hyperfocal, u)],
        ["Circle of confusion", `${num(m.coc, 3)} mm`],
        ...(m.background !== null
          ? [
              ["Background at", len(m.background, u)],
              ["Background blur", `${num(m.blur.background / m.pixels.pitch, 0)} px (${pct(m.blur.background / m.frame.usedW)} of width)`],
            ]
          : []),
        ["Blur at infinity", `${num(m.blur.infinity / m.pixels.pitch, 0)} px`],
        ...(settings.focusOnSubject
          ? []
          : [["Subject blur", m.blur.subject <= m.coc ? "sharp" : `${num(m.blur.subject / m.pixels.pitch, 0)} px`]]),
      ],
    },
  ]);

  const target = $derived(Math.round(settings.fillTarget * 100));
</script>

<div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
  <section class="rounded-2xl border border-line bg-surface p-4 md:col-span-2 xl:col-span-3">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h2 class="flex items-center gap-2 text-sm font-semibold"><Maximize class="size-4 text-accent" /> Fit the subject</h2>
      <Segmented
        label="Target size"
        options={[0.5, 0.75, 0.9, 1].map((v) => ({ value: v, label: `${v * 100}%` }))}
        value={settings.fillTarget}
        onchange={(v) => (settings.fillTarget = v)}
        class="w-56"
      />
    </div>
    <p class="mt-1 text-xs text-ink-3">So that {live.subject.name.toLowerCase()} fills {target}% of the frame (the tighter side):</p>
    <div class="mt-3 grid gap-2 sm:grid-cols-2">
      <button
        type="button"
        class="flex items-center justify-between gap-3 rounded-xl border border-line px-3 py-2.5 text-left transition-colors hover:border-accent hover:bg-accent-soft"
        onclick={() => (settings.focal = Math.round(m.fit.focal * 10) / 10)}
      >
        <span>
          <span class="block text-xs text-ink-3">Zoom from here</span>
          <span class="font-mono text-base font-semibold tabular-nums">{num(m.fit.focal, m.fit.focal < 10 ? 1 : 0)} mm</span>
          <span class="text-xs text-ink-3">at {len(m.subjectRange, u)}</span>
        </span>
        <span class="text-xs font-medium text-accent-ink">Use</span>
      </button>
      <button
        type="button"
        class="flex items-center justify-between gap-3 rounded-xl border border-line px-3 py-2.5 text-left transition-colors hover:border-accent hover:bg-accent-soft"
        onclick={() => setRange(m.fit.distance)}
      >
        <span>
          <span class="block text-xs text-ink-3">Or move to</span>
          <span class="font-mono text-base font-semibold tabular-nums">{len(m.fit.distance, u)}</span>
          <span class="text-xs text-ink-3">with {num(m.focal, 0)} mm</span>
        </span>
        <span class="text-xs font-medium text-accent-ink">Use</span>
      </button>
    </div>
  </section>

  {#each groups as g (g.title)}
    <section class="rounded-2xl border border-line bg-surface p-4">
      <h2 class="mb-2 text-sm font-semibold">{g.title}</h2>
      <dl class="divide-y divide-line text-sm">
        {#each g.rows as [k, v] (k)}
          <div class="flex justify-between gap-4 py-1.5">
            <dt class="shrink-0 text-ink-3">{k}</dt>
            <dd class="text-right text-ink tabular-nums">{v}</dd>
          </div>
        {/each}
      </dl>
    </section>
  {/each}
</div>
