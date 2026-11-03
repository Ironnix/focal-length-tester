<script lang="ts">
  // The photographic sky / stadium behind a scene (WebGL, see lib/backdrop.ts). Blurred with
  // CSS by the blur disc at its distance; drawn a bit larger than the picture so the blur
  // has no faded edges.
  import { drawBackdrop, onTexture } from "~/lib/backdrop";
  import type { Scene } from "~/lib/scene";

  interface Props {
    scene: Scene;
    /** True once the photo is drawn (until then the scene shows a plain sky). */
    ready?: boolean;
  }

  let { scene, ready = $bindable(false) }: Props = $props();

  let canvas: HTMLCanvasElement | undefined = $state();
  let w = $state(0);
  let h = $state(0);
  let version = $state(0);

  $effect(() => onTexture(() => version++));

  const b = $derived(scene.photo);
  const blurPx = $derived(b && w > 0 ? (b.blur * w) / scene.view.w : 0);
  const extra = $derived(blurPx > 0.3 ? Math.min(0.3, (blurPx * 3) / Math.max(w, 1)) : 0);

  $effect(() => {
    void version;
    if (!canvas || !b || w < 2 || h < 2) {
      ready = false;
      return;
    }
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = Math.round(w * (1 + 2 * extra) * dpr);
    const ch = Math.round(h * (1 + 2 * extra) * dpr);
    if (canvas.width !== cw) canvas.width = cw;
    if (canvas.height !== ch) canvas.height = ch;
    ready = drawBackdrop(canvas, b, b.url, extra);
  });
</script>

<div class="pointer-events-none absolute inset-0 overflow-hidden" bind:clientWidth={w} bind:clientHeight={h} aria-hidden="true">
  {#if b}
    <canvas
      bind:this={canvas}
      class="absolute {ready ? '' : 'invisible'}"
      style:left="{-extra * 100}%"
      style:top="{-extra * 100}%"
      style:width="{100 + 200 * extra}%"
      style:height="{100 + 200 * extra}%"
      style:filter={blurPx > 0.3 ? `blur(${blurPx.toFixed(1)}px)` : undefined}
    ></canvas>
  {/if}
</div>
