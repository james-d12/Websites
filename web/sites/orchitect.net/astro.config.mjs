// @ts-check
import { defineConfig, sharpImageService } from "astro/config";
import starlight from "@astrojs/starlight";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  compressHTML: true,
  site: "https://orchitect.net",
  server: {
    port: 35423,
  },
  integrations: [
    starlight({
      title: "Orchitect",
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/james-d12/Orchitect",
        },
      ],
      customCss: ["./src/styles/starlight.css"],
      sidebar: [
        {
          label: "Guides",
          items: [{ autogenerate: { directory: "docs/guides" } }],
        },
        {
          label: "References",
          items: [{ autogenerate: { directory: "docs/references" } }],
        },
      ],
    }),
    sitemap(),
  ],
  image: {
    service: sharpImageService(),
  },
});
