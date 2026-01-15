import directus from "./directus";
import { readItems } from "@directus/sdk";
import { getImage } from "astro:assets";
import type { GallerySlide } from "../components/solid-js/GalleryGrid.tsx";

async function getOptimizedImage(imageId: string): Promise<string> {
  const imageUrl = `${import.meta.env.DIRECTUS_URL}/assets/${imageId}`;

  const optimizedImage = await getImage({
    src: imageUrl,
    format: "avif",
    inferSize: true,
  });

  return optimizedImage.src;
}

export async function getTattoosAsync(): Promise<GallerySlide[]> {
  const cmsTattoos = await directus.request(
    readItems("Tattoos", {
      fields: ["Title", "Style", "Image", "Caption"],
      sort: ["Title"],
    }),
  );

  return await Promise.all(
    cmsTattoos.map(async (tattoo) => ({
      text: tattoo.Style,
      category: tattoo.Style,
      image: await getOptimizedImage(tattoo.Image),
    })),
  );
}

export async function getTattoosByStyleAsync(
  style: string,
): Promise<GallerySlide[]> {
  const cmsTattoos = await directus.request(
    readItems("Tattoos", {
      filter: {
        Style: {
          _eq: style,
        },
      },
      fields: ["Title", "Style", "Image", "Caption"],
      sort: ["Title"],
    }),
  );

  return await Promise.all(
    cmsTattoos.map(async (tattoo) => ({
      text: tattoo.Title,
      category: tattoo.Style,
      image: await getOptimizedImage(tattoo.Image),
    })),
  );
}

export async function getTattooStylesAsync(): Promise<
  { Style: string; Image: string }[]
> {
  const tattooStyles = await directus.request(
    readItems("TattooStyles", {
      fields: ["Style", "Image"],
      sort: ["Style"],
    }),
  );

  return await Promise.all(
    tattooStyles.map(async (tattooStyle) => ({
      Style: tattooStyle.Style,
      Image: await getOptimizedImage(tattooStyle.Image),
    })),
  );
}

export async function getPiercingsAsync(): Promise<GallerySlide[]> {
  const piercings = await directus.request(
    readItems("Piercings", {
      fields: ["Title", "Style", "Image"],
      sort: ["Title"],
    }),
  );

  return await Promise.all(
    piercings.map(async (piercing) => ({
      title: piercing.Title,
      style: piercing.Style,
      category: piercing.Style,
      image: await getOptimizedImage(piercing.Image),
    })),
  );
}
