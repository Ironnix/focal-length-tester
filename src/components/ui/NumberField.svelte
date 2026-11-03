<script lang="ts">
  // Text box for a number that commits on Enter or blur (typing never fights the slider).
  interface Props {
    value: number;
    onchange: (v: number) => void;
    label: string;
    unit?: string;
    digits?: number;
    min?: number;
    max?: number;
    class?: string;
  }

  let { value, onchange, label, unit, digits = 2, min = -Infinity, max = Infinity, class: cls = "" }: Props =
    $props();

  let editing = $state(false);
  let text = $state("");
  const shown = $derived(Number.isFinite(value) ? String(+value.toFixed(digits)) : "∞");

  function commit() {
    if (!editing) return;
    editing = false;
    const v = parseFloat(text.replace(",", "."));
    if (Number.isFinite(v)) onchange(Math.min(max, Math.max(min, v)));
  }
</script>

<label
  class="flex h-9 items-center gap-1 rounded-lg border border-line bg-surface px-2.5 text-sm focus-within:border-accent {cls}"
>
  <input
    type="text"
    inputmode="decimal"
    aria-label={unit ? `${label} (${unit})` : label}
    class="w-full min-w-0 bg-transparent text-right font-mono tabular-nums outline-none"
    value={editing ? text : shown}
    onfocus={(e) => {
      editing = true;
      text = shown;
      e.currentTarget.select();
    }}
    oninput={(e) => (text = e.currentTarget.value)}
    onblur={commit}
    onkeydown={(e) => {
      if (e.key === "Enter") e.currentTarget.blur();
      if (e.key === "Escape") {
        editing = false;
        e.currentTarget.blur();
      }
    }}
  />
  {#if unit}<span class="shrink-0 text-xs text-ink-3">{unit}</span>{/if}
</label>
