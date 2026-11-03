# Focal Length Tester

Static web tool: pick a subject, distance, lens and camera; see how large the subject appears in
the frame, what is in focus, and a top-view map. Astro 7 + Svelte 5 (runes) + Tailwind 4 +
TypeScript 6, run with **Bun**. No backend, no database — everything is computed client-side.

## Commands
- `bun run dev` — dev server (port 4321, `--host`)
- `bun test` — unit tests in `tests/` (optics, fitting, share links)
- `bun run check` — `astro check` + `svelte-check` (astro check alone does not type-check `.svelte`)
- `bun run build` — check, then build to `dist/`
- TypeScript stays on 6.x: `@astrojs/check` and `@astrojs/svelte` don't accept TS 7 yet.

## Deploy
GitHub Pages via `.github/workflows/deploy.yml` on every push to `main`
(https://ironnix.github.io/focal-length-tester/). The site lives under a sub-path, so the
workflow sets `BASE_PATH=/focal-length-tester`; public files must be linked through
`import.meta.env.BASE_URL` (see `Base.astro`).

## Code map
- `src/pages/index.astro` → `layouts/Base.astro` (meta, theme-before-paint script) → `components/App.svelte` (`client:only`).
- **State:** `src/lib/store.svelte.ts` — module-level `$state`: `settings` (the shot), `prefs` (units, theme),
  `library.custom` (custom subjects), `ui` (mobile tab, dialog, toast). `live` holds the derived
  `subject`, `model`, `scene`, `coverage`, `fill`. Persisted to localStorage (`flt:settings`,
  `flt:prefs`, `flt:custom`). A shared link (`?f=85&d=12…`, short keys in `settings.ts`) is applied
  once on load and removed from the address bar.
- **Units:** lengths are always metres internally; `units.ts` formats m/ft and converts inputs.
- `src/lib/settings.ts` — `Settings` type, defaults, `sanitize()` (clamps anything loaded), share-link encode/decode.
- `src/lib/optics.ts` — pure thin-lens maths: frame (crop, squeeze, orientation), angle of view,
  DOF, blur disc, magnification, fit-to-frame, pixels, diffraction.
- `src/lib/model.ts` — `compute(settings, subject)` → every number the page shows.
- `src/lib/scene.ts` — builds the viewfinder: world (x right, y up, z away, metres) → pinhole
  camera with focal = lens-to-sensor distance at the focus distance → "image mm" (SVG viewBox).
  Ground lines are split into depth bands so each band gets its own Gaussian blur; painted field
  lines are ground quads (they foreshorten). Background trees/buildings sit on a fixed lattice
  (stable when zooming).
- `src/lib/coverage.ts` — rasterises the subject's paths into a small canvas to measure the
  picture area it covers and how much of it is visible.
- `src/lib/shapes.ts` — hand-drawn silhouettes (point lists in a box with the subject's proportions;
  a point listed twice = sharp corner; `light` parts are windows/hubs). `subjects.ts` — presets with real sizes.
- `src/lib/fields.ts` — football pitch, ice hockey rink, basketball and tennis court to scale; the
  camera stands at z = 0 on the middle of one end line. `presets.ts` — distance presets (some set a field).
- `src/lib/camera.ts` — sensor formats, aspect crops, squeezes, f-stops, chip values.
- Components: `Viewfinder` (+ overlay toggles) → `SceneSvg` (also used by `FocalStrip` thumbnails),
  `TopView` (drag subject/background/focus), `StatTiles`, `Details` (+ fit), `controls/*Panel`,
  `CustomSubjectDialog`, `Header`. Desktop: controls in a sticky sidebar; phone (< 1024 px,
  `MediaQuery`): sticky preview + tabbed panels.

## Conventions
- Look: flat and simple — no gradients, glow or glossy effects (Ralf's preference). Colour tokens
  in `global.css` (`--bg`, `--surface`, `--ink`, `--accent` teal, `--focus` green), dark mode via `.dark`.
- Icons: Lucide, always deep-imported (`@lucide/svelte/icons/<name>`).
- Optics changes need a test in `tests/optics.test.ts`.
- Anamorphic: the frame is in desqueezed "image mm"; DOF follows the vertical (spherical) focal
  length, bokeh is an upright oval (blur ÷ squeeze across).
- "Focus on subject" focuses at the camera-to-subject-centre range (differs from the ground
  distance only with a custom camera height).
