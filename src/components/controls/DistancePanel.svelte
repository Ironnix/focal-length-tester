<script lang="ts">
  import { getField } from "~/lib/fields";
  import { cameraSpots } from "~/lib/placement";
  import { DISTANCE_PRESETS } from "~/lib/presets";
  import { applyPreset, placeCamera, prefs, settings } from "~/lib/store.svelte";
  import { fromDisplay, len, lenUnit, roundSig, toDisplay } from "~/lib/units";
  import Field from "../ui/Field.svelte";
  import NumberField from "../ui/NumberField.svelte";
  import Section from "../ui/Section.svelte";
  import Slider from "../ui/Slider.svelte";

  const field = $derived(getField(settings.field));
  const spots = $derived(field ? cameraSpots(field) : []);

  const sig2 = (v: number) => roundSig(v, 2);
</script>

<Section title="Distance & position">
  <Field label="Camera to subject">
    <div class="flex items-center gap-3">
      <Slider
        label="Distance"
        value={settings.distance}
        min={0.2}
        max={3000}
        scale="log"
        round={sig2}
        onchange={(v) => (settings.distance = v)}
      />
      <NumberField
        label="Distance"
        class="w-28 shrink-0"
        value={toDisplay(settings.distance, prefs.units)}
        unit={lenUnit(prefs.units)}
        min={0.05}
        onchange={(v) => (settings.distance = Math.max(0.05, fromDisplay(v, prefs.units)))}
      />
    </div>
  </Field>

  <div>
    <div class="mb-1.5 text-xs font-medium text-ink-2">Presets</div>
    <div class="grid grid-cols-2 gap-1.5">
      {#each DISTANCE_PRESETS as p (p.id)}
        {@const active =
          Math.abs(settings.distance - p.distance) < 1e-6 &&
          settings.field === p.field &&
          settings.camX === 0 &&
          settings.camZ === 0 &&
          settings.yaw === 0}
        <button
          type="button"
          class="flex items-baseline justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-left text-xs transition-colors
            {active ? 'border-accent bg-accent-soft text-accent-ink' : 'border-line text-ink-2 hover:border-line-strong hover:text-ink'}"
          aria-pressed={active}
          title={p.note}
          onclick={() => applyPreset(p)}
        >
          <span class="truncate font-medium">{p.label}</span>
          <span class="shrink-0 font-mono text-[11px] tabular-nums opacity-75">{len(p.distance, prefs.units)}</span>
        </button>
      {/each}
    </div>
    <p class="mt-2 text-xs text-ink-3">Sports presets draw the field to scale, with you standing on its end line.</p>
  </div>

  {#if field}
    <div>
      <div class="mb-1.5 text-xs font-medium text-ink-2">Stand at — {field.name.toLowerCase()}</div>
      <div class="grid grid-cols-2 gap-1.5">
        {#each spots as spot (spot.id)}
          {@const active = settings.camX === spot.at[0] && settings.camZ === spot.at[1]}
          <button
            type="button"
            class="rounded-lg border px-2.5 py-1.5 text-left text-xs font-medium transition-colors
              {active ? 'border-accent bg-accent-soft text-accent-ink' : 'border-line text-ink-2 hover:border-line-strong hover:text-ink'}"
            aria-pressed={active}
            onclick={() => placeCamera(spot.at)}>{spot.label}</button
          >
        {/each}
      </div>
      <p class="mt-2 text-xs text-ink-3">
        The subject stays where it is and the camera turns to it. You can also drag the camera and the subject
        anywhere in the top view.
      </p>
    </div>
  {/if}
</Section>
