<script lang="ts">
  import { DISTANCE_PRESETS } from "~/lib/presets";
  import { applyPreset, prefs, settings } from "~/lib/store.svelte";
  import { fromDisplay, len, lenUnit, toDisplay } from "~/lib/units";
  import Field from "../ui/Field.svelte";
  import NumberField from "../ui/NumberField.svelte";
  import Section from "../ui/Section.svelte";
  import Slider from "../ui/Slider.svelte";

  const sig3 = (v: number) => {
    const p = 10 ** (Math.floor(Math.log10(v)) - 1);
    return Math.round(v / p) * p;
  };
</script>

<Section title="Distance">
  <Field label="Camera to subject">
    <div class="flex items-center gap-3">
      <Slider
        label="Distance"
        value={settings.distance}
        min={0.2}
        max={3000}
        scale="log"
        round={sig3}
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
        {@const active = Math.abs(settings.distance - p.distance) < 1e-6 && settings.field === p.field}
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
</Section>
