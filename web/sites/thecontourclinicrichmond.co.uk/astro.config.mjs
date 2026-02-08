import { defineConfig, sharpImageService } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import solidJs from "@astrojs/solid-js";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://thecontourclinicrichmond.co.uk",
  vite: {
    plugins: [tailwindcss()],
  },
  image: {
    service: sharpImageService(),
  },
  integrations: [solidJs(), sitemap()],
});
