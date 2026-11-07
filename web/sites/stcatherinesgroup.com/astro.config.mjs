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
  integrations: [
    // /christmas is a link-only card page, so keep it out of the sitemap.
    sitemap({ filter: (page) => !page.includes("/christmas") }),
  ],
  image: {
    service: sharpImageService(),
  },
});
