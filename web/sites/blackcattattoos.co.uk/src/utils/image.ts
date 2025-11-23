import type {
  GetImageResult,
  ImageMetadata,
  UnresolvedImageTransform,
} from "astro";
import { getImage } from "astro:assets";
import type { GallerySlide } from "../components/solid-js/GalleryGrid.tsx";

async function getCustomImage(
  options: UnresolvedImageTransform,
): Promise<GetImageResult> {
  return getImage({
    format: "webp",
    ...options,
  });
}

export async function getGalleryImages(): Promise<GallerySlide[]> {
  const imageModules = import.meta.glob<{ default: ImageMetadata }>(
    "/src/assets/images/gallery/**/*.{jpg,png,jpeg}",
    { eager: true },
  );

  const metadata = Object.values(imageModules).map((m) => m.default);

  const images = await Promise.all(
    metadata.map((src) => getCustomImage({ src })),
  );

  return images.map((img, i) => ({
    image: img.src,
    text: `Gallery Image ${i + 1}`,
  }));
}

export async function getPiercingImages(): Promise<GallerySlide[]> {
  const imageModules = import.meta.glob<{ default: ImageMetadata }>(
    "/src/assets/images/piercing/**/*.{jpg,png,jpeg}",
    { eager: true },
  );

  const metadata = Object.values(imageModules).map((m) => m.default);

  const images = await Promise.all(
    metadata.map((src) => getCustomImage({ src })),
  );

  return images.map((img, i) => ({
    image: img.src,
    text: `Piercing Image ${i + 1}`,
  }));
}
