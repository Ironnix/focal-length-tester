// @ts-check
import { defineConfig } from "astro/config";
import svelte from "@astrojs/svelte";
import tailwindcss from "@tailwindcss/vite";

// Static site: `bun run build` writes plain HTML/CSS/JS to dist/.
// GitHub Pages serves it under /focal-length-tester/, so the deploy workflow sets BASE_PATH.
export default defineConfig({
  site: process.env.SITE_URL ?? "https://ironnix.github.io",
  base: process.env.BASE_PATH ?? "/",
  // Lets dev/preview answer on zora's tailnet name, not only on localhost and IPs.
  server: {
    allowedHosts: [".taild0e469.ts.net", "zora"],
  },
  integrations: [svelte()],
  vite: {
    plugins: [tailwindcss()],
  },
});
