<script lang="ts">
  // Range input over a log, linear or stepped scale. `value` is in base units.
  interface Props {
    value: number;
    onchange: (v: number) => void;
    label: string;
    min?: number;
    max?: number;
    scale?: "log" | "linear";
    /** Discrete values (e.g. f-stops); overrides min/max/scale. */
    stops?: number[];
    round?: (v: number) => number;
  }

  let { value, onchange, label, min = 1, max = 100, scale = "linear", stops, round = (v) => v }: Props = $props();

  const RES = 1000;
  const top = $derived(stops ? stops.length - 1 : RES);

  function toPos(v: number): number {
    if (stops) {
      let best = 0;
      for (let i = 1; i < stops.length; i++) {
        if (Math.abs(Math.log(stops[i]! / v)) < Math.abs(Math.log(stops[best]! / v))) best = i;
      }
      return best;
    }
    const c = Math.min(max, Math.max(min, v));
    return scale === "log" ? (RES * Math.log(c / min)) / Math.log(max / min) : (RES * (c - min)) / (max - min);
  }

  function fromPos(p: number): number {
    if (stops) return stops[Math.round(p)]!;
    return round(scale === "log" ? min * (max / min) ** (p / RES) : min + ((max - min) * p) / RES);
  }

  const pos = $derived(toPos(value));
</script>

<input
  type="range"
  class="range"
  aria-label={label}
  min="0"
  max={top}
  step="1"
  value={pos}
  style:--fill="{(pos / top) * 100}%"
  oninput={(e) => onchange(fromPos(+e.currentTarget.value))}
/>
