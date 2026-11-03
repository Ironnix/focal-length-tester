<script lang="ts">
  import { live, prefs } from "~/lib/store.svelte";
  import { deg, len, num, pct } from "~/lib/units";

  const m = $derived(live.model);
  const fill = $derived(live.fill);
  const cov = $derived(live.coverage);
  const u = $derived(prefs.units);

  const tiles = $derived([
    {
      label: "Subject height",
      value: pct(fill.h),
      note:
        fill.h > 1.001 || fill.w > 1.001
          ? `cropped · ${pct(cov.visible)} of it visible`
          : `${pct(fill.w)} of width · ${pct(cov.frame)} of area`,
      tone: fill.h > 1.001 || fill.w > 1.001 ? "warn" : "",
    },
    {
      label: "Frame at subject",
      value: `${len(m.frameAtSubject.w, u)} × ${len(m.frameAtSubject.h, u)}`,
      note: `${num(m.equivFocal, 0)} mm full-frame equivalent`,
      tone: "",
    },
    {
      label: "In focus",
      value: `${len(m.dof.near, u)} – ${len(m.dof.far, u)}`,
      note: Number.isFinite(m.dof.total) ? `${len(m.dof.total, u)} deep` : "to infinity",
      tone: "focus",
    },
    {
      label: "Angle of view",
      value: deg(m.aov.h),
      note: `${deg(m.aov.v)} vertical · ${deg(m.aov.d)} diagonal`,
      tone: "",
    },
  ]);
</script>

<div class="grid grid-cols-2 gap-2 lg:grid-cols-4">
  {#each tiles as t (t.label)}
    <div class="rounded-xl border border-line bg-surface px-3 py-2.5">
      <div class="text-[11px] font-medium tracking-wide text-ink-3 uppercase">{t.label}</div>
      <div
        class="mt-0.5 font-mono text-[15px] leading-tight font-semibold tracking-tight tabular-nums sm:text-xl
          {t.tone === 'focus' ? 'text-focus' : t.tone === 'warn' ? 'text-warn' : 'text-ink'}"
      >
        {t.value}
      </div>
      <div class="mt-0.5 line-clamp-2 text-xs text-ink-3 sm:truncate">{t.note}</div>
    </div>
  {/each}
</div>
