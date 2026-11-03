# Focal Length Tester

How big does a person, cat, car or plane look in the frame — at this distance, with this
lens, on this sensor? And what is in focus?

**Live:** https://ironnix.github.io/focal-length-tester/

- **Subject:** people, animals, vehicles, a house — or your own size (saved in the browser).
- **Distance:** slider, typed value or presets (portrait, room, street, tennis and basketball
  court, ice hockey rink, football pitch, air show, 1 km). Sports presets draw the field to scale.
- **Lens:** focal length 4–2000 mm, aperture f/0.95–f/64, focus on the subject or anywhere else
  (with a hyperfocal shortcut).
- **Camera:** full frame, APS-C, MFT, 1", phone, medium format and cine formats (Super 35,
  Super 16, LF) or a custom size; landscape/portrait; crops from 1:1 to 2.76:1; anamorphic
  squeeze 1.25×–2×; resolution.
- **Preview:** a drawn scene in perspective with per-depth blur (depth of field), the in-focus zone
  on the ground, distance labels, rule of thirds and smaller-sensor frame lines.
- **Top view:** camera, field of view, in-focus zone, subject and background to scale; drag
  the subject or the background to change distances.
- **Numbers:** subject share of the frame (height, width, area), frame size at the subject, angles
  of view, near/far limits, hyperfocal distance, blur in pixels, pixels on the subject,
  diffraction, full-frame equivalents — and "fit the subject" (which focal length or distance).
- Metric or imperial, light or dark, shareable links that open the exact setup.

No backend: everything is computed in the browser; settings live in `localStorage`.

## Stack

Astro 7 + Svelte 5 + Tailwind CSS 4 + TypeScript, run with [Bun](https://bun.sh) — the same
stack as Unbroken, as a static site.

```sh
bun install
bun run dev       # http://localhost:4321
bun test          # optics unit tests
bun run build     # type check (astro check + svelte-check) and build to dist/
bun run preview
```

Pushing to `main` deploys to GitHub Pages (`.github/workflows/deploy.yml`). To host it
somewhere else, build with `BASE_PATH` (default `/`) and `SITE_URL` set for that place and
serve `dist/` as static files.

## How the maths works

See [`CLAUDE.md`](CLAUDE.md) for the code map. In short: thin-lens optics in `src/lib/optics.ts`,
everything shown on the page computed in one pass in `src/lib/model.ts`, the preview is a
pinhole projection (`src/lib/scene.ts`) with the lens-to-sensor distance at the focus distance,
so close-up framing includes focus breathing. Depth of field uses the circle of confusion
(sensor diagonal ÷ 1442 by default, 0.030 mm on full frame).
