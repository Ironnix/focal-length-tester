<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    checked: boolean;
    children: Snippet;
    hint?: string;
  }

  let { checked = $bindable(), children, hint }: Props = $props();
</script>

<label class="flex items-start justify-between gap-3 py-1.5 text-sm">
  <span class="min-w-0">
    <span class="text-ink">{@render children()}</span>
    {#if hint}<span class="block text-xs text-ink-3">{hint}</span>{/if}
  </span>
  <input type="checkbox" class="peer sr-only" bind:checked />
  <span
    aria-hidden="true"
    class="relative mt-0.5 h-5 w-9 shrink-0 rounded-full bg-surface-3 transition-colors peer-checked:bg-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent
      after:absolute after:top-0.5 after:left-0.5 after:size-4 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:after:translate-x-4"
  ></span>
</label>
