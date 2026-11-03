<script lang="ts">
  import Link from "@lucide/svelte/icons/link";
  import RotateCcw from "@lucide/svelte/icons/rotate-ccw";
  import Sun from "@lucide/svelte/icons/sun";
  import Moon from "@lucide/svelte/icons/moon";
  import Monitor from "@lucide/svelte/icons/monitor";
  import Columns2 from "@lucide/svelte/icons/columns-2";
  import { compare, prefs, resetSettings, setCompare, shareUrl, toast, type Theme } from "~/lib/store.svelte";
  import Logo from "./Logo.svelte";

  const next: Record<Theme, Theme> = { system: "light", light: "dark", dark: "system" };
  const themeLabel: Record<Theme, string> = { system: "Theme: system", light: "Theme: light", dark: "Theme: dark" };

  async function share() {
    const url = shareUrl();
    try {
      await navigator.clipboard.writeText(url);
      toast("Link copied — it opens this exact setup");
    } catch {
      window.prompt("Copy this link:", url);
    }
  }

  function reset() {
    if (confirm("Reset all settings to the defaults? Your custom subjects stay.")) resetSettings();
  }

  const btn = "grid size-9 place-items-center rounded-lg text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink";
</script>

<header class="border-b border-line bg-surface/80 backdrop-blur supports-[backdrop-filter]:bg-surface/70">
  <div class="mx-auto flex h-14 max-w-[1500px] items-center gap-2.5 px-4 sm:gap-3 sm:px-6">
    <Logo class="size-8 shrink-0" />
    <div class="min-w-0">
      <h1 class="truncate text-sm leading-tight font-semibold tracking-tight sm:text-[15px]">Focal Length Tester</h1>
      <p class="hidden truncate text-xs text-ink-3 sm:block">How big does it look — and what is in focus?</p>
    </div>
    <div class="ml-auto flex items-center gap-0.5 sm:gap-1">
      <button
        type="button"
        class="flex h-9 items-center gap-1.5 rounded-lg border px-2 text-sm font-medium transition-colors sm:mr-1 sm:px-2.5 {compare.on
          ? 'border-accent bg-accent-soft text-accent-ink'
          : 'border-line text-ink-2 hover:border-line-strong hover:text-ink'}"
        aria-pressed={compare.on}
        title="Compare two setups side by side"
        onclick={() => setCompare(!compare.on)}
      >
        <Columns2 class="size-4" /><span class="max-sm:hidden">Compare</span>
      </button>
      <div class="flex rounded-lg bg-surface-2 p-0.5 text-xs font-medium sm:mr-1" role="radiogroup" aria-label="Units">
        {#each [["metric", "m"], ["imperial", "ft"]] as const as [value, label] (value)}
          <button
            type="button"
            role="radio"
            aria-checked={prefs.units === value}
            class="h-7 rounded-md px-2 sm:px-2.5 {prefs.units === value ? 'bg-surface text-ink shadow-sm dark:bg-surface-3' : 'text-ink-3 hover:text-ink'}"
            onclick={() => (prefs.units = value)}>{label}</button
          >
        {/each}
      </div>
      <button type="button" class={btn} title={themeLabel[prefs.theme]} aria-label={themeLabel[prefs.theme]} onclick={() => (prefs.theme = next[prefs.theme])}>
        {#if prefs.theme === "light"}<Sun class="size-4" />{:else if prefs.theme === "dark"}<Moon class="size-4" />{:else}<Monitor class="size-4" />{/if}
      </button>
      <button type="button" class="{btn} max-sm:hidden" title="Reset settings" aria-label="Reset settings" onclick={reset}>
        <RotateCcw class="size-4" />
      </button>
      <button
        type="button"
        class="ml-1 flex h-9 items-center gap-1.5 rounded-lg bg-accent px-3 text-sm font-semibold text-white transition-colors hover:bg-accent-strong dark:text-black"
        onclick={share}
      >
        <Link class="size-4" /><span class="hidden sm:inline">Share</span>
      </button>
    </div>
  </div>
</header>
