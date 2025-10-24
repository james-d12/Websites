import React, { useState, useEffect } from "react";

type SlideData = {
    before: string;
    after: string;
    beforeText?: string;
    afterText?: string;
    text?: string; // optional overall caption
};

export default function Carousel({ slides }: { slides: SlideData[] }) {
    const [current, setCurrent] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const prevSlide = () =>
        setCurrent((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
    const nextSlide = () =>
        setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1));

    // Prevent background scroll when fullscreen
    useEffect(() => {
        if (isFullscreen) document.body.classList.add("overflow-hidden");
        else document.body.classList.remove("overflow-hidden");
        return () => document.body.classList.remove("overflow-hidden");
    }, [isFullscreen]);

    return (
        <>
            {/* Normal Carousel */}
            <div className="max-w-6xl mx-auto text-center relative">
                <div className="relative overflow-hidden rounded-2xl shadow-lg h-96">
                    <div
                        className="flex transition-transform duration-700 ease-in-out h-full"
                        style={{ transform: `translateX(-${current * 100}%)` }}
                    >
                        {slides.map((slide, idx) => (
                            <div
                                key={idx}
                                className="w-full flex-shrink-0 flex h-full cursor-pointer"
                                onClick={() => setIsFullscreen(true)}
                            >
                                {/* Before Image */}
                                <div className="w-1/2 h-full relative">
                                    <img
                                        src={slide.before}
                                        alt="Before"
                                        className="w-full h-full object-cover"
                                    />
                                    {slide.beforeText && (
                                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                                            {slide.beforeText}
                                        </div>
                                    )}
                                </div>

                                {/* After Image */}
                                <div className="w-1/2 h-full relative">
                                    <img
                                        src={slide.after}
                                        alt="After"
                                        className="w-full h-full object-cover"
                                    />
                                    {slide.afterText && (
                                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                                            {slide.afterText}
                                        </div>
                                    )}
                                </div>
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
                        {slides.map((_, idx) => (
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

                {/* Optional overall caption */}
                {slides[current].text && (
                    <p className="mt-4 text-lg font-medium text-gray-700">
                        {slides[current].text}
                    </p>
                )}
            </div>

            {/* Fullscreen Lightbox */}
            {isFullscreen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50 p-4"
                    onClick={() => setIsFullscreen(false)}
                >
                    <div className="flex max-h-[90vh] max-w-full gap-2">
                        <div className="relative">
                            <img
                                src={slides[current].before}
                                alt="Before"
                                className="object-contain max-h-[90vh] w-auto"
                            />
                            {slides[current].beforeText && (
                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black bg-opacity-60 text-white px-3 py-1 rounded text-sm">
                                    {slides[current].beforeText}
                                </div>
                            )}
                        </div>
                        <div className="relative">
                            <img
                                src={slides[current].after}
                                alt="After"
                                className="object-contain max-h-[90vh] w-auto"
                            />
                            {slides[current].afterText && (
                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black bg-opacity-60 text-white px-3 py-1 rounded text-sm">
                                    {slides[current].afterText}
                                </div>
                            )}
                        </div>
                    </div>

                    {slides[current].text && (
                        <p className="text-white text-xl mt-4">{slides[current].text}</p>
                    )}

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
