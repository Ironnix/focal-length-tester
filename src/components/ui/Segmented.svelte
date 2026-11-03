<script lang="ts" generics="T">
  interface Props {
    options: { value: T; label: string }[];
    value: T;
    onchange: (v: T) => void;
    label: string;
    class?: string;
  }

  let { options, value, onchange, label, class: cls = "" }: Props = $props();
</script>

<div class="flex rounded-lg bg-surface-2 p-0.5 {cls}" role="radiogroup" aria-label={label}>
  {#each options as o (o.label)}
    {@const active = o.value === value}
    <button
      type="button"
      role="radio"
      aria-checked={active}
      class="h-8 flex-1 rounded-md px-2 text-xs font-medium whitespace-nowrap transition-colors
        {active ? 'bg-surface text-ink shadow-sm dark:bg-surface-3' : 'text-ink-3 hover:text-ink'}"
      onclick={() => onchange(o.value)}
    >
      {o.label}
    </button>
  {/each}
</div>
