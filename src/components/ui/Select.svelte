<script lang="ts">
  import ChevronDown from "@lucide/svelte/icons/chevron-down";

  interface Option {
    value: string;
    label: string;
  }

  interface Props {
    value: string;
    onchange: (v: string) => void;
    label: string;
    options?: Option[];
    groups?: { name: string; options: Option[] }[];
    class?: string;
  }

  let { value, onchange, label, options = [], groups = [], class: cls = "" }: Props = $props();
</script>

<div class="relative {cls}">
  <select
    aria-label={label}
    class="h-9 w-full appearance-none rounded-lg border border-line bg-surface pr-8 pl-2.5 text-sm text-ink outline-none focus:border-accent"
    {value}
    onchange={(e) => onchange(e.currentTarget.value)}
  >
    {#each options as o (o.value)}
      <option value={o.value}>{o.label}</option>
    {/each}
    {#each groups as g (g.name)}
      <optgroup label={g.name}>
        {#each g.options as o (o.value)}
          <option value={o.value}>{o.label}</option>
        {/each}
      </optgroup>
    {/each}
  </select>
  <ChevronDown class="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-ink-3" />
</div>
