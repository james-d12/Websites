import { defineConfig, sharpImageService } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  compressHTML: true,
  site: "https://stcatherinesgroup.com",
  server: {
    port: 35424,
  },
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [sitemap()],
  image: {
    service: sharpImageService(),
  },
});
