import {createSignal, For, Show, createMemo, onMount} from "solid-js";

export type GallerySlide = {
    image: string;
    text?: string;
    category?: string;
};

export function GalleryGrid(props: { slides: GallerySlide[] }) {
    const [isFullscreen, setIsFullscreen] = createSignal(false);
    const [current, setCurrent] = createSignal(0);
    const [selectedCategory, setSelectedCategory] = createSignal<string | null>(null);

    const [visibleCount, setVisibleCount] = createSignal(6);

    const filteredSlides = createMemo(() =>
        props.slides.filter(
            (slide) =>
                !selectedCategory() || (slide.category ?? "Uncategorized") === selectedCategory()
        )
    );

    const visibleSlides = createMemo(() =>
        filteredSlides().slice(0, visibleCount())
    );

    const loadMore = () => {
        if (visibleCount() < filteredSlides().length) {
            setVisibleCount((prev) => Math.min(prev + 6, filteredSlides().length));
        }
    };

    onMount(() => {
        const onScroll = () => {
            const scrollPosition = window.scrollY + window.innerHeight;
            const bottomPosition = document.documentElement.scrollHeight;

            if (scrollPosition + 300 >= bottomPosition) {
                loadMore();
            }
        };

        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    });

    const prevSlide = () =>
        setCurrent((prev) => (prev === 0 ? filteredSlides().length - 1 : prev - 1));
    const nextSlide = () =>
        setCurrent((prev) => (prev === filteredSlides().length - 1 ? 0 : prev + 1));

    const uniqueCategories = Array.from(
        new Set(props.slides.map((slide) => slide.category ?? "Uncategorized"))
    );

    return (
        <>
            {/* Category buttons */}
            <div class="items-center justify-center text-center p-4 gap-2 flex flex-wrap">
                <button
                    class={`mt-4 inline-block font-bold px-6 py-4 text-lg rounded-full shadow-2xl transition ${
                        selectedCategory() === null ? "bg-red text-white" : "bg-gray-500 text-white"
                    }`}
                    onClick={() => setSelectedCategory(null)}
                >
                    All
                </button>
                <For each={uniqueCategories}>
                    {(category) => (
                        <button
                            class={`mt-4 inline-block font-bold px-6 py-4 text-lg rounded-full shadow-2xl transition ${
                                selectedCategory() === category ? "bg-red text-white" : "bg-gray-500 text-white"
                            }`}
                            onClick={() => setSelectedCategory(category)}
                        >
                            {category}
                        </button>
                    )}
                </For>
            </div>

            {/* Gallery */}
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-2">
                <For each={visibleSlides()}>
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
                                loading="lazy"
                                class="object-cover w-full h-96 rounded-lg"
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

            {/* Fullscreen modal */}
            <Show when={isFullscreen()}>
                <div
                    class="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
                    onClick={() => setIsFullscreen(false)}
                >
                    <div class="relative max-h-[90vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
                        <img
                            src={filteredSlides()[current()].image}
                            alt="Fullscreen image"
                            class="object-contain max-h-[90vh] w-auto rounded-lg"
                        />
                        <Show when={filteredSlides()[current()].text}>
                            <div
                                class="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black bg-opacity-60 text-white px-3 py-1 rounded text-2xl">
                                {filteredSlides()[current()].text}
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
                        <img src="/images/PrevArrow.svg" alt="Previous" class="w-28 h-28"/>
                    </button>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            nextSlide();
                        }}
                        class="absolute right-4 top-1/2 -translate-y-1/2 p-3"
                    >
                        <img src="/images/NextArrow.svg" alt="Next" class="w-28 h-28"/>
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
