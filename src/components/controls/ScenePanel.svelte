<script lang="ts">
  import { FIELD_NAMES, type FieldId } from "~/lib/fields";
  import type { Background } from "~/lib/settings";
  import { live, prefs, setField, settings } from "~/lib/store.svelte";
  import { fromDisplay, len, lenUnit, roundSig, toDisplay } from "~/lib/units";
  import Field from "../ui/Field.svelte";
  import NumberField from "../ui/NumberField.svelte";
  import Section from "../ui/Section.svelte";
  import Segmented from "../ui/Segmented.svelte";
  import Select from "../ui/Select.svelte";
  import Slider from "../ui/Slider.svelte";
  import Toggle from "../ui/Toggle.svelte";

  const m = $derived(live.model);
  const sig2 = (v: number) => roundSig(v, 2);
</script>

<Section title="Scene">
  <Field label="Background" value={m.background !== null ? `${len(m.background, prefs.units)} from you` : undefined}>
    <Segmented
      label="Background"
      options={[
        { value: "trees" as Background, label: "Trees" },
        { value: "city" as Background, label: "Buildings" },
        { value: "none" as Background, label: "None" },
      ]}
      value={settings.background}
      onchange={(v) => (settings.background = v)}
    />
    {#if settings.background !== "none"}
      <div class="flex items-center gap-3">
        <Slider
          label="Background behind subject"
          value={settings.bgGap}
          min={0.5}
          max={2000}
          scale="log"
          round={sig2}
          onchange={(v) => (settings.bgGap = v)}
        />
        <NumberField
          label="Background behind subject"
          class="w-28 shrink-0"
          value={toDisplay(settings.bgGap, prefs.units)}
          unit={lenUnit(prefs.units)}
          min={0.1}
          onchange={(v) => (settings.bgGap = Math.max(0.1, fromDisplay(v, prefs.units)))}
        />
      </div>
      <p class="text-xs text-ink-3">Distance behind the subject — watch how blurred it gets.</p>
    {/if}
  </Field>

  <Field label="Ground">
    <Select
      label="Ground"
      value={settings.field}
      options={(Object.keys(FIELD_NAMES) as FieldId[]).map((id) => ({
        value: id,
        label: id === "none" ? "Plain ground with grid" : FIELD_NAMES[id],
      }))}
      onchange={(v) => setField(v as FieldId)}
    />
  </Field>

  <div>
    <Toggle
      bind:checked={settings.camHeightAuto}
      hint="Off: stand at your own height and tilt the camera down or up to the subject."
    >
      Camera at the subject's centre height
    </Toggle>
    {#if !settings.camHeightAuto}
      <div class="mt-2 flex items-center gap-3">
        <Slider
          label="Camera height"
          value={settings.camHeight}
          min={0.05}
          max={200}
          scale="log"
          round={sig2}
          onchange={(v) => (settings.camHeight = v)}
        />
        <NumberField
          label="Camera height"
          class="w-28 shrink-0"
          value={toDisplay(settings.camHeight, prefs.units)}
          unit={lenUnit(prefs.units)}
          min={0.01}
          onchange={(v) => (settings.camHeight = Math.max(0.01, fromDisplay(v, prefs.units)))}
        />
      </div>
    {/if}
  </div>

  <Toggle bind:checked={settings.reference} hint="A 1.75 m person next to the subject, in grey.">Person for scale</Toggle>
</Section>
