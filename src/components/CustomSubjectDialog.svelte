<script lang="ts">
  import X from "@lucide/svelte/icons/x";
  import { SHAPE_NAMES, type ShapeId } from "~/lib/shapes";
  import { deleteCustomSubject, library, prefs, saveCustomSubject, ui } from "~/lib/store.svelte";
  import type { Subject } from "~/lib/subjects";
  import { fromDisplay, lenUnit, toDisplay } from "~/lib/units";
  import NumberField from "./ui/NumberField.svelte";
  import SubjectIcon from "./SubjectIcon.svelte";

  let dialog: HTMLDialogElement | undefined = $state();
  let draft: Subject | null = $state(null);

  $effect(() => {
    if (ui.editing && dialog && !dialog.open) {
      draft = { ...ui.editing };
      dialog.showModal();
    }
  });

  const exists = $derived(!!draft && library.custom.some((s) => s.id === draft!.id));
  const unit = $derived(lenUnit(prefs.units));
  const shapes = Object.keys(SHAPE_NAMES) as ShapeId[];

  function close() {
    dialog?.close();
  }

  function save(e: SubmitEvent) {
    e.preventDefault();
    if (!draft) return;
    saveCustomSubject({ ...draft, name: draft.name.trim() || "Custom subject" });
    close();
  }
</script>

<dialog
  bind:this={dialog}
  class="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-2xl border border-line bg-surface p-0 text-ink shadow-xl backdrop:bg-black/40"
  onclose={() => (ui.editing = null)}
>
  {#if draft}
    <form class="space-y-4 p-5" onsubmit={save}>
      <div class="flex items-center justify-between">
        <h2 class="text-base font-semibold">{exists ? "Edit subject" : "Custom subject"}</h2>
        <button type="button" class="grid size-8 place-items-center rounded-md text-ink-3 hover:bg-surface-2" aria-label="Close" onclick={close}>
          <X class="size-4" />
        </button>
      </div>

      <label class="block space-y-1.5">
        <span class="text-xs font-medium text-ink-2">Name</span>
        <input
          class="h-9 w-full rounded-lg border border-line bg-surface px-2.5 text-sm outline-none focus:border-accent"
          bind:value={draft.name}
          maxlength="40"
          placeholder="e.g. My dog, Race car, Drone"
        />
      </label>

      <div class="grid grid-cols-3 gap-2">
        {#each [["width", "Width"], ["height", "Height"], ["depth", "Depth"]] as const as [key, label] (key)}
          <div class="space-y-1.5">
            <span class="text-xs font-medium text-ink-2">{label}</span>
            <NumberField
              {label}
              value={toDisplay(draft[key], prefs.units)}
              {unit}
              digits={3}
              min={0.001}
              onchange={(v) => (draft![key] = Math.max(0.001, fromDisplay(v, prefs.units)))}
            />
          </div>
        {/each}
      </div>
      <p class="-mt-2 text-xs text-ink-3">Width and height as the camera sees them; depth only matters for the map.</p>

      <div class="space-y-1.5">
        <span class="text-xs font-medium text-ink-2">Silhouette</span>
        <div class="grid grid-cols-5 gap-1.5">
          {#each shapes as shape (shape)}
            <button
              type="button"
              class="flex flex-col items-center gap-0.5 rounded-lg border px-1 py-1.5 {draft.shape === shape
                ? 'border-accent bg-accent-soft text-accent-ink'
                : 'border-line text-ink-2 hover:border-line-strong'}"
              aria-pressed={draft.shape === shape}
              title={SHAPE_NAMES[shape]}
              onclick={() => (draft!.shape = shape)}
            >
              <SubjectIcon {shape} class="h-6 w-10" />
              <span class="w-full truncate text-center text-[10px]">{SHAPE_NAMES[shape]}</span>
            </button>
          {/each}
        </div>
        <p class="text-xs text-ink-3">The silhouette is stretched to your width and height.</p>
      </div>

      <div class="flex items-center justify-between gap-2 pt-1">
        {#if exists}
          <button
            type="button"
            class="h-9 rounded-lg px-3 text-sm font-medium text-red-600 hover:bg-red-500/10 dark:text-red-400"
            onclick={() => {
              deleteCustomSubject(draft!.id);
              close();
            }}>Delete</button
          >
        {:else}
          <span></span>
        {/if}
        <div class="flex gap-2">
          <button type="button" class="h-9 rounded-lg border border-line px-3 text-sm font-medium hover:bg-surface-2" onclick={close}>Cancel</button>
          <button type="submit" class="h-9 rounded-lg bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-strong dark:text-black">Save</button>
        </div>
      </div>
    </form>
  {/if}
</dialog>
