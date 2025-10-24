import React, {useState, useEffect} from "react";

type ImageData = {
    src: string;
    alt: string;
    text?: string;
};

export default function Carousel({images}: { images: ImageData[] }) {
    const [current, setCurrent] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const prevSlide = () =>
        setCurrent((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    const nextSlide = () =>
        setCurrent((prev) => (prev === images.length - 1 ? 0 : prev + 1));

    // 🔒 Prevent background scroll when fullscreen
    useEffect(() => {
        if (isFullscreen) {
            document.body.classList.add("overflow-hidden");
        } else {
            document.body.classList.remove("overflow-hidden");
        }
        return () => document.body.classList.remove("overflow-hidden");
    }, [isFullscreen]);

    return (
        <>
            {/* Normal Carousel */}
            <div className="max-w-6xl mx-auto text-center relative">
                <div className="relative overflow-hidden rounded-2xl shadow-lg h-96">
                    <div
                        className="flex transition-transform duration-700 ease-in-out"
                        style={{transform: `translateX(-${current * 100}%)`}}
                    >
                        {images.map((image, idx) => (
                            <div
                                key={idx}
                                className="w-full flex-shrink-0 relative cursor-pointer"
                                onClick={() => setIsFullscreen(true)}
                            >
                                <img
                                    src={image.src}
                                    alt={image.alt}
                                    className="w-full h-96 object-cover"
                                />
                            </div>
                        ))}
                    </div>

                    {/* Controls */}
                    <button
                        onClick={prevSlide}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-70 hover:bg-opacity-100 rounded-full p-3 shadow-md"
                    >
                        ‹
                    </button>
                    <button
                        onClick={nextSlide}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-70 hover:bg-opacity-100 rounded-full p-3 shadow-md"
                    >
                        ›
                    </button>

                    {/* Dots */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                        {images.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrent(idx)}
                                className={`w-3 h-3 rounded-full ${
                                    current === idx ? "bg-white" : "bg-gray-400"
                                }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Caption */}
                <p className="mt-4 text-lg font-medium text-gray-700">
                    {images[current].text}
                </p>
            </div>

            {/* Fullscreen Lightbox */}
            {isFullscreen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50"
                    onClick={() => setIsFullscreen(false)}
                >
                    <img
                        src={images[current].src}
                        alt={images[current].alt}
                        className="max-w-full max-h-[90vh] object-contain"
                    />
                    <p className="text-white text-xl mt-4">
                        {images[current].text}
                    </p>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsFullscreen(false);
                        }}
                        className="absolute top-6 right-6 text-white text-4xl font-bold"
                    >
                        ✕
                    </button>
                </div>
            )}
        </>
    );
}
