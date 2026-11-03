<script lang="ts">
  // Frame corners around a lens opening: the app icon (same drawing as public/favicon.svg).
  let { class: cls = "" }: { class?: string } = $props();
</script>

<svg viewBox="0 0 32 32" class={cls} aria-hidden="true">
  <rect width="32" height="32" rx="8" fill="var(--accent)" />
  <g fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M8 12V8h4M20 8h4v4M24 20v4h-4M12 24H8v-4" />
    <circle cx="16" cy="16" r="4" />
  </g>
</svg>
