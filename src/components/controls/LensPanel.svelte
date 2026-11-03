<script lang="ts">
  import InfinityIcon from "@lucide/svelte/icons/infinity";
  import { APERTURE_CHIPS, APERTURES, FOCAL_CHIPS, FOCAL_MAX, FOCAL_MIN, fmtAperture } from "~/lib/camera";
  import { live, prefs, settings } from "~/lib/store.svelte";
  import { fromDisplay, len, lenUnit, num, toDisplay } from "~/lib/units";
  import Chips from "../ui/Chips.svelte";
  import Field from "../ui/Field.svelte";
  import NumberField from "../ui/NumberField.svelte";
  import Section from "../ui/Section.svelte";
  import Slider from "../ui/Slider.svelte";
  import Toggle from "../ui/Toggle.svelte";

  const m = $derived(live.model);
  const roundFocal = (v: number) => (v < 10 ? Math.round(v * 10) / 10 : Math.round(v));
  // Rounded up, so focusing "at" the hyperfocal distance really reaches infinity.
  const ceil3 = (v: number) => {
    const p = 10 ** (Math.floor(Math.log10(v)) - 2);
    return Math.ceil(v / p) * p;
  };
  const sig3 = (v: number) => {
    const p = 10 ** (Math.floor(Math.log10(v)) - 1);
    return Math.round(v / p) * p;
  };
</script>

<Section title="Lens">
  <Field label="Focal length" value={m.cropFactor !== 1 ? `${num(m.equivFocal, 0)} mm FF-equiv.` : undefined}>
    <div class="flex items-center gap-3">
      <Slider
        label="Focal length"
        value={settings.focal}
        min={FOCAL_MIN}
        max={FOCAL_MAX}
        scale="log"
        round={roundFocal}
        onchange={(v) => (settings.focal = v)}
      />
      <NumberField
        label="Focal length"
        class="w-24 shrink-0"
        value={settings.focal}
        unit="mm"
        digits={1}
        min={1}
        max={5000}
        onchange={(v) => (settings.focal = v)}
      />
    </div>
    <Chips
      label="Common focal lengths"
      options={FOCAL_CHIPS.map((f) => ({ value: f, label: `${f}` }))}
      isActive={(f) => settings.focal === f}
      onselect={(f) => (settings.focal = f)}
    />
  </Field>

  <Field label="Aperture" value={m.cropFactor !== 1 ? `${fmtAperture(+m.equivAperture.toFixed(1))} FF-equiv.` : undefined}>
    <div class="flex items-center gap-3">
      <Slider label="Aperture" value={settings.aperture} stops={APERTURES} onchange={(v) => (settings.aperture = v)} />
      <NumberField
        label="f-number"
        class="w-24 shrink-0"
        value={settings.aperture}
        digits={1}
        min={0.7}
        max={128}
        onchange={(v) => (settings.aperture = v)}
      />
    </div>
    <Chips
      label="Common apertures"
      options={APERTURE_CHIPS.map((a) => ({ value: a, label: fmtAperture(a) }))}
      isActive={(a) => settings.aperture === a}
      onselect={(a) => (settings.aperture = a)}
    />
  </Field>

  <div>
    <Toggle
      bind:checked={
        () => settings.focusOnSubject,
        (v) => {
          if (!v) settings.focus = +m.subjectRange.toPrecision(3);
          settings.focusOnSubject = v;
        }
      }
      hint="Turn off to focus somewhere else and see the subject go soft."
    >
      Focus on the subject
    </Toggle>
    {#if !settings.focusOnSubject}
      <div class="mt-2 flex items-center gap-3">
        <Slider
          label="Focus distance"
          value={settings.focus}
          min={0.2}
          max={3000}
          scale="log"
          round={sig3}
          onchange={(v) => (settings.focus = v)}
        />
        <NumberField
          label="Focus distance"
          class="w-28 shrink-0"
          value={toDisplay(settings.focus, prefs.units)}
          unit={lenUnit(prefs.units)}
          min={0.05}
          onchange={(v) => (settings.focus = Math.max(0.05, fromDisplay(v, prefs.units)))}
        />
      </div>
      <button
        type="button"
        class="mt-2 flex items-center gap-1.5 text-xs font-medium text-accent-ink hover:underline"
        onclick={() => (settings.focus = ceil3(m.dof.hyperfocal))}
      >
        <InfinityIcon class="size-3.5" /> Focus at hyperfocal ({len(m.dof.hyperfocal, prefs.units)}) — sharp from {len(m.dof.hyperfocal / 2, prefs.units)} to infinity
      </button>
    {/if}
  </div>
</Section>
