import { defineConfig, sharpImageService } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import solidJs from "@astrojs/solid-js";

import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://blackcattattoos.co.uk",
  server: {
    port: 35422,
  },
  vite: {
    plugins: [tailwindcss()],
  },
  image: {
    domains: import.meta.env.DIRECTUS_URL,
    remotePatterns: [{ protocol: "https" }],
    service: sharpImageService(),
  },
  integrations: [solidJs(), sitemap()],
});
