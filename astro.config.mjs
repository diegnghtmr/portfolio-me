import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export default defineConfig({
  site: "https://diegnghtmr.me",
  output: "static",
  trailingSlash: "always",
  // ~9 KB of gzipped CSS: inlining it removes the render-blocking stylesheet requests.
  build: { inlineStylesheets: "always" },
  i18n: {
    defaultLocale: "en",
    locales: ["en", "es"],
    routing: { prefixDefaultLocale: true, redirectToDefaultLocale: false },
  },
  vite: { plugins: [tailwindcss()] },
  // The /mcp function bundles a snapshot of the pages Astro just wrote, wherever --outDir put them.
  integrations: [{ name: "mcp-snapshot", hooks: { "astro:build:done": ({ dir }) => execFileSync(process.execPath, [fileURLToPath(new URL("./scripts/build-mcp-data.mjs", import.meta.url)), fileURLToPath(dir)], { stdio: "inherit" }) } }],
});
