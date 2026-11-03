# Plan: real places (Google Earth–style background)

Status: **plan only**, nothing built yet (2026-11-03).

Goal: pick a real spot for the camera and the subject on a map and see the shot with the real
surroundings — Google's photorealistic 3D where it exists, otherwise at least the real terrain
(mountains, horizon) at the right size and blur.

## What is possible (researched Nov 2026)

**Google Earth itself has no API.** The same 3D data is sold through Google Maps Platform, in two forms:

| | Map Tiles API — Photorealistic 3D Tiles | Maps JavaScript API — 3D Maps (`<gmp-map-3d>`) |
|---|---|---|
| What | raw 3D Tiles for your own renderer (CesiumJS, three.js) | Google's own 3D map view in the page |
| EEA (Austria) | **blocked**: projects with an EEA billing address created after 8 July 2025 get HTTP 403 | allowed — Google's suggested replacement for EEA |
| Camera control | full (any renderer) | `cameraPosition` (lat/lng/alt), heading, tilt, roll, **`fov` 5°–80° vertical** |
| Our subject | any 3D object | glTF models (`Model3DElement`) at a lat/lng/alt, at real size |
| Depth of field | possible with the depth buffer | **no** (no access to the depth buffer) |
| Free per month | 1,000 root-tile requests, then $6 / 1,000 | 5,000 map loads (Pro "Immersive Maps" SKU), then paid |

Photorealistic coverage: 2,500+ cities in 49 countries. Outside them the 3D map is terrain with
satellite imagery (coarser) — still shows mountains; to be checked in a prototype for Carinthia.

Rules that matter: the Google logo and attributions must stay visible, no caching or offline use,
no extracting 3D data, our own overlays must be marked as not Google's. The API key is public in a
static site, so restrict it to the site's domain and set a daily quota so nobody can run up a bill.

**Consequence:** for Ralf (EEA) the only Google route is the 3D Maps view. It gives real framing
(field of view from our focal length and sensor) and a real-size subject, but no blur, and only
14 mm to ~275 mm on full frame (5°–80° vertical); longer lenses would need a digital crop of a 5°
view (less detail).

### Free fallback that works everywhere

- **Terrain:** Austria DGM 10 m (geoland.at, CC BY 3.0 AT, from airborne laser scans); worldwide
  Copernicus DEM GLO-30 (30 m) or the free AWS Terrain Tiles.
- **Aerial imagery:** basemap.at orthophoto for all of Austria (CC BY); worldwide e.g. Sentinel-2
  cloudless (non-commercial licence).
- **Rendering:** either a skyline only (see phase 1) or a three.js terrain mesh with full control:
  exact focal length (`camera.setFocalLength()` with `filmGauge` = sensor width) and real depth of
  field from the depth buffer with our blur-disc formula.

## Proposed steps

1. **Real place + real skyline (free, no Google).** A "Real place" mode: a 2D map (MapLibre with
   OSM or basemap.at tiles, plus place search) where you click the camera spot and the subject spot.
   From that: distance, heading, ground heights from the terrain model (camera = ground + eye
   height). The drawn preview gets the **real mountain ridge** (computed from the terrain for that
   spot and direction) instead of the fake hills — correct size, correct blur, ground drops and
   rises with the real terrain. Fits the current drawn style and works on phones.
2. **Textured 3D terrain (optional).** three.js terrain mesh with aerial imagery and real
   depth-of-field blur — looks like Google Earth outside cities, fully under our control.
3. **Google 3D view.** An extra "Google 3D" picture next to ours, using `<gmp-map-3d>` with the
   field of view from our lens and sensor and the subject as a glTF model. Needs Ralf's Google
   Cloud project with billing (card), an API key limited to the site, and a quota cap to stay in the
   5,000 free loads a month.

## Open questions for Ralf

- Google: OK to create a Google Cloud project with billing for a public key (capped at the free tier)?
- Is the drawn look fine for terrain (phase 1), or are aerial-photo textures needed (phase 2)?
- Only Austria / Carinthia at 10 m, or worldwide at 30 m (or both)?
