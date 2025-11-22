import type {GallerySlide} from "../components/solid-js/GalleryGrid";
import {getImage} from "astro:assets";

export async function getGalleryImages(): Promise<GallerySlide[]> {
    const galleryImages = import.meta.glob(
        "/src/assets/images/Gallery/**/*.{jpg,png,jpeg}",
        {eager: true, as: "url"}
    );

    const optimizedImages: GallerySlide[] = [];

    for (const [path, url] of Object.entries(galleryImages)) {
        const match = path.match(/Gallery\/([^/]+)\//i);
        const text = match ? match[1].replace(/[-_]/g, " ") : "Gallery Image";

        const imagePath = url.replace(/^.*\/public\//, "/");

        const optimized = await getImage({
            src: imagePath,
            format: "webp",
            width: 600,
            height: 800
        });

        optimizedImages.push({
            image: optimized.src,
            text,
            category: text
        });
    }

    return optimizedImages;
}
