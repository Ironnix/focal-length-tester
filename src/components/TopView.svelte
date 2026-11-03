<script lang="ts">
  // Bird's-eye map: camera on the left, looking right. Drag the subject, the background or
  // (with manual focus) the focus line to change the distances.
  import { getField } from "~/lib/fields";
  import { live, prefs, settings } from "~/lib/store.svelte";
  import { REFERENCE_PERSON } from "~/lib/subjects";
  import { len, niceStepFor } from "~/lib/units";

  let measured = $state(640);
  // bind:clientWidth reports 0 before layout; never lay out narrower than this.
  const width = $derived(Math.max(measured, 240));

  const m = $derived(live.model);
  const subject = $derived(live.subject);
  const field = $derived(getField(settings.field));
  const d = $derived(settings.distance);
  const halfAngle = $derived(Math.atan(m.frame.width / 2 / m.projection));

  // What the map has to show, in metres.
  const needed = $derived.by(() => {
    const subjectEnd = d + subject.depth;
    let zEnd = Math.max(subjectEnd * 1.3, subjectEnd + 1);
    if (Number.isFinite(m.dof.far) && m.dof.far < zEnd * 2) zEnd = Math.max(zEnd, m.dof.far * 1.08);
    if (m.background !== null && m.background < zEnd * 4) zEnd = Math.max(zEnd, m.background * 1.08 + 1);
    let half = Math.max((subject.width / 2) * 1.6, zEnd * 0.1);
    if (field && field.length < zEnd * 6) {
      zEnd = Math.max(zEnd, field.length + 3);
      half = Math.max(half, field.width / 2 + 2);
    }
    if (settings.reference) half = Math.max(half, subject.width / 2 + 1.6);
    return { zEnd, half };
  });

  // Frozen while dragging so the map doesn't rescale under the pointer.
  let frozen = $state<{ zEnd: number; half: number } | null>(null);
  const span = $derived(frozen ?? needed);

  const MIN_H = 170;
  const MAX_H = 320;
  const layout = $derived.by(() => {
    const zMin = -span.zEnd * 0.05;
    let k = width / (span.zEnd - zMin);
    let height = 2 * span.half * k + 28;
    if (height > MAX_H) {
      k = (MAX_H - 28) / (2 * span.half);
      height = MAX_H;
    }
    height = Math.max(MIN_H, height);
    return { zMin, k, height, zMax: zMin + width / k };
  });

  const X = (z: number) => (z - layout.zMin) * layout.k;
  const Y = (x: number) => (layout.height - 24) / 2 + x * layout.k;
  const cy = $derived(Y(0));

  const ticks = $derived.by(() => {
    const step = niceStepFor((layout.zMax - layout.zMin) / 7, prefs.units);
    const out: number[] = [];
    for (let z = step; z < layout.zMax && out.length < 40; z += step) out.push(z);
    return out;
  });

  const fieldPath = (pts: [number, number][], closed = false) =>
    `M${pts.map(([x, z]) => `${X(z).toFixed(1)} ${Y(x).toFixed(1)}`).join("L")}${closed ? "Z" : ""}`;

  // Visible cone, stopped at the map's right edge.
  const coneEnd = $derived(layout.zMax + 10);
  const tan = $derived(Math.tan(halfAngle));
  const cone = $derived(
    `M${X(0)} ${cy}L${X(coneEnd)} ${Y(-coneEnd * tan)}L${X(coneEnd)} ${Y(coneEnd * tan)}Z`,
  );
  const zone = $derived.by(() => {
    const n = Math.max(0, m.dof.near);
    const f = Math.min(Number.isFinite(m.dof.far) ? m.dof.far : coneEnd, coneEnd);
    return `M${X(n)} ${Y(-n * tan)}L${X(f)} ${Y(-f * tan)}L${X(f)} ${Y(f * tan)}L${X(n)} ${Y(n * tan)}Z`;
  });

  const bg = $derived(m.background);
  const bgOnMap = $derived(bg !== null && bg < layout.zMax);
  const bgMarks = $derived.by(() => {
    if (!bgOnMap || bg === null) return [];
    const half = Math.min(bg * tan * 1.4 + 6, (layout.height / layout.k) * 0.6);
    const step = settings.background === "trees" ? 5.5 : 22;
    const pxStep = step * layout.k;
    // Too dense to draw individually: the line alone says enough.
    if (pxStep < 5) return [];
    const out: number[] = [];
    for (let x = -Math.ceil(half / step) * step; x <= half; x += step) out.push(x);
    return out;
  });

  // ---- dragging ------------------------------------------------------------------------
  let svg: SVGSVGElement | undefined = $state();
  let dragging = $state<"subject" | "background" | "focus" | null>(null);

  function zAt(e: PointerEvent): number {
    const r = svg!.getBoundingClientRect();
    return (e.clientX - r.left) / layout.k + layout.zMin;
  }

  /** Rounds to ~3 significant digits so values read cleanly. */
  function tidy(v: number): number {
    const p = 10 ** (Math.floor(Math.log10(Math.abs(v))) - 2);
    return Math.round(v / p) * p;
  }

  function apply(e: PointerEvent) {
    const z = zAt(e);
    if (dragging === "subject") settings.distance = tidy(Math.max(0.1, z - subject.depth / 2));
    else if (dragging === "background") settings.bgGap = tidy(Math.max(0.2, z - d - subject.depth / 2));
    else if (dragging === "focus") settings.focus = tidy(Math.max(0.1, z));
  }

  function start(e: PointerEvent, what: "subject" | "background" | "focus") {
    e.preventDefault();
    e.stopPropagation();
    frozen = { ...needed };
    dragging = what;
    svg!.setPointerCapture(e.pointerId);
    apply(e);
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

  const subjectLabel = $derived(`${subject.name} · ${len(d, prefs.units)}`);
  const refX = $derived(subject.width / 2 + 0.4 + REFERENCE_PERSON.width / 2);
</script>

<div bind:clientWidth={measured} class="relative select-none">
  <svg
    bind:this={svg}
    width={width}
    height={layout.height}
    viewBox="0 0 {width} {layout.height}"
    class="block touch-none {dragging ? 'cursor-grabbing' : 'cursor-crosshair'}"
    role="presentation"
    onpointerdown={(e) => start(e, "subject")}
    onpointermove={(e) => dragging && apply(e)}
    onpointerup={end}
    onpointercancel={end}
  >
    <defs>
      <clipPath id="map-clip"><rect x="0" y="0" width={width} height={layout.height - 24} /></clipPath>
    </defs>
    <rect x="0" y="0" width={width} height={layout.height - 24} class="fill-surface-2" />

    <g clip-path="url(#map-clip)">
      {#if field}
        <rect
          x="0"
          y="0"
          width={width}
          height={layout.height - 24}
          fill={field.surround}
          opacity="0.85"
        />
        {#each field.areas as a, i (i)}
          <path d={fieldPath(a.pts, true)} fill={a.color} />
        {/each}
        {#each field.lines as l, i (i)}
          <path d={fieldPath(l.pts, l.closed)} stroke={l.color} stroke-width="1.2" fill="none" />
        {/each}
      {/if}

      {#each ticks as t (t)}
        <line x1={X(t)} y1="0" x2={X(t)} y2={layout.height - 24} class="stroke-ink/8" stroke-width="1" />
      {/each}

      <path d={cone} class="fill-accent/12 stroke-accent" stroke-width="1.2" stroke-linejoin="round" />
      <path d={zone} class="fill-focus/30" />
      {#each [m.dof.near, m.dof.far] as z, i (i)}
        {#if Number.isFinite(z) && z < layout.zMax}
          <line x1={X(z)} y1={Y(-z * tan)} x2={X(z)} y2={Y(z * tan)} class="stroke-focus" stroke-width="1.5" />
        {/if}
      {/each}

      {#if bg !== null && bgOnMap}
        <g
          class="cursor-ew-resize"
          role="presentation"
          onpointerdown={(e) => start(e, "background")}
        >
          <line x1={X(bg)} y1="0" x2={X(bg)} y2={layout.height - 24} stroke="transparent" stroke-width="16" />
          <line
            x1={X(bg)}
            y1="0"
            x2={X(bg)}
            y2={layout.height - 24}
            class="stroke-ink-3"
            stroke-width="1.5"
            stroke-dasharray="4 3"
          />
          {#each bgMarks as x (x)}
            {#if settings.background === "trees"}
              <circle cx={X(bg) + 4} cy={Y(x)} r={Math.max(2.5, Math.min(9, 2.6 * layout.k))} fill="#58745a" opacity="0.8" />
            {:else}
              <rect
                x={X(bg)}
                y={Y(x) - Math.max(2, 7 * layout.k)}
                width={Math.max(3, Math.min(20, 12 * layout.k))}
                height={Math.max(4, 14 * layout.k)}
                fill="#8c96a1"
                opacity="0.85"
              />
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
          <line x1={X(m.focus)} y1="0" x2={X(m.focus)} y2={layout.height - 24} stroke="transparent" stroke-width="16" />
        {/if}
        <line
          x1={X(m.focus)}
          y1={Y(-m.focus * tan) - 6}
          x2={X(m.focus)}
          y2={Y(m.focus * tan) + 6}
          class="stroke-ink"
          stroke-width="1.4"
          stroke-dasharray="5 3"
        />
      </g>

      {#if Number.isFinite(m.dof.hyperfocal) && m.dof.hyperfocal < layout.zMax}
        <g class="fill-ink-3 text-[10px]">
          <line x1={X(m.dof.hyperfocal)} y1={cy - 4} x2={X(m.dof.hyperfocal)} y2={cy + 4} class="stroke-ink-3" />
          <text x={X(m.dof.hyperfocal) + 3} y={cy - 5}>H</text>
        </g>
      {/if}

      <!-- subject -->
      <g
        role="slider"
        tabindex="0"
        aria-label="Subject distance"
        aria-valuenow={d}
        aria-valuetext={len(d, prefs.units)}
        class="cursor-ew-resize outline-none focus-visible:[&>rect]:stroke-accent"
        onpointerdown={(e) => start(e, "subject")}
        onkeydown={keyMove}
      >
        <rect
          x={X(d)}
          y={Y(-subject.width / 2)}
          width={Math.max(3, subject.depth * layout.k)}
          height={Math.max(3, subject.width * layout.k)}
          rx="1.5"
          class="fill-ink stroke-transparent"
          stroke-width="2"
        />
        <rect
          x={X(d) - 10}
          y={Y(-subject.width / 2) - 10}
          width={Math.max(3, subject.depth * layout.k) + 20}
          height={Math.max(3, subject.width * layout.k) + 20}
          fill="transparent"
        />
      </g>
      {#if settings.reference && subject.id !== REFERENCE_PERSON.id}
        <rect
          x={X(d)}
          y={Y(refX - REFERENCE_PERSON.width / 2)}
          width={Math.max(2, REFERENCE_PERSON.depth * layout.k)}
          height={Math.max(2, REFERENCE_PERSON.width * layout.k)}
          class="fill-ink-3"
        />
      {/if}

      <!-- camera -->
      <g transform="translate({X(0)} {cy})" class="pointer-events-none">
        <rect x="-13" y="-8" width="11" height="16" rx="2.5" class="fill-ink" />
        <path d="M-3 -4.5L1.5 -6.5V6.5L-3 4.5Z" class="fill-ink" />
      </g>
    </g>

    <!-- labels -->
    <g class="pointer-events-none text-[11px] font-medium">
      <text
        x={Math.min(X(d) + 2, width - 4)}
        y={Math.max(13, Y(-subject.width / 2) - 7)}
        text-anchor={X(d) > width * 0.75 ? "end" : "start"}
        class="fill-ink"
        paint-order="stroke"
        stroke="var(--surface-2)"
        stroke-width="3">{subjectLabel}</text
      >
      {#if bg !== null}
        {#if bgOnMap}
          <text
            x={X(bg) - 4}
            y="13"
            text-anchor="end"
            class="fill-ink-2"
            paint-order="stroke"
            stroke="var(--surface-2)"
            stroke-width="3">Background · {len(bg, prefs.units)}</text
          >
        {:else}
          <text x={width - 6} y="13" text-anchor="end" class="fill-ink-2">Background {len(bg, prefs.units)} →</text>
        {/if}
      {/if}
      <text x="6" y={layout.height - 30} class="fill-focus text-[10px]" paint-order="stroke" stroke="var(--surface-2)" stroke-width="3"
        >In focus {len(m.dof.near, prefs.units)} – {len(m.dof.far, prefs.units)}</text
      >
    </g>

    <!-- ruler -->
    <g class="text-[10px]">
      <line x1="0" y1={layout.height - 24} x2={width} y2={layout.height - 24} class="stroke-line-strong" />
      {#each ticks as t (t)}
        <line x1={X(t)} y1={layout.height - 24} x2={X(t)} y2={layout.height - 19} class="stroke-ink-3" />
        <text x={X(t)} y={layout.height - 7} text-anchor="middle" class="fill-ink-3 font-mono">{len(t, prefs.units)}</text>
      {/each}
      <text x={X(0)} y={layout.height - 7} text-anchor="middle" class="fill-ink-3 font-mono">0</text>
    </g>
  </svg>
</div>
