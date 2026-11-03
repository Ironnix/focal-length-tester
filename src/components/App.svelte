<script lang="ts">
  import { MediaQuery } from "svelte/reactivity";
  import { live, prefs, resetSettings, ui, type Tab } from "~/lib/store.svelte";
  import { len, pct } from "~/lib/units";
  import CameraPanel from "./controls/CameraPanel.svelte";
  import DistancePanel from "./controls/DistancePanel.svelte";
  import LensPanel from "./controls/LensPanel.svelte";
  import ScenePanel from "./controls/ScenePanel.svelte";
  import SubjectPanel from "./controls/SubjectPanel.svelte";
  import CustomSubjectDialog from "./CustomSubjectDialog.svelte";
  import Details from "./Details.svelte";
  import FocalStrip from "./FocalStrip.svelte";
  import Header from "./Header.svelte";
  import StatTiles from "./StatTiles.svelte";
  import TopView from "./TopView.svelte";
  import Viewfinder from "./Viewfinder.svelte";

  const desktop = new MediaQuery("min-width: 1024px");

  const TABS: { id: Tab; label: string }[] = [
    { id: "subject", label: "Subject" },
    { id: "distance", label: "Distance" },
    { id: "lens", label: "Lens" },
    { id: "camera", label: "Camera" },
    { id: "scene", label: "Scene" },
  ];

  const m = $derived(live.model);
  const quick = $derived(
    `${pct(live.fill.h)} of height · ${len(m.frameAtSubject.w, prefs.units)} wide · sharp ${len(m.dof.near, prefs.units)} – ${len(m.dof.far, prefs.units)}`,
  );
</script>

{#snippet tabBar(cls: string)}
  <nav class="scrollbar-thin flex gap-1 overflow-x-auto rounded-xl bg-surface-2 p-1 {cls}" aria-label="Settings">
    {#each TABS as t (t.id)}
      <button
        type="button"
        class="h-8 flex-1 rounded-lg px-3 text-xs font-medium whitespace-nowrap transition-colors {ui.tab === t.id
          ? 'bg-surface text-ink shadow-sm dark:bg-surface-3'
          : 'text-ink-2 hover:text-ink'}"
        aria-current={ui.tab === t.id}
        onclick={() => (ui.tab = t.id)}>{t.label}</button
      >
    {/each}
  </nav>
{/snippet}

{#snippet topView()}
  <section class="rounded-2xl border border-line bg-surface p-3 sm:p-4">
    <h2 class="mb-2 text-sm font-semibold">Top view</h2>
    <TopView />
  </section>
{/snippet}

{#snippet panel(id: Tab)}
  {#if id === "subject"}<SubjectPanel />
  {:else if id === "distance"}<DistancePanel />
  {:else if id === "lens"}<LensPanel />
  {:else if id === "camera"}<CameraPanel />
  {:else}<ScenePanel />{/if}
{/snippet}

<Header />

<main class="mx-auto max-w-[1500px] px-4 pb-10 sm:px-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(340px,390px)] lg:gap-6 lg:pt-5">
  <div class="min-w-0 space-y-4">
    {#if desktop.current}
      <Viewfinder maxHeight="54vh" />
      {@render topView()}
      <StatTiles />
    {:else}
      <!-- On phones the picture stays on screen while the controls scroll beneath it. -->
      <div>
        <div class="sticky top-0 z-20 -mx-4 border-b border-line bg-bg/95 px-4 pt-3 backdrop-blur sm:-mx-6 sm:px-6">
          <Viewfinder maxHeight="32vh" />
          <p class="mt-1.5 truncate text-center font-mono text-[11px] text-ink-2 tabular-nums">{quick}</p>
          {@render tabBar("mt-1 mb-2")}
        </div>
        <div class="pt-3">{@render panel(ui.tab)}</div>
      </div>
      {@render topView()}
      <StatTiles />
    {/if}

    <section class="rounded-2xl border border-line bg-surface p-4">
      <div class="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 class="text-sm font-semibold">Same spot, other lenses</h2>
        <p class="text-xs text-ink-3">Tap one to switch · % = subject height in frame</p>
      </div>
      <FocalStrip />
    </section>

    <Details />

    <footer class="space-y-2 px-1 pt-2 text-xs leading-relaxed text-ink-3">
      <p>
        Thin-lens maths: framing includes focus breathing at close range, depth of field uses the circle of
        confusion shown above, and the preview blurs every depth by its own blur disc. Anamorphic lenses are
        treated as squeezing the width only (bokeh turns into upright ovals). Real lenses differ a little —
        use it to plan, then check through the viewfinder.
      </p>
      <p>
        Settings stay in this browser. <button
          type="button"
          class="underline decoration-line-strong underline-offset-2 hover:text-ink"
          onclick={() => confirm("Reset all settings to the defaults? Your custom subjects stay.") && resetSettings()}
          >Reset settings</button
        > · <a
          class="underline decoration-line-strong underline-offset-2 hover:text-ink"
          href="https://github.com/Ironnix/focal-length-tester">Source on GitHub</a
        >
      </p>
    </footer>
  </div>

  {#if desktop.current}
    <aside class="sticky top-5 flex max-h-[calc(100dvh-2.5rem)] flex-col self-start">
      {@render tabBar("shrink-0")}
      <div class="scrollbar-thin mt-3 min-h-0 overflow-y-auto pb-4">{@render panel(ui.tab)}</div>
    </aside>
  {/if}
</main>

<CustomSubjectDialog />

{#if ui.toast}
  <div
    role="status"
    class="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-sm font-medium text-bg shadow-lg"
  >
    {ui.toast}
  </div>
{/if}
