<script lang="ts">
  // A small scene with its photo backdrop (focal-length thumbnails).
  import type { Scene } from "~/lib/scene";
  import Backdrop from "./Backdrop.svelte";
  import SceneSvg from "./SceneSvg.svelte";

  let { scene }: { scene: Scene } = $props();
  let photo = $state(false);
</script>

<div class="relative h-full w-full">
  <Backdrop {scene} bind:ready={photo} />
  <SceneSvg {scene} {photo} />
</div>
