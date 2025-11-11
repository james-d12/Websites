import {defineConfig, passthroughImageService} from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import solidJs from "@astrojs/solid-js";

import sitemap from "@astrojs/sitemap";

export default defineConfig({
    vite: {
        plugins: [tailwindcss()],
    },
    site: 'https://blackcattattoos.co.uk',
    image: {
        service: passthroughImageService(),
    },

    integrations: [
        solidJs(),
        sitemap()
    ],
});