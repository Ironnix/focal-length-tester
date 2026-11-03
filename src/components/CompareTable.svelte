<script lang="ts">
  // Key numbers of setups A and B next to each other.
  import { fmtAperture } from "~/lib/camera";
  import { compare, editSide, live, prefs, type Analysis } from "~/lib/store.svelte";
  import { deg, len, num, pct } from "~/lib/units";

  const u = $derived(prefs.units);

  const rows: { label: string; value: (v: Analysis) => string; focus?: boolean }[] = [
    { label: "Subject", value: (v) => v.subject.name },
    { label: "Lens", value: (v) => `${num(v.model.focal, 0)} mm ${fmtAperture(v.model.aperture)}` },
    { label: "Distance", value: (v) => len(v.settings.distance, u) },
    { label: "Sensor", value: (v) => `${v.model.sensor.short}${v.model.aspectLabel === "Native" ? "" : ` ${v.model.aspectLabel}`}` },
    { label: "Subject height in frame", value: (v) => pct(v.fill.h) },
    { label: "Subject width in frame", value: (v) => pct(v.fill.w) },
    { label: "Picture area covered", value: (v) => pct(v.coverage.frame) },
    { label: "Frame at subject", value: (v) => `${len(v.model.frameAtSubject.w, u)} × ${len(v.model.frameAtSubject.h, u)}` },
    { label: "In focus", value: (v) => `${len(v.model.dof.near, u)} – ${len(v.model.dof.far, u)}`, focus: true },
    { label: "Depth of field", value: (v) => (Number.isFinite(v.model.dof.total) ? len(v.model.dof.total, u) : "∞") },
    { label: "Angle of view", value: (v) => `${deg(v.model.aov.h)} × ${deg(v.model.aov.v)}` },
    { label: "Full-frame equivalent", value: (v) => `${num(v.model.equivFocal, 0)} mm ${fmtAperture(+v.model.equivAperture.toFixed(1))}` },
    {
      label: "Background blur",
      value: (v) => (v.model.background === null ? "–" : `${num(v.model.blur.background / v.model.pixels.pitch, 0)} px`),
    },
    { label: "Subject in pixels", value: (v) => `${num(Math.round(v.model.pixels.subjectW), 0)} × ${num(Math.round(v.model.pixels.subjectH), 0)}` },
  ];
</script>

{#if live.b}
  {@const setups = [
    ["a", "A", live.a],
    ["b", "B", live.b],
  ] as const}
  <section class="overflow-x-auto rounded-2xl border border-line bg-surface">
    <table class="w-full text-sm tabular-nums">
      <colgroup><col /><col class="w-[28%]" /><col class="w-[28%]" /></colgroup>
      <thead>
        <tr class="border-b border-line">
          <th class="px-4 py-2.5 text-left text-xs font-medium text-ink-3">Compare</th>
          {#each setups as [side, label] (side)}
            <th class="px-3 py-2 text-right">
              <button
                type="button"
                class="rounded-md px-2 py-0.5 text-xs font-bold {compare.side === side
                  ? 'bg-accent text-white dark:text-black'
                  : 'bg-surface-2 text-ink-2 hover:text-ink'}"
                onclick={() => editSide(side)}>{label}</button
              >
            </th>
          {/each}
        </tr>
      </thead>
      <tbody class="divide-y divide-line">
        {#each rows as r (r.label)}
          <tr>
            <td class="px-4 py-1.5 text-ink-3">{r.label}</td>
            {#each setups as [side, , v] (side)}
              <td class="px-3 py-1.5 text-right whitespace-nowrap {r.focus ? 'text-focus' : 'text-ink'} {compare.side === side ? 'font-medium' : ''}">
                {r.value(v)}
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </section>
{/if}
