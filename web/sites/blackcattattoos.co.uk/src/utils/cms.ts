import directus from "./directus";
import { readItems } from "@directus/sdk";
import { getImage } from "astro:assets";
import type { GallerySlide } from "../components/solid-js/GalleryGrid.tsx";
import { promiseAllWithLimit } from "./helpers";

const useCms = import.meta.env.ENABLE_CMS === "true";

const PLACEHOLDER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect width='400' height='400' fill='%23262626'/%3E%3C/svg%3E";

const imageCache = new Map<string, string>();

async function getOptimizedImage(imageId: string): Promise<string> {
  if (imageCache.has(imageId)) {
    console.log(`[Cache HIT] ${imageId}`);
    return imageCache.get(imageId)!;
  }

  console.log(`[Cache MISS] ${imageId}`);
  const imageUrl = `${import.meta.env.DIRECTUS_URL}/assets/${imageId}`;
  const optimizedImage = await getImage({
    src: imageUrl,
    format: "webp",
    inferSize: true,
  });

  imageCache.set(imageId, optimizedImage.src);
  return optimizedImage.src;
}

export async function getTattoosAsync(): Promise<GallerySlide[]> {
  if (!useCms) {
    return [
      {
        text: "Placeholder",
        category: "Placeholder",
        caption: "Placeholder Tattoo",
        image: PLACEHOLDER_IMAGE,
      },
    ];
  }

  const tattoos = await directus.request(
    readItems("Tattoos", {
      limit: 500,
      fields: ["Title", "Style", "Image"],
      sort: ["Title"],
    }),
  );

  return await promiseAllWithLimit(tattoos, async (tattoo) => ({
    text: tattoo.Style,
    category: tattoo.Style,
    caption: tattoo.Title,
    image: await getOptimizedImage(tattoo.Image),
  }));
}

export async function getTattooStylesAsync(): Promise<
  { Style: string; Image: string }[]
> {
  if (!useCms) {
    return [{ Style: "Placeholder", Image: PLACEHOLDER_IMAGE }];
  }

  const tattooStyles = await directus.request(
    readItems("TattooStyles", {
      limit: 500,
      fields: ["Style", "Image"],
      sort: ["Style"],
    }),
  );

  return await promiseAllWithLimit(tattooStyles, async (tattooStyle) => ({
    Style: tattooStyle.Style,
    Image: await getOptimizedImage(tattooStyle.Image),
  }));
}

export async function getPiercingsAsync(): Promise<GallerySlide[]> {
  if (!useCms) {
    return [
      {
        text: "Placeholder",
        category: "Placeholder",
        caption: "Placeholder Piercing",
        image: PLACEHOLDER_IMAGE,
      },
    ];
  }

  const piercings = await directus.request(
    readItems("Piercings", {
      limit: 500,
      fields: ["Title", "Style", "Image"],
      sort: ["Title"],
    }),
  );

  return await promiseAllWithLimit(piercings, async (piercing) => ({
    text: piercing.Title,
    category: piercing.Style,
    caption: piercing.Title,
    image: await getOptimizedImage(piercing.Image),
  }));
}

export async function getShopImagesAsync(): Promise<GallerySlide[]> {
  if (!useCms) {
    return [
      {
        text: "Placeholder",
        caption: "Placeholder Shop",
        image: PLACEHOLDER_IMAGE,
      },
    ];
  }

  const shopImages = await directus.request(
    readItems("Shop", {
      limit: 500,
      fields: ["Title", "Image"],
      sort: ["Title"],
    }),
  );

  return await promiseAllWithLimit(shopImages, async (shopImage) => ({
    text: shopImage.Title,
    caption: shopImage.Title,
    image: await getOptimizedImage(shopImage.Image),
  }));
}
