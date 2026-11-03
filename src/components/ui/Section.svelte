<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    title: string;
    children: Snippet;
    actions?: Snippet;
    class?: string;
  }

  let { title, children, actions, class: cls = "" }: Props = $props();
</script>

<section class="rounded-2xl border border-line bg-surface p-4 {cls}">
  <div class="mb-3 flex items-center justify-between gap-2">
    <h2 class="text-sm font-semibold tracking-tight">{title}</h2>
    {#if actions}{@render actions()}{/if}
  </div>
  <div class="space-y-4">
    {@render children()}
  </div>
</section>
