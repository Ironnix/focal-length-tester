<script lang="ts">
  import Plus from "@lucide/svelte/icons/plus";
  import Pencil from "@lucide/svelte/icons/pencil";
  import { library, live, prefs, settings, ui } from "~/lib/store.svelte";
  import { SUBJECT_GROUPS, type Subject } from "~/lib/subjects";
  import { len } from "~/lib/units";
  import Section from "../ui/Section.svelte";
  import SubjectIcon from "../SubjectIcon.svelte";

  const groups = $derived([
    ...SUBJECT_GROUPS,
    ...(library.custom.length ? [{ name: "Your subjects", subjects: library.custom }] : []),
  ]);

  const s = $derived(live.subject);

  function newSubject(from?: Subject) {
    ui.editing = {
      id: `custom-${Date.now().toString(36)}`,
      name: from ? `My ${from.name.toLowerCase()}` : "",
      width: from?.width ?? 1,
      height: from?.height ?? 1,
      depth: from?.depth ?? 0.5,
      shape: from?.shape ?? "box",
      custom: true,
    };
  }
</script>

<Section title="Subject">
  {#snippet actions()}
    <button
      type="button"
      class="flex h-7 items-center gap-1 rounded-full border border-line px-2.5 text-xs font-medium text-ink-2 hover:border-accent hover:text-accent-ink"
      onclick={() => newSubject()}
    >
      <Plus class="size-3.5" /> Custom size
    </button>
  {/snippet}

  {#each groups as g (g.name)}
    <div>
      <div class="mb-1.5 text-[11px] font-medium tracking-wide text-ink-3 uppercase">{g.name}</div>
      <div class="grid grid-cols-3 gap-1.5 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4">
        {#each g.subjects as sub (sub.id)}
          {@const active = settings.subject === sub.id}
          <button
            type="button"
            class="group relative flex flex-col items-center gap-1 rounded-xl border px-1 pt-2 pb-1.5 transition-colors
              {active ? 'border-accent bg-accent-soft' : 'border-line hover:border-line-strong hover:bg-surface-2'}"
            aria-pressed={active}
            title={sub.note ?? `${len(sub.width, prefs.units)} × ${len(sub.height, prefs.units)}`}
            onclick={() => (settings.subject = sub.id)}
          >
            <SubjectIcon shape={sub.shape} class="h-7 w-12 {active ? 'text-accent-ink' : 'text-ink-2'}" />
            <span class="w-full truncate text-center text-[11px] leading-tight {active ? 'text-accent-ink' : 'text-ink-2'}"
              >{sub.name}</span
            >
          </button>
        {/each}
      </div>
    </div>
  {/each}

  <div class="flex items-center justify-between gap-2 rounded-xl bg-surface-2 px-3 py-2 text-xs">
    <span class="text-ink-2">
      <span class="font-medium text-ink">{s.name}</span>
      · {len(s.width, prefs.units)} wide · {len(s.height, prefs.units)} tall
    </span>
    <button
      type="button"
      class="flex shrink-0 items-center gap-1 font-medium text-accent-ink hover:underline"
      onclick={() => (s.custom ? (ui.editing = { ...s }) : newSubject(s))}
    >
      <Pencil class="size-3" />
      {s.custom ? "Edit" : "Change size"}
    </button>
  </div>
</Section>
