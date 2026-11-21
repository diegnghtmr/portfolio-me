import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

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
});
