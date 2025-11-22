import type { GallerySlide } from "../components/GalleryGrid.tsx";

export function getGalleryImages(): GallerySlide[] {
  const galleryImages = import.meta.glob(
    "/public/images/Gallery/**/*.{jpg,png,jpeg}",
    { eager: true, as: "url" },
  );

  return Object.entries(galleryImages).map(([path, url]) => {
    const match = path.match(/Gallery\/([^/]+)\//i);
    const text = match ? match[1].replace(/[-_]/g, " ") : "Gallery Image";

    const imagePath = url.replace(/^.*\/public\//, "/");
    return { image: imagePath, text, category: text };
  });
}
