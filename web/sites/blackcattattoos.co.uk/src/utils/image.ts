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
    format: "avif",
    ...options,
  });
}

export async function getGalleryImages(
  style?: string,
): Promise<GallerySlide[]> {
  const imageModules = import.meta.glob<{ default: ImageMetadata }>(
    "/src/assets/images/gallery/**/*.{jpg,png,jpeg}",
    { eager: true },
  );

  console.log(style);

  // Convert style to lowercase once for comparison (if provided)
  const styleFilter = style?.toLowerCase();

  const metadata = Object.entries(imageModules)
    .map(([path, m]) => ({
      path,
      src: m.default,
    }))
    .filter(({ path }) => {
      if (!styleFilter) return true; // no style → return all
      return path.toLowerCase().includes(styleFilter); // filter by path match
    });

  const images = await Promise.all(
    metadata.map(({ src }) => getCustomImage({ src })),
  );

  return images.map((img, i) => {
    const path = metadata[i].path;
    const match = path.match(/gallery\/([^/]+)\//i);
    const category = match ? match[1].replace(/[-_]/g, " ") : "Gallery";

    return {
      image: img.src,
      text: category,
      category,
    };
  });
}

export async function getPiercingImages(): Promise<GallerySlide[]> {
  const imageModules = import.meta.glob<{ default: ImageMetadata }>(
    "/src/assets/images/piercing/**/*.{jpg,png,jpeg}",
    { eager: true },
  );

  const metadata = Object.entries(imageModules).map(([path, m]) => ({
    path,
    src: m.default,
  }));

  const images = await Promise.all(
    metadata.map(({ src }) => getCustomImage({ src })),
  );

  return images.map((img, i) => {
    const path = metadata[i].path;
    const match = path.match(/piercing\/([^/]+)\//i);
    const category = match ? match[1].replace(/[-_]/g, " ") : "Piercing";

    return {
      image: img.src,
      text: category,
    };
  });
}
