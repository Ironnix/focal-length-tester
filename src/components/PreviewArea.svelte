<script lang="ts">
  // One preview, or setups A and B side by side in compare mode.
  import Copy from "@lucide/svelte/icons/copy";
  import { fmtAperture } from "~/lib/camera";
  import { compare, copyToOther, editSide, live, prefs, settings, toast } from "~/lib/store.svelte";
  import { len, num } from "~/lib/units";
  import Segmented from "./ui/Segmented.svelte";
  import ViewTools from "./ViewTools.svelte";
  import Viewfinder from "./Viewfinder.svelte";

  interface Props {
    maxHeight: string;
    compareMaxHeight: string;
  }

  let { maxHeight, compareMaxHeight }: Props = $props();

  const m = $derived(live.model);
  const caption = $derived(
    `${num(m.focal, 0)} mm · ${fmtAperture(m.aperture)} · ${len(settings.distance, prefs.units)} · ${m.sensor.short}${m.aspectLabel === "Native" ? "" : ` ${m.aspectLabel}`}${m.frame.squeeze > 1 ? ` · ${m.frame.squeeze}× anamorphic` : ""}`,
  );
  const other = $derived(compare.side === "a" ? "B" : "A");
</script>

<div class="space-y-2">
  {#if live.b}
    <div class="flex items-center justify-between gap-2">
      <div class="flex min-w-0 items-center gap-2">
        <span class="text-xs text-ink-3 max-sm:hidden">Editing</span>
        <Segmented
          label="Setup being edited"
          options={[
            { value: "a" as const, label: "A" },
            { value: "b" as const, label: "B" },
          ]}
          value={compare.side}
          onchange={editSide}
          class="w-24 shrink-0"
        />
        <button
          type="button"
          class="flex h-8 items-center gap-1.5 truncate rounded-lg px-2 text-xs font-medium text-ink-2 hover:bg-surface-2 hover:text-ink"
          title="Copy every setting of {compare.side.toUpperCase()} onto {other}"
          onclick={() => {
            copyToOther();
            toast(`${compare.side.toUpperCase()} copied to ${other}`);
          }}
        >
          <Copy class="size-3.5 shrink-0" /> Copy to {other}
        </button>
      </div>
      <ViewTools />
    </div>
    <div class="grid grid-cols-2 items-start gap-2 sm:gap-3">
      <Viewfinder view={live.a} badge="A" active={compare.side === "a"} onselect={() => editSide("a")} maxHeight={compareMaxHeight} />
      <Viewfinder view={live.b} badge="B" active={compare.side === "b"} onselect={() => editSide("b")} maxHeight={compareMaxHeight} />
    </div>
  {:else}
    <div class="flex items-center justify-between gap-2">
      <p class="truncate font-mono text-xs text-ink-2 tabular-nums">{caption}</p>
      <ViewTools />
    </div>
    <Viewfinder view={live.current} {maxHeight} />
  {/if}
</div>
