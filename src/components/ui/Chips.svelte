<script lang="ts" generics="T">
  interface Option {
    value: T;
    label: string;
    hint?: string;
  }

  interface Props {
    options: Option[];
    isActive: (v: T) => boolean;
    onselect: (v: T) => void;
    label: string;
    class?: string;
  }

  let { options, isActive, onselect, label, class: cls = "" }: Props = $props();
</script>

<div class="flex flex-wrap gap-1.5 {cls}" role="group" aria-label={label}>
  {#each options as o (o.label)}
    {@const active = isActive(o.value)}
    <button
      type="button"
      class="flex h-7 items-center gap-1 rounded-full border px-2.5 text-xs font-medium tabular-nums transition-colors
        {active
        ? 'border-accent bg-accent-soft text-accent-ink'
        : 'border-line bg-surface text-ink-2 hover:border-line-strong hover:text-ink'}"
      aria-pressed={active}
      title={o.hint}
      onclick={() => onselect(o.value)}
    >
      {o.label}
    </button>
  {/each}
</div>
