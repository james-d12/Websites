import { createSignal, createEffect, For, Show } from "solid-js";

export type CarouselSlide = {
  before: string;
  after: string;
  beforeText?: string;
  afterText?: string;
  text?: string;
};

export function Carousel(props: { slides: CarouselSlide[] }) {
  const [current, setCurrent] = createSignal(0);
  const [isFullscreen, setIsFullscreen] = createSignal(false);
  const slides = () => props.slides;

  const prevSlide = () =>
    setCurrent((prev) => (prev === 0 ? slides().length - 1 : prev - 1));
  const nextSlide = () =>
    setCurrent((prev) => (prev === slides().length - 1 ? 0 : prev + 1));

  // Prevent background scroll when fullscreen
  createEffect(() => {
    if (isFullscreen()) document.body.classList.add("overflow-hidden");
    else document.body.classList.remove("overflow-hidden");
    return () => document.body.classList.remove("overflow-hidden");
  });

  return (
    <>
      {/* Normal Carousel */}
      <div class="max-w-7xl mx-auto text-center relative">
        <div class="relative overflow-hidden rounded-2xl shadow-lg h-128">
          <div
            class="flex transition-transform duration-700 ease-in-out h-full"
            style={{ transform: `translateX(-${current() * 100}%)` }}
          >
            <For each={slides()}>
              {(slide) => (
                <div
                  class="w-full flex-shrink-0 flex h-full cursor-pointer"
                  onClick={() => setIsFullscreen(true)}
                >
                  <div class="w-1/2 h-full relative">
                    <img
                      src={slide.before}
                      alt="Before"
                      class="w-full h-full object-cover"
                    />
                    <Show when={slide.beforeText}>
                      <div class="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                        {slide.beforeText}
                      </div>
                    </Show>
                  </div>

                  <div class="w-1/2 h-full relative">
                    <img
                      src={slide.after}
                      alt="After"
                      class="w-full h-full object-cover"
                    />
                    <Show when={slide.afterText}>
                      <div class="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                        {slide.afterText}
                      </div>
                    </Show>
                  </div>
                </div>
              )}
            </For>
          </div>

          <button
            onClick={prevSlide}
            class="absolute left-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-70 hover:bg-opacity-100 rounded-full p-3 shadow-md"
          >
            ‹
          </button>
          <button
            onClick={nextSlide}
            class="absolute right-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-70 hover:bg-opacity-100 rounded-full p-3 shadow-md"
          >
            ›
          </button>

          <div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
            <For each={slides()}>
              {(_, idx) => (
                <button
                  onClick={() => setCurrent(idx())}
                  classList={{
                    "w-3 h-3 rounded-full": true,
                    "bg-white": current() === idx(),
                    "bg-gray-400": current() !== idx(),
                  }}
                />
              )}
            </For>
          </div>
        </div>

        {/* Optional overall caption */}
        <Show when={slides()[current()]?.text}>
          <p class="mt-4 text-lg font-medium text-gray-700">
            {slides()[current()].text}
          </p>
        </Show>
      </div>

      <Show when={isFullscreen()}>
        <div class="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50 p-4">
          <div class="flex max-h-[90vh] max-w-full gap-2">
            <div class="relative">
              <img
                src={slides()[current()].before}
                alt="Before"
                class="object-contain max-h-[90vh] w-auto"
              />
              <Show when={slides()[current()].beforeText}>
                <div class="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black bg-opacity-60 text-white px-3 py-1 rounded text-sm">
                  {slides()[current()].beforeText}
                </div>
              </Show>
            </div>
            <div class="relative">
              <img
                src={slides()[current()].after}
                alt="After"
                class="object-contain max-h-[90vh] w-auto"
              />
              <Show when={slides()[current()].afterText}>
                <div class="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black bg-opacity-60 text-white px-3 py-1 rounded text-sm">
                  {slides()[current()].afterText}
                </div>
              </Show>
            </div>
          </div>

          <Show when={slides()[current()].text}>
            <p class="text-white text-xl mt-4">{slides()[current()].text}</p>
          </Show>

          <button
            onClick={prevSlide}
            class="absolute left-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-70 hover:bg-opacity-100 rounded-full p-3 shadow-md"
          >
            ‹
          </button>
          <button
            onClick={nextSlide}
            class="absolute right-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-70 hover:bg-opacity-100 rounded-full p-3 shadow-md"
          >
            ›
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsFullscreen(false);
            }}
            class="absolute top-6 right-6 text-white text-4xl font-bold"
          >
            ✕
          </button>
        </div>
      </Show>
    </>
  );
}
