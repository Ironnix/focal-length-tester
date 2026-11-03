<script lang="ts">
  // Bird's-eye map in field coordinates (z to the right, x downwards). Drag the subject, the
  // background or (with manual focus) the focus line; on a field also drag the camera — it
  // always turns to face the subject.
  import { getField } from "~/lib/fields";
  import { along, placement, type P } from "~/lib/placement";
  import { compare, live, placeCamera, placeSubject, prefs, settings, tidy } from "~/lib/store.svelte";
  import { REFERENCE_PERSON } from "~/lib/subjects";
  import { STADIUM } from "~/lib/backdrop";
  import { backgroundOf } from "~/lib/settings";
  import { len, niceStepFor } from "~/lib/units";

  let measured = $state(640);
  // bind:clientWidth reports 0 before layout; never lay out narrower than this.
  const width = $derived(Math.max(measured, 240));

  const m = $derived(live.model);
  const subject = $derived(live.subject);
  const field = $derived(getField(settings.field));
  const inStadium = $derived(backgroundOf(settings) === "stadium");
  const onField = $derived(field !== null);
  const d = $derived(settings.distance);
  const place = $derived(placement(settings));
  const tan = $derived(m.frame.width / 2 / m.projection);
  const at = (ahead: number, side = 0) => along(place, ahead, side);

  // Compare mode: the other setup drawn as an outline, when it stands on the same ground.
  const ghost = $derived.by(() => {
    const o = live.other;
    if (!o || o.settings.field !== settings.field) return null;
    const p = placement(o.settings);
    const t = o.model.frame.width / 2 / o.model.projection;
    const d = o.settings.distance;
    const w = o.subject.width / 2;
    return {
      label: compare.side === "a" ? "B" : "A",
      place: p,
      tan: t,
      camera: p.camera,
      subject: along(p, d + o.subject.depth / 2),
      footprint: [along(p, d, -w), along(p, d, w), along(p, d + o.subject.depth, w), along(p, d + o.subject.depth, -w)] as P[],
    };
  });

  // Everything the map has to show, as a box in field coordinates.
  const needed = $derived.by(() => {
    const end = d + subject.depth;
    const ahead = Math.max(end * 1.3, end + 1);
    const pts: P[] = [
      at(-ahead * 0.05),
      at(ahead),
      at(ahead * 0.6, ahead * 0.1),
      at(ahead * 0.6, -ahead * 0.1),
      at(d, subject.width * 0.8),
      at(d, -subject.width * 0.8),
    ];
    if (Number.isFinite(m.dof.far) && m.dof.far < ahead * 2) pts.push(at(m.dof.far * 1.05));
    if (m.background !== null && m.background < ahead * 4) pts.push(at(m.background * 1.06 + 1));
    if (settings.reference) pts.push(at(d, subject.width / 2 + 1.6));
    if (field) {
      pts.push([-field.width / 2 - 2, -2], [field.width / 2 + 2, field.length + 2]);
    }
    if (ghost) pts.push(ghost.camera, ...ghost.footprint);
    if (inStadium) {
      const b = STADIUM.box;
      pts.push([b.minX - 6, b.minZ - 6], [b.maxX + 6, b.maxZ + 6]);
    }
    const xs = pts.map((p) => p[0]);
    const zs = pts.map((p) => p[1]);
    return { minX: Math.min(...xs), maxX: Math.max(...xs), minZ: Math.min(...zs), maxZ: Math.max(...zs) };
  });

  // Frozen while dragging so the map doesn't rescale under the pointer.
  let frozen = $state<typeof needed | null>(null);
  const box = $derived(frozen ?? needed);

  const MIN_H = 180;
  const MAX_H = 340;
  const PAD = 14;
  const layout = $derived.by(() => {
    const spanZ = Math.max(box.maxZ - box.minZ, 0.5);
    const spanX = Math.max(box.maxX - box.minX, 0.5);
    const k = Math.min((width - 2 * PAD) / spanZ, (MAX_H - 2 * PAD) / spanX);
    const height = Math.min(MAX_H, Math.max(MIN_H, spanX * k + 2 * PAD));
    return {
      k,
      height,
      ox: (width - spanZ * k) / 2 - box.minZ * k,
      oy: (height - spanX * k) / 2 - box.minX * k,
    };
  });

  const M = ([x, z]: P): [number, number] => [layout.ox + z * layout.k, layout.oy + x * layout.k];
  const path = (pts: P[], closed = true) =>
    `M${pts.map((p) => M(p).map((v) => v.toFixed(1)).join(" ")).join("L")}${closed ? "Z" : ""}`;
  const px = (n: number) => n / layout.k;

  // Longest distance that can appear on the map, for the cone and the axis.
  const reach = $derived(Math.hypot(width, layout.height) / layout.k + Math.hypot(...place.camera) + 50);
  const cone = $derived(path([place.camera, at(reach, -reach * tan), at(reach, reach * tan)]));
  const zone = $derived.by(() => {
    const n = Math.max(0, m.dof.near);
    const f = Math.min(Number.isFinite(m.dof.far) ? m.dof.far : reach, reach);
    return path([at(n, -n * tan), at(f, -f * tan), at(f, f * tan), at(n, n * tan)]);
  });

  const ticks = $derived.by(() => {
    const step = niceStepFor(width / layout.k / 7, prefs.units);
    const out: number[] = [];
    for (let t = step; t < reach && out.length < 60; t += step) out.push(t);
    return out;
  });

  const bg = $derived(m.background);
  const bgOnMap = $derived.by(() => {
    if (bg === null || inStadium) return false;
    const [x, y] = M(at(bg));
    return x >= 0 && x <= width && y >= 0 && y <= layout.height;
  });
  const bgHalf = $derived(bg === null ? 0 : Math.min(bg * tan * 1.4 + 6, px(layout.height + width)));
  const bgMarks = $derived.by(() => {
    if (!bgOnMap || bg === null) return [];
    const step = settings.background === "trees" ? 5.5 : 22;
    if (step * layout.k < 5) return [];
    const out: number[] = [];
    for (let x = -Math.ceil(bgHalf / step) * step; x <= bgHalf && out.length < 300; x += step) out.push(x);
    return out;
  });

  const footprint = $derived(
    path([at(d, -subject.width / 2), at(d, subject.width / 2), at(d + subject.depth, subject.width / 2), at(d + subject.depth, -subject.width / 2)]),
  );
  const refX = $derived(subject.width / 2 + 0.4 + REFERENCE_PERSON.width / 2);
  const camAt = $derived(M(place.camera));
  const subjAt = $derived(M(at(d + subject.depth / 2)));
  const yawDeg = $derived((place.yaw * 180) / Math.PI);

  // ---- dragging ------------------------------------------------------------------------
  let svg: SVGSVGElement | undefined = $state();
  let dragging = $state<"subject" | "camera" | "background" | "focus" | null>(null);

  function worldAt(e: PointerEvent): P {
    const r = svg!.getBoundingClientRect();
    return [(e.clientY - r.top - layout.oy) / layout.k, (e.clientX - r.left - layout.ox) / layout.k];
  }

  /** Distance of a point along the line of sight. */
  function aheadOf(p: P): number {
    return (p[0] - place.camera[0]) * place.forward[0] + (p[1] - place.camera[1]) * place.forward[1];
  }

  function apply(e: PointerEvent) {
    const p = worldAt(e);
    if (dragging === "subject") {
      if (onField) placeSubject(p);
      else settings.distance = tidy(Math.max(0.1, aheadOf(p) - subject.depth / 2));
    } else if (dragging === "camera") {
      placeCamera(p);
    } else if (dragging === "background") {
      settings.bgGap = tidy(Math.max(0.2, aheadOf(p) - d - subject.depth / 2));
    } else if (dragging === "focus") {
      settings.focus = tidy(Math.max(0.1, aheadOf(p)));
    }
  }

  function start(e: PointerEvent, what: NonNullable<typeof dragging>) {
    e.preventDefault();
    e.stopPropagation();
    frozen = { ...needed };
    dragging = what;
    svg!.setPointerCapture(e.pointerId);
    if (what !== "camera") apply(e);
  }

  function end() {
    dragging = null;
    frozen = null;
  }

  function keyMove(e: KeyboardEvent) {
    const f = e.shiftKey ? 1.25 : 1.05;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") settings.distance = tidy(settings.distance * f);
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") settings.distance = tidy(Math.max(0.1, settings.distance / f));
    else return;
    e.preventDefault();
  }

  const halo = { "paint-order": "stroke", stroke: "var(--surface-2)", "stroke-width": 3 };
</script>

<div bind:clientWidth={measured} class="relative select-none">
  <svg
    bind:this={svg}
    {width}
    height={layout.height}
    viewBox="0 0 {width} {layout.height}"
    class="block touch-none rounded-lg {dragging ? 'cursor-grabbing' : 'cursor-crosshair'}"
    role="presentation"
    onpointerdown={(e) => start(e, "subject")}
    onpointermove={(e) => dragging && apply(e)}
    onpointerup={end}
    onpointercancel={end}
  >
    <rect x="0" y="0" {width} height={layout.height} class="fill-surface-2" />

    {#if field}
      <rect x="0" y="0" {width} height={layout.height} fill={field.surround} opacity="0.85" />
      {#each field.areas as a, i (i)}
        <path d={path(a.pts)} fill={a.color} />
      {/each}
      {#each field.lines as l, i (i)}
        <path d={path(l.pts, !!l.closed)} stroke={l.color} stroke-width="1.2" fill="none" />
      {/each}
    {/if}

    {#if ghost}
      {@const g = ghost}
      {@const r = reach + Math.hypot(g.camera[0] - place.camera[0], g.camera[1] - place.camera[1])}
      <g class="pointer-events-none">
        <path
          d={path([g.camera, along(g.place, r, -r * g.tan), along(g.place, r, r * g.tan)])}
          class="fill-warn/8 stroke-warn"
          stroke-width="1.2"
          stroke-dasharray="5 3"
        />
        <path d={path(g.footprint)} class="fill-none stroke-warn" stroke-width="1.5" />
        <circle cx={M(g.camera)[0]} cy={M(g.camera)[1]} r="7" class="fill-surface stroke-warn" stroke-width="2" />
        <text x={M(g.camera)[0]} y={M(g.camera)[1] + 3.5} text-anchor="middle" class="fill-warn text-[10px] font-bold">{g.label}</text>
      </g>
    {/if}

    {#if inStadium}
      {@const b = STADIUM.box}
      {@const o = 30}
      <!-- stands: a ring from the boards outwards -->
      <path
        d="{path([[b.minX - o, b.minZ - o], [b.maxX + o, b.minZ - o], [b.maxX + o, b.maxZ + o], [b.minX - o, b.maxZ + o]])}{path([[b.minX, b.minZ], [b.minX, b.maxZ], [b.maxX, b.maxZ], [b.maxX, b.minZ]])}"
        fill-rule="evenodd"
        class="pointer-events-none fill-ink-3/45"
      />
      <path
        d={path([[b.minX, b.minZ], [b.maxX, b.minZ], [b.maxX, b.maxZ], [b.minX, b.maxZ]])}
        class="pointer-events-none fill-none stroke-surface"
        stroke-width="2"
      />
    {/if}

    <path d={cone} class="fill-accent/12 stroke-accent" stroke-width="1.2" stroke-linejoin="round" />
    <path d={zone} class="fill-focus/30" />
    {#each [m.dof.near, m.dof.far] as z, i (i)}
      {#if Number.isFinite(z) && z < reach}
        <path d={path([at(z, -z * tan), at(z, z * tan)], false)} class="stroke-focus" stroke-width="1.5" />
      {/if}
    {/each}

    <!-- line of sight with distance ticks -->
    <path d={path([place.camera, at(reach)], false)} class="stroke-ink/25" stroke-width="1" stroke-dasharray="2 3" />
    <g class="pointer-events-none font-mono text-[10px]">
      {#each ticks as t (t)}
        {@const [x1, y1] = M(at(t, -px(3)))}
        {@const [x2, y2] = M(at(t, px(3)))}
        {@const [lx, ly] = M(at(t, px(11)))}
        {#if lx > -20 && lx < width + 20 && ly > -20 && ly < layout.height + 20}
          <line {x1} {y1} {x2} {y2} class="stroke-ink-3" />
          <text x={lx} y={ly + 3} text-anchor="middle" class="fill-ink-2" {...halo}>{len(t, prefs.units)}</text>
        {/if}
      {/each}
    </g>

    {#if bg !== null && bgOnMap}
      <g class="cursor-ew-resize" role="presentation" onpointerdown={(e) => start(e, "background")}>
        <path d={path([at(bg, -bgHalf), at(bg, bgHalf)], false)} stroke="transparent" stroke-width="16" />
        <path d={path([at(bg, -bgHalf), at(bg, bgHalf)], false)} class="stroke-ink-3" stroke-width="1.5" stroke-dasharray="4 3" />
        {#each bgMarks as x (x)}
          {@const [cx, cy] = M(at(bg + px(4), x))}
          {#if settings.background === "trees"}
            <circle {cx} {cy} r={Math.max(2.5, Math.min(9, 2.6 * layout.k))} fill="#58745a" opacity="0.8" />
          {:else}
            <circle {cx} {cy} r={Math.max(2.5, Math.min(8, 5 * layout.k))} fill="#8c96a1" opacity="0.85" />
          {/if}
        {/each}
      </g>
    {/if}

    <!-- focus plane -->
    <g
      class={settings.focusOnSubject ? "" : "cursor-ew-resize"}
      role="presentation"
      onpointerdown={(e) => {
        if (!settings.focusOnSubject) start(e, "focus");
      }}
    >
      {#if !settings.focusOnSubject}
        <path d={path([at(m.focus, -m.focus * tan - px(6)), at(m.focus, m.focus * tan + px(6))], false)} stroke="transparent" stroke-width="16" />
      {/if}
      <path
        d={path([at(m.focus, -m.focus * tan - px(6)), at(m.focus, m.focus * tan + px(6))], false)}
        class="stroke-ink"
        stroke-width="1.4"
        stroke-dasharray="5 3"
      />
    </g>

    {#if Number.isFinite(m.dof.hyperfocal) && m.dof.hyperfocal < reach}
      {@const [hx, hy] = M(at(m.dof.hyperfocal, -px(8)))}
      <text x={hx} y={hy} text-anchor="middle" class="pointer-events-none fill-ink-3 text-[10px] font-semibold" {...halo}>H</text>
    {/if}

    <!-- subject -->
    {#if settings.reference && subject.id !== REFERENCE_PERSON.id}
      <path
        d={path([at(d, refX - 0.25), at(d, refX + 0.25), at(d + 0.3, refX + 0.25), at(d + 0.3, refX - 0.25)])}
        class="pointer-events-none fill-ink-3"
      />
    {/if}
    <g
      role="slider"
      tabindex="0"
      aria-label="Subject distance"
      aria-valuenow={d}
      aria-valuetext={len(d, prefs.units)}
      class="cursor-move outline-none [&:focus-visible>circle]:stroke-accent"
      onpointerdown={(e) => start(e, "subject")}
      onkeydown={keyMove}
    >
      <circle cx={subjAt[0]} cy={subjAt[1]} r="12" fill="transparent" class="stroke-transparent" stroke-width="2" />
      <path d={footprint} class="fill-ink" />
      <circle cx={subjAt[0]} cy={subjAt[1]} r="2.5" class="fill-ink" />
    </g>

    <!-- camera -->
    <g
      transform="translate({camAt[0]} {camAt[1]}) rotate({yawDeg})"
      class={onField ? "cursor-move" : "pointer-events-none"}
      role="presentation"
      onpointerdown={(e) => {
        if (onField) start(e, "camera");
      }}
    >
      <circle r="14" fill="transparent" />
      <rect x="-13" y="-8" width="11" height="16" rx="2.5" class="fill-ink" />
      <path d="M-3 -4.5L1.5 -6.5V6.5L-3 4.5Z" class="fill-ink" />
    </g>

    <!-- labels -->
    <g class="pointer-events-none text-[11px] font-medium">
      <text
        x={Math.min(Math.max(subjAt[0], 40), width - 40)}
        y={Math.max(13, subjAt[1] - Math.max(12, (subject.width / 2) * layout.k + 8))}
        text-anchor="middle"
        class="fill-ink"
        {...halo}>{subject.name} · {len(d, prefs.units)}</text
      >
      {#if bg !== null && !bgOnMap && !inStadium}
        <text x={width - 6} y="13" text-anchor="end" class="fill-ink-2">Background {len(bg, prefs.units)} →</text>
      {/if}
    </g>
  </svg>
  <p class="mt-2 flex flex-wrap justify-between gap-x-4 gap-y-1 text-xs text-ink-3">
    <span><span class="font-medium text-focus">In focus {len(m.dof.near, prefs.units)} – {len(m.dof.far, prefs.units)}</span>{#if bg !== null} · {inStadium ? "stands" : "background"} at {len(bg, prefs.units)}{/if}</span>
    <span>{onField ? "Drag the camera or the subject anywhere on the field" : "Drag the subject or the background"}</span>
  </p>
</div>
