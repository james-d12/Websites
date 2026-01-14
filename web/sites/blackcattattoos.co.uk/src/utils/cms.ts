import directus from "./directus";
import { readItems } from "@directus/sdk";
import type { GallerySlide } from "../components/solid-js/GalleryGrid.tsx";

export async function getTattoosAsync(): Promise<GallerySlide[]> {
  const cmsTattoos = await directus.request(
    readItems("Tattoos", {
      fields: ["Title", "Style", "Image", "Caption"],
      sort: ["Title"],
    }),
  );

  return cmsTattoos.map((tattoo) => ({
    text: tattoo.Title,
    category: tattoo.Style,
    image: getTattooImageUrl(tattoo.Image),
  }));
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

  return cmsTattoos.map((tattoo) => ({
    text: tattoo.Title,
    category: tattoo.Style,
    image: getTattooImageUrl(tattoo.Image),
  }));
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

  return tattooStyles.map((tattooStyles) => ({
    Style: tattooStyles.Style,
    Image: getTattooImageUrl(tattooStyles.Image),
  }));
}

export async function getPiercingsAsync(): Promise<GallerySlide[]> {
  const piercings = await directus.request(
    readItems("Piercings", {
      fields: ["Title", "Style", "Image"],
      sort: ["Title"],
    }),
  );

  piercings.map((p) => console.log(p.Image));

  return piercings.map((piercing) => ({
    title: piercing.Title,
    style: piercing.Style,
    category: piercing.Style,
    image: getTattooImageUrl(piercing.Image),
  }));
}

export function getTattooImageUrl(image: string): string {
  return `${import.meta.env.DIRECTUS_URL}/assets/${image}?format=avif`;
}
