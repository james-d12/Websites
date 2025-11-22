import type {GallerySlide} from "../components/solid-js/GalleryGrid";
import {getImage} from "astro:assets";

export async function getGalleryImages(): Promise<GallerySlide[]> {
    const galleryImages = import.meta.glob(
        "/src/assets/images/gallery/**/*.{jpg,png,jpeg}",
        {eager: true, query: "?url", import: "default"}
    );

    const optimizedImages: GallerySlide[] = [];

    for (const [path, url] of Object.entries(galleryImages)) {
        const urlAsString = url as string;
        const match = path.match(/gallery\/([^/]+)\//i);
        const text = match ? match[1].replace(/[-_]/g, " ") : "Gallery Image";

        const imagePath = urlAsString.replace(/^.*\/public\//, "/");

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

    shuffle(optimizedImages);
    return optimizedImages;
}

export async function getPiercingImages(): Promise<GallerySlide[]> {
    const galleryImages = import.meta.glob(
        "/src/assets/images/piercing/**/*.{jpg,png,jpeg}",
        {eager: true, query: "?url", import: "default"}
    );

    const optimizedImages: GallerySlide[] = [];

    for (const [path, url] of Object.entries(galleryImages)) {
        const urlAsString = url as string;
        const match = path.match(/piercing\/([^/]+)\//i);
        const text = match ? match[1].replace(/[-_]/g, " ") : "";

        const imagePath = urlAsString.replace(/^.*\/public\//, "/");

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

    shuffle(optimizedImages);
    return optimizedImages;
}

function shuffle(array: GallerySlide[]) {
    let currentIndex = array.length;

    while (currentIndex != 0) {

        let randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }
}