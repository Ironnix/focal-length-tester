<script lang="ts">
  import { fmtAperture, SENSORS } from "~/lib/camera";
  import { sensorOutline } from "~/lib/scene";
  import { prefs, settings, type Analysis } from "~/lib/store.svelte";
  import { len, num } from "~/lib/units";
  import Backdrop from "./Backdrop.svelte";
  import SceneSvg from "./SceneSvg.svelte";

  interface Props {
    view: Analysis;
    /** Height limit for the picture, CSS length. */
    maxHeight?: string;
    /** Compare mode: "A"/"B" badge, highlighted while being edited, click to edit. */
    badge?: string;
    active?: boolean;
    onselect?: () => void;
  }

  let { view, maxHeight = "62vh", badge, active = false, onselect }: Props = $props();

  const scene = $derived(view.scene);
  let photo = $state(false);
  const m = $derived(view.model);
  const aspect = $derived(scene.view.w / scene.view.h);

  // Smaller formats that fit inside this picture, at the same focal length.
  const OVERLAY_SENSORS = ["mf44", "ff", "apsc", "apsc-canon", "mft", "1in", "s35"];
  const frames = $derived.by(() => {
    if (!settings.sensorFrames) return [];
    return SENSORS.filter((s) => OVERLAY_SENSORS.includes(s.id) && s.id !== view.settings.sensor)
      .map((s) => ({ rect: sensorOutline(s.w, s.h, m.frame.squeeze, m.frame.portrait), label: s.short }))
      .filter((f) => f.rect.w < scene.view.w * 0.995 && f.rect.h < scene.view.h * 0.995)
      .filter((f, i, all) => all.findIndex((o) => o.label === f.label) === i);
  });

  // Short: the compare table below lists sensor and crop.
  const caption = $derived(`${num(m.focal, 0)} mm · ${fmtAperture(m.aperture)} · ${len(view.settings.distance, prefs.units)}`);
  const alt = $derived(`Preview: ${view.subject.name} at ${len(view.settings.distance, prefs.units)} with ${num(m.focal, 0)} mm`);
</script>

{#snippet picture()}
  <div
    class="relative mx-auto overflow-hidden rounded-xl bg-viewfinder ring-1 {active ? 'ring-2 ring-accent' : 'ring-line'}"
    style:aspect-ratio="{scene.view.w} / {scene.view.h}"
    style:max-width="min(100%, calc({maxHeight} * {aspect}))"
  >
    <Backdrop {scene} bind:ready={photo} />
    <SceneSvg {scene} {photo} thirds={settings.thirds} {frames} ownLabel={frames.length ? `${m.sensor.short} (yours)` : ""} label={alt} />
    {#if badge}
      <span
        class="absolute top-2 left-2 grid size-6 place-items-center rounded-md text-xs font-bold {active
          ? 'bg-accent text-white dark:text-black'
          : 'bg-black/55 text-white'}">{badge}</span
      >
    {/if}
  </div>
{/snippet}

{#if onselect}
  <button
    type="button"
    class="block w-full text-left"
    aria-pressed={active}
    aria-label="Setup {badge}: {caption}{active ? ' (editing)' : ', tap to edit'}"
    onclick={onselect}
  >
    {@render picture()}
    <p class="mt-1.5 truncate text-center font-mono text-[11px] tabular-nums {active ? 'text-accent-ink' : 'text-ink-3'}">
      {caption}
    </p>
  </button>
{:else}
  {@render picture()}
{/if}
