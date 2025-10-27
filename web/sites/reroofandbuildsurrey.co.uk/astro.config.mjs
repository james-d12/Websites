import {defineConfig, passthroughImageService} from "astro/config";

import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
    vite: {
        plugins: [tailwindcss()],
    },
    image: {
        service: passthroughImageService(),
    },
});
