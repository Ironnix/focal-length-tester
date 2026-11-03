<script lang="ts">
  // A labelled row inside a control section.
  import type { Snippet } from "svelte";

  interface Props {
    label: string;
    value?: string | undefined;
    children: Snippet;
    class?: string;
  }

  let { label, value, children, class: cls = "" }: Props = $props();
</script>

<div class="space-y-1.5 {cls}">
  <div class="flex items-baseline justify-between gap-2">
    <span class="text-xs font-medium text-ink-2">{label}</span>
    {#if value}<span class="font-mono text-xs text-ink-3 tabular-nums">{value}</span>{/if}
  </div>
  {@render children()}
</div>
