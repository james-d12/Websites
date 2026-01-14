import { defineConfig, sharpImageService } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import solidJs from "@astrojs/solid-js";

import sitemap from "@astrojs/sitemap";

export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
  site: "https://blackcattattoos.co.uk",
  image: {
    domains: import.meta.env.DIRECTUS_URL,
    remotePatterns: [{ protocol: "https" }],
    service: sharpImageService(),
  },

  integrations: [solidJs(), sitemap()],
});
