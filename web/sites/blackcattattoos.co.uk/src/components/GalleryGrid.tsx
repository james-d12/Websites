import { createSignal, For, Show } from "solid-js";

export type GallerySlide = {
  image: string;
  text: string;
  category?: string;
};

export function GalleryGrid(props: { slides: GallerySlide[] }) {
  const [isFullscreen, setIsFullscreen] = createSignal(false);
  const [current, setCurrent] = createSignal(0);

  const prevSlide = () =>
    setCurrent((prev) => (prev === 0 ? props.slides.length - 1 : prev - 1));
  const nextSlide = () =>
    setCurrent((prev) => (prev === props.slides.length - 1 ? 0 : prev + 1));

  const uniqueCategories =
    Array.from(
      new Set(props.slides.map((slide) => slide.category ?? "Uncategorized")),
    ) ?? [];

  return (
    <>
      <div class="items-center justify-center text-center p-4 gap-2 flex flex-wrap">
        <For each={uniqueCategories}>
          {(category) => (
            <button class="mt-4 inline-block bg-red text-white font-bold px-6 py-4 text-lg rounded-full shadow-2xl hover:bg-red-950 transition">
              {category}
            </button>
          )}
        </For>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-2">
        <For each={props.slides}>
          {(slide, idx) => (
            <div
              class="relative cursor-pointer"
              onClick={() => {
                setCurrent(idx());
                setIsFullscreen(true);
              }}
            >
              <img
                src={slide.image}
                alt="Gallery image"
                class="object-cover w-full h-96 rounded-lg"
              />
              <Show when={slide.text}>
                <div class="absolute bottom-1 left-1/2 -translate-x-1/2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-sm">
                  {slide.text}
                </div>
              </Show>
            </div>
          )}
        </For>
      </div>

      <Show when={isFullscreen()}>
        <div
          class="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setIsFullscreen(false)}
        >
          <div
            class="relative max-h-[90vh] max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={props.slides[current()].image}
              alt="Fullscreen image"
              class="object-contain max-h-[90vh] w-auto rounded-lg"
            />
            <Show when={props.slides[current()].text}>
              <div class="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black bg-opacity-60 text-white px-3 py-1 rounded text-sm">
                {props.slides[current()].text}
              </div>
            </Show>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              prevSlide();
            }}
            class="absolute left-4 top-1/2 -translate-y-1/2 p-3"
          >
            <img src="/images/PrevArrow.svg" alt="Previous" class="w-28 h-28" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              nextSlide();
            }}
            class="absolute right-4 top-1/2 -translate-y-1/2 p-3"
          >
            <img src="/images/NextArrow.svg" alt="Next" class="w-28 h-28" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsFullscreen(false);
            }}
            class="absolute top-6 right-6 text-white hover:text-red transition-colors w-28 h-28"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              class="w-full h-full"
            >
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M18.3 5.71a1 1 0 0 0-1.41 0L12 10.59 7.11 5.7A1 1 0 0 0 5.7 7.11L10.59 12l-4.89 4.89a1 1 0 1 0 1.41 1.41L12 13.41l4.89 4.89a1 1 0 0 0 1.41-1.41L13.41 12l4.89-4.89a1 1 0 0 0 0-1.4z"
              />
            </svg>
          </button>
        </div>
      </Show>
    </>
  );
}
