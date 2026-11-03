<script lang="ts">
  import Grid3x3 from "@lucide/svelte/icons/grid-3x3";
  import ScanLine from "@lucide/svelte/icons/scan-line";
  import Frame from "@lucide/svelte/icons/frame";
  import Ruler from "@lucide/svelte/icons/ruler";
  import Crop from "@lucide/svelte/icons/crop";
  import { fmtAperture, SENSORS } from "~/lib/camera";
  import { sensorOutline } from "~/lib/scene";
  import { live, prefs, settings } from "~/lib/store.svelte";
  import { len, num } from "~/lib/units";
  import SceneSvg from "./SceneSvg.svelte";

  interface Props {
    /** Height limit for the picture, CSS length. */
    maxHeight?: string;
  }

  let { maxHeight = "62vh" }: Props = $props();

  const scene = $derived(live.scene);
  const m = $derived(live.model);
  const aspect = $derived(scene.view.w / scene.view.h);
  const cropped = $derived(scene.view.w !== scene.crop.w || scene.view.h !== scene.crop.h);

  // Smaller formats that fit inside this picture, at the same focal length.
  const OVERLAY_SENSORS = ["mf44", "ff", "apsc", "apsc-canon", "mft", "1in", "s35"];
  const frames = $derived.by(() => {
    if (!settings.sensorFrames) return [];
    return SENSORS.filter((s) => OVERLAY_SENSORS.includes(s.id) && s.id !== settings.sensor)
      .map((s) => ({ rect: sensorOutline(s.w, s.h, m.frame.squeeze, m.frame.portrait), label: s.short, id: s.id }))
      .filter((f) => f.rect.w < scene.view.w * 0.995 && f.rect.h < scene.view.h * 0.995)
      .filter((f, i, all) => all.findIndex((o) => o.label === f.label) === i);
  });

  const tools = $derived([
    { key: "thirds", label: "Rule of thirds", icon: Grid3x3 },
    { key: "focusZone", label: "Focus zone", icon: ScanLine },
    { key: "labels", label: "Distance labels", icon: Ruler },
    { key: "sensorFrames", label: "Smaller sensors", icon: Frame },
    { key: "outsideCrop", label: "Show area outside crop", icon: Crop },
  ] as const);

  const caption = $derived(
    `${num(m.focal, 0)} mm · ${fmtAperture(m.aperture)} · ${len(settings.distance, prefs.units)} · ${m.sensor.short} ${m.aspectLabel === "Native" ? "" : m.aspectLabel}${m.frame.squeeze > 1 ? ` · ${m.frame.squeeze}× anamorphic` : ""}`,
  );
</script>

<div class="space-y-2">
  <div class="flex items-center justify-between gap-2">
    <p class="truncate font-mono text-xs text-ink-2 tabular-nums">{caption}</p>
    <div class="flex shrink-0 gap-0.5" role="group" aria-label="Overlays">
      {#each tools as t (t.key)}
        {#if t.key !== "outsideCrop" || cropped || settings.outsideCrop === false}
          <button
            type="button"
            class="grid size-8 place-items-center rounded-md transition-colors {settings[t.key]
              ? 'bg-accent-soft text-accent-ink'
              : 'text-ink-3 hover:bg-surface-2 hover:text-ink'}"
            aria-pressed={settings[t.key]}
            aria-label={t.label}
            title={t.label}
            onclick={() => (settings[t.key] = !settings[t.key])}
          >
            <t.icon class="size-4" />
          </button>
        {/if}
      {/each}
    </div>
  </div>

  <div
    class="relative mx-auto overflow-hidden rounded-xl bg-viewfinder ring-1 ring-line"
    style:aspect-ratio="{scene.view.w} / {scene.view.h}"
    style:max-width="min(100%, calc({maxHeight} * {aspect}))"
  >
    <SceneSvg
      {scene}
      thirds={settings.thirds}
      {frames}
      label="Preview: {live.subject.name} at {len(settings.distance, prefs.units)} with {num(m.focal, 0)} mm"
    />
  </div>
</div>
