<script lang="ts">
  // Draws a built scene. Used by the big viewfinder and the focal-length thumbnails.
  import type { Rect, Scene } from "~/lib/scene";

  interface Props {
    scene: Scene;
    thirds?: boolean;
    frames?: { rect: Rect; label: string }[];
    /** Label for the picture itself when frame lines are shown. */
    ownLabel?: string;
    /** A photo backdrop is drawn behind: leave the sky (and, in the stadium, beyond the boards) open. */
    photo?: boolean;
    class?: string;
    label?: string;
  }

  let { scene, thirds = false, frames = [], ownLabel = "", photo = false, class: cls = "", label }: Props = $props();

  const uid = $props.id();
  const v = $derived(scene.view);
  const c = $derived(scene.crop);
  const fs = $derived(scene.fontSize);
  const pad = $derived(v.w * 0.3);
  const url = (id: string | null) => (id ? `url(#${uid}-${id})` : undefined);

  // Labels never smaller than 10 px on screen; drop the ones that would then overlap.
  let pxHeight = $state(0);
  const labelSize = $derived(pxHeight > 0 ? Math.max(fs, (10 * v.h) / pxHeight) : fs);
  const labels = $derived.by(() => {
    let last = Infinity;
    return scene.labels.filter((l) => {
      if (last - l.y < labelSize * 1.5) return false;
      last = l.y;
      return true;
    });
  });
</script>

<svg
  bind:clientHeight={pxHeight}
  viewBox="{v.x} {v.y} {v.w} {v.h}"
  class="relative block h-full w-full {cls}"
  preserveAspectRatio="xMidYMid slice"
  role={label ? "img" : undefined}
  aria-label={label}
  aria-hidden={label ? undefined : "true"}
>
  <defs>
    {#each scene.filters as f (f.id)}
      <filter
        id="{uid}-{f.id}"
        filterUnits="userSpaceOnUse"
        x={v.x - pad}
        y={v.y - pad}
        width={v.w + 2 * pad}
        height={v.h + 2 * pad}
        color-interpolation-filters="sRGB"
      >
        <feGaussianBlur stdDeviation="{f.sx} {f.sy}" />
      </filter>
    {/each}
  </defs>

  {#if !photo}
    <rect x={v.x} y={v.y} width={v.w} height={v.h} fill={scene.sky} />
  {/if}
  {#if scene.hills?.d}
    <path d={scene.hills.d} fill={scene.hills.fill} filter={url(scene.hills.filter)} />
  {/if}
  {#if photo && scene.stadiumGround}
    <path d={scene.stadiumGround} fill={scene.ground} />
  {:else if scene.horizon < v.y + v.h}
    {@const top = Math.max(v.y, scene.horizon)}
    <rect x={v.x} y={top} width={v.w} height={v.y + v.h - top} fill={scene.ground} />
  {/if}
  {#each scene.areas as a, i (i)}
    {#if a.d}<path d={a.d} fill={a.fill} />{/if}
  {/each}
  {#each scene.lines as l, i (i)}
    <path
      d={l.d}
      fill={l.fill ?? "none"}
      stroke={l.stroke}
      stroke-width={l.width}
      stroke-linecap="round"
      filter={url(l.filter)}
    />
  {/each}

  {#if scene.zone}
    <path d={scene.zone.fill} fill="rgb(52 199 110 / 0.26)" />
    {#each scene.zone.edges as d, i (i)}
      <path d={d} stroke="rgb(30 160 85 / 0.9)" stroke-width={fs * 0.08} fill="none" />
    {/each}
    {#if scene.zone.focus}
      <path
        d={scene.zone.focus}
        stroke="rgb(255 255 255 / 0.85)"
        stroke-width={fs * 0.07}
        stroke-dasharray="{fs * 0.4} {fs * 0.3}"
        fill="none"
      />
    {/if}
  {/if}

  {#each scene.backdrop as b, i (i)}
    <path d={b.d} fill={b.fill} filter={url(b.filter)} />
  {/each}

  {#if scene.reference}
    <g filter={url(scene.reference.filter)}>
      {#each scene.reference.solid as d, i (i)}<path {d} fill="#6f7782" />{/each}
    </g>
  {/if}
  <g filter={url(scene.subject.filter)}>
    {#each scene.subject.solid as d, i (i)}<path {d} fill="#262b33" />{/each}
    {#each scene.subject.light as d, i (i)}<path {d} fill="rgb(255 255 255 / 0.22)" />{/each}
  </g>

  {#each labels as l, i (i)}
    <text
      x={l.x}
      y={l.y}
      font-size={labelSize}
      fill="white"
      stroke="rgb(0 0 0 / 0.45)"
      stroke-width={labelSize * 0.16}
      paint-order="stroke"
      font-family="Geist Mono Variable, ui-monospace, monospace">{l.text}</text
    >
  {/each}

  {#if thirds}
    <g stroke="rgb(255 255 255 / 0.55)" stroke-width={fs * 0.05}>
      {#each [1, 2] as k (k)}
        <line x1={c.x + (c.w * k) / 3} y1={c.y} x2={c.x + (c.w * k) / 3} y2={c.y + c.h} />
        <line x1={c.x} y1={c.y + (c.h * k) / 3} x2={c.x + c.w} y2={c.y + (c.h * k) / 3} />
      {/each}
    </g>
  {/if}

  {#each frames as f (f.label)}
    <rect
      x={f.rect.x}
      y={f.rect.y}
      width={f.rect.w}
      height={f.rect.h}
      fill="none"
      stroke="rgb(255 214 102 / 0.9)"
      stroke-width={fs * 0.07}
      stroke-dasharray="{fs * 0.5} {fs * 0.25}"
    />
    <text
      x={f.rect.x + fs * 0.35}
      y={f.rect.y + fs * 1.05}
      font-size={fs * 0.8}
      fill="rgb(255 214 102)"
      stroke="rgb(0 0 0 / 0.5)"
      stroke-width={fs * 0.14}
      paint-order="stroke">{f.label}</text
    >
  {/each}

  {#if ownLabel}
    <text
      x={v.x + fs * 0.45}
      y={v.y + fs * 1.15}
      font-size={fs * 0.8}
      fill="rgb(255 214 102)"
      stroke="rgb(0 0 0 / 0.5)"
      stroke-width={fs * 0.14}
      paint-order="stroke">{ownLabel}</text
    >
  {/if}
</svg>
