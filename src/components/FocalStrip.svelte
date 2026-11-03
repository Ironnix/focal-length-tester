<script lang="ts">
  // The same scene at common focal lengths; click one to use it.
  import { compute } from "~/lib/model";
  import { buildScene } from "~/lib/scene";
  import { live, prefs, settings } from "~/lib/store.svelte";
  import { pct } from "~/lib/units";
  import SceneSvg from "./SceneSvg.svelte";

  const FOCALS = [14, 24, 35, 50, 85, 135, 200, 300, 400, 600, 800];

  const thumbs = $derived(
    FOCALS.map((focal) => {
      const s = { ...settings, focal, outsideCrop: false };
      const m = compute(s, live.subject);
      const scene = buildScene(s, live.subject, m, { lite: true, units: prefs.units });
      const box = scene.subject.box;
      return { focal, scene, fill: box ? box.h / scene.crop.h : 0 };
    }),
  );
  const aspect = $derived(live.scene.crop.w / live.scene.crop.h);
  const nearest = $derived(
    FOCALS.reduce((a, b) => (Math.abs(Math.log(b / settings.focal)) < Math.abs(Math.log(a / settings.focal)) ? b : a)),
  );
</script>

<div class="scrollbar-thin -mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
  <div class="flex gap-2">
    {#each thumbs as t (t.focal)}
      {@const active = t.focal === nearest}
      <button
        type="button"
        class="group shrink-0 text-left"
        style:width="{Math.max(84, Math.min(150, 96 * aspect))}px"
        onclick={() => (settings.focal = t.focal)}
        aria-label="Use {t.focal} mm"
      >
        <div
          class="overflow-hidden rounded-lg ring-1 transition {active
            ? 'ring-2 ring-accent'
            : 'ring-line group-hover:ring-line-strong'}"
          style:aspect-ratio="{aspect}"
        >
          <SceneSvg scene={t.scene} />
        </div>
        <div class="mt-1 flex items-baseline justify-between gap-1 px-0.5 font-mono text-[11px] tabular-nums">
          <span class={active ? "font-semibold text-accent-ink" : "text-ink-2"}>{t.focal} mm</span>
          <span class="text-ink-3">{pct(t.fill)}</span>
        </div>
      </button>
    {/each}
  </div>
</div>
