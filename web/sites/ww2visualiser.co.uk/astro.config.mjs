// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  compressHTML: true,
  integrations: [react()],
  server: {
    port: 35426,
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
