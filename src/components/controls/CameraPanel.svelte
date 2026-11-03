<script lang="ts">
  import { ASPECTS, CUSTOM_SENSOR, MEGAPIXELS, SENSORS, SQUEEZES } from "~/lib/camera";
  import { live, settings } from "~/lib/store.svelte";
  import { num } from "~/lib/units";
  import Chips from "../ui/Chips.svelte";
  import Field from "../ui/Field.svelte";
  import NumberField from "../ui/NumberField.svelte";
  import Section from "../ui/Section.svelte";
  import Segmented from "../ui/Segmented.svelte";
  import Select from "../ui/Select.svelte";
  import Toggle from "../ui/Toggle.svelte";

  const m = $derived(live.model);
  const groups = [
    { name: "Photo", options: SENSORS.filter((s) => s.group === "Photo").map((s) => ({ value: s.id, label: s.name })) },
    { name: "Cinema", options: SENSORS.filter((s) => s.group === "Cinema").map((s) => ({ value: s.id, label: s.name })) },
    { name: "Other", options: [{ value: CUSTOM_SENSOR, label: "Custom size…" }] },
  ];
</script>

<Section title="Camera">
  <Field label="Sensor" value="{num(m.cropFactor, 2)}× crop">
    <Select
      label="Sensor"
      value={settings.sensor}
      {groups}
      onchange={(v) => {
        if (v === CUSTOM_SENSOR) {
          settings.sensorW = m.sensor.w;
          settings.sensorH = m.sensor.h;
        }
        settings.sensor = v;
      }}
    />
    {#if settings.sensor === CUSTOM_SENSOR}
      <div class="flex items-center gap-2">
        <NumberField label="Sensor width" value={settings.sensorW} unit="mm" min={1} max={200} onchange={(v) => (settings.sensorW = v)} />
        <span class="text-ink-3">×</span>
        <NumberField label="Sensor height" value={settings.sensorH} unit="mm" min={1} max={200} onchange={(v) => (settings.sensorH = v)} />
      </div>
    {/if}
  </Field>

  <Field label="Orientation">
    <Segmented
      label="Orientation"
      options={[
        { value: false, label: "Landscape" },
        { value: true, label: "Portrait" },
      ]}
      value={settings.portrait}
      onchange={(v) => (settings.portrait = v)}
    />
  </Field>

  <Field label="Aspect ratio / crop" value={m.aspectLabel === "Native" ? undefined : `${num(m.frame.width, 1)} × ${num(m.frame.height, 1)} mm`}>
    <Chips
      label="Aspect ratio"
      options={ASPECTS.map((a) => ({ value: a.id, label: settings.portrait ? a.portrait : a.label }))}
      isActive={(id) => settings.aspect === id}
      onselect={(id) => (settings.aspect = id)}
    />
  </Field>

  <Field label="Anamorphic squeeze" value={m.frame.squeeze > 1 ? `desqueezed ${num(m.frame.width / m.frame.height, 2)}:1` : undefined}>
    <Chips
      label="Anamorphic squeeze"
      options={SQUEEZES.map((s) => ({ value: s, label: s === 1 ? "Off" : `${s}×` }))}
      isActive={(s) => settings.squeeze === s}
      onselect={(s) => (settings.squeeze = s)}
    />
  </Field>

  <Field label="Resolution">
    <div class="flex items-start gap-3">
      <Chips
        label="Megapixels"
        class="flex-1"
        options={MEGAPIXELS.map((v) => ({ value: v, label: `${v}` }))}
        isActive={(v) => settings.megapixels === v}
        onselect={(v) => (settings.megapixels = v)}
      />
      <NumberField
        label="Megapixels"
        class="w-24 shrink-0"
        value={settings.megapixels}
        unit="MP"
        digits={1}
        min={0.3}
        max={1000}
        onchange={(v) => (settings.megapixels = v)}
      />
    </div>
  </Field>

  <div>
    <Toggle bind:checked={settings.cocAuto} hint="Sharpness standard for depth of field: sensor diagonal ÷ 1442.">
      Automatic circle of confusion
    </Toggle>
    {#if !settings.cocAuto}
      <NumberField
        label="Circle of confusion"
        class="mt-1 w-32"
        value={settings.coc}
        unit="mm"
        digits={4}
        min={0.001}
        max={1}
        onchange={(v) => (settings.coc = v)}
      />
    {/if}
  </div>
</Section>
