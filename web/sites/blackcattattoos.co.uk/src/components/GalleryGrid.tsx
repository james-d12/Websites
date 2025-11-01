import {createSignal, For, Show} from "solid-js";

export type GallerySlide = {
    image: string;
    text?: string;
};

export function GalleryGrid(props: { slides: GallerySlide[] }) {
    const [isFullscreen, setIsFullscreen] = createSignal(false);
    const [current, setCurrent] = createSignal(0);

    const prevSlide = () =>
        setCurrent((prev) => (prev === 0 ? props.slides.length - 1 : prev - 1));
    const nextSlide = () =>
        setCurrent((prev) => (prev === props.slides.length - 1 ? 0 : prev + 1));

    return (
        <>
            {/* Grid view */}
            <div class="flex flex-wrap justify-center items-start gap-2">
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
                                class="object-contain max-h-60 w-auto"
                            />
                            <Show when={slide.text}>
                                <div
                                    class="absolute bottom-1 left-1/2 -translate-x-1/2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-sm">
                                    {slide.text}
                                </div>
                            </Show>
                        </div>
                    )}
                </For>
            </div>

            {/* Fullscreen overlay */}
            <Show when={isFullscreen()}>
                <div
                    class="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
                    onClick={() => setIsFullscreen(false)}
                >
                    <div class="relative max-h-[90vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
                        <img
                            src={props.slides[current()].image}
                            alt="Fullscreen image"
                            class="object-contain max-h-[90vh] w-auto"
                        />
                        <Show when={props.slides[current()].text}>
                            <div
                                class="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black bg-opacity-60 text-white px-3 py-1 rounded text-sm">
                                {props.slides[current()].text}
                            </div>
                        </Show>
                    </div>

                    {/* Navigation buttons */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            prevSlide();
                        }}
                        class="absolute left-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-70 hover:bg-opacity-100 rounded-full p-3 shadow-md"
                    >
                        ‹
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            nextSlide();
                        }}
                        class="absolute right-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-70 hover:bg-opacity-100 rounded-full p-3 shadow-md"
                    >
                        ›
                    </button>

                    {/* Close button */}
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
