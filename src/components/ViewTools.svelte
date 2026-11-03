<script lang="ts">
  // Overlay toggles for the preview(s); shared by both setups in compare mode.
  import Grid3x3 from "@lucide/svelte/icons/grid-3x3";
  import ScanLine from "@lucide/svelte/icons/scan-line";
  import Frame from "@lucide/svelte/icons/frame";
  import Ruler from "@lucide/svelte/icons/ruler";
  import { settings } from "~/lib/store.svelte";

  const tools = [
    { key: "thirds", label: "Rule of thirds", icon: Grid3x3 },
    { key: "focusZone", label: "Focus zone", icon: ScanLine },
    { key: "labels", label: "Distance labels", icon: Ruler },
    { key: "sensorFrames", label: "Frame lines of smaller sensors (same lens)", icon: Frame },
  ] as const;
</script>

<div class="flex shrink-0 gap-0.5" role="group" aria-label="Overlays">
  {#each tools as t (t.key)}
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
  {/each}
</div>
