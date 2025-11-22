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
    const [dropdownOpen, setDropdownOpen] = createSignal(false);

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
        const params = new URLSearchParams(window.location.search);
        const styleParam = params.get("style")?.toString().toLowerCase() ?? "";

        const isStyleInCategories = uniqueCategories.includes(styleParam ?? "");

        if (styleParam !== "" && isStyleInCategories) {
            setSelectedCategory(styleParam)
        }

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
        new Set(props.slides.filter(s => s.category !== "").map((slide) => slide.category ?? "Uncategorized"))
    ).sort() as string[];

    return (
        <>
            {/* Category buttons */}
            <div class="flex justify-center pb-10 relative">
                <div class="w-3/4 relative md:w-1/2 lg:w-1/3">
                    <button
                        class="text-2xl w-full bg-black text-white rounded-full px-6 py-3 text-center shadow-md flex justify-between items-center"
                        onClick={() => setDropdownOpen(prev => !prev)}
                    >
                        {selectedCategory() ?? "All"}
                        <svg class="w-5 h-5 ml-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                        </svg>
                    </button>

                    <Show when={dropdownOpen()}>
                        <ul class="text-xl absolute z-50 mt-1 w-full bg-black rounded-xl shadow-lg max-h-60 overflow-y-auto">
                            <li
                                class={`px-4 py-3 cursor-pointer hover:bg-red transition ${
                                    selectedCategory() === null ? "bg-red text-white" : "text-white"
                                }`}
                                onClick={() => {
                                    setSelectedCategory(null);
                                    setDropdownOpen(false);
                                }}
                            >
                                All
                            </li>
                            <For each={uniqueCategories}>
                                {(category) => (
                                    <li
                                        class={`px-4 py-3 cursor-pointer hover:bg-red transition ${
                                            selectedCategory() === category ? "bg-red text-white" : "text-white"
                                        }`}
                                        onClick={() => {
                                            setSelectedCategory(category);
                                            setDropdownOpen(false);
                                        }}
                                    >
                                        {category}
                                    </li>
                                )}
                            </For>
                        </ul>
                    </Show>
                </div>
            </div>


            {/* Gallery */}
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
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
                                class="w-full h-96 object-cover rounded transition-transform duration-300 transform hover:scale-105"
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
                    class="fixed inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-50 p-4"
                    onClick={() => setIsFullscreen(false)}
                >
                    {/* Image container */}
                    <div
                        class="relative max-h-[70vh] max-w-[90vw] flex justify-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={filteredSlides()[current()].image}
                            alt="Fullscreen image"
                            class="object-contain max-h-[70vh] w-auto rounded-lg"
                        />
                        <Show when={filteredSlides()[current()].text != ""}>
                            <div
                                class="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black bg-opacity-60 text-white px-3 py-1 rounded text-sm">
                                {filteredSlides()[current()].text}
                            </div>
                        </Show>
                    </div>

                    {/* Navigation controls */}
                    <div
                        class="flex justify-between w-full max-w-[90vw] mt-4 md:absolute md:top-1/2 md:left-0 md:right-0 md:mt-0 md:justify-between md:px-4">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                prevSlide();
                            }}
                            class="p-3"
                        >
                            <img src="/images/PrevArrow.svg" alt="Previous" class="w-16 h-16 md:w-28 md:h-28"/>
                        </button>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                nextSlide();
                            }}
                            class="p-3"
                        >
                            <img src="/images/NextArrow.svg" alt="Next" class="w-16 h-16 md:w-28 md:h-28"/>
                        </button>
                    </div>

                    {/* Close button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsFullscreen(false);
                        }}
                        class="absolute top-6 right-6 text-white hover:text-red transition-colors w-12 h-12 md:w-28 md:h-28"
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
