// @ts-check
import {defineConfig, sharpImageService} from "astro/config";
import starlight from "@astrojs/starlight";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
    site: "https://orchitect.net",
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
                    autogenerate: {directory: "docs/guides"},
                },
                {
                    label: "References",
                    autogenerate: {directory: "docs/references"},
                },
            ],
        }),
        sitemap(),
    ],
    image: {
        service: sharpImageService(),
    },
});
