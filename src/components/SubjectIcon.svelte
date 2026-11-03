<script lang="ts">
  import { pathFrom, SHAPES, type ShapeId } from "~/lib/shapes";

  interface Props {
    shape: ShapeId;
    class?: string;
  }

  let { shape, class: cls = "" }: Props = $props();
  const s = $derived(SHAPES[shape]);
  // A little padding so thin outlines don't touch the edge.
  const pad = $derived(Math.max(...s.box) * 0.04);
</script>

<svg
  viewBox="{-pad} {-pad} {s.box[0] + 2 * pad} {s.box[1] + 2 * pad}"
  class={cls}
  preserveAspectRatio="xMidYMid meet"
  aria-hidden="true"
>
  {#each s.parts as p, i (i)}
    <path d={pathFrom(p.pts, p.smooth)} fill={p.light ? "var(--surface)" : "currentColor"} opacity={p.light ? 0.55 : 1} />
  {/each}
</svg>
