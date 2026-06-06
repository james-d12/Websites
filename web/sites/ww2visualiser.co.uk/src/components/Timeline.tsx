import { useState, useRef, useCallback, useEffect } from "react";

interface Props {
  totalDays: number;
  currentDay: number;
  warStart: Date;
  onChange: (day: number) => void;
}

const YEARS = [1939, 1940, 1941, 1942, 1943, 1944, 1945];

function dayOffset(warStart: Date, year: number) {
  const d = new Date(`${year}-01-01`);
  return Math.max(
    0,
    Math.round((d.getTime() - warStart.getTime()) / 86_400_000),
  );
}

export default function Timeline({
  totalDays,
  currentDay,
  warStart,
  onChange,
}: Props) {
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1); // days per second
  const intervalRef = useRef<number | null>(null);
  const currentDayRef = useRef(currentDay);
  currentDayRef.current = currentDay;

  const currentDate = new Date(warStart.getTime() + currentDay * 86_400_000);
  const dateStr = currentDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const tick = useCallback(() => {
    const next = currentDayRef.current + 1;
    if (next > totalDays) {
      setPlaying(false);
      return;
    }
    onChange(next);
  }, [totalDays, onChange]);

  useEffect(() => {
    if (playing) {
      intervalRef.current = window.setInterval(tick, 1000 / speed);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, speed, tick]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      e.preventDefault();
      setPlaying((p) => !p);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <div className="bg-surface border-t-2 border-rim px-6 pt-3.5 pb-3 shrink-0 select-none">
      {/* Prominent date */}
      <div className="text-center mb-2.5">
        <span
          className="text-[26px] font-bold text-ink tracking-[0.03em] tabular-nums"
          style={{ textShadow: "0 1px 6px rgba(230,57,70,0.25)" }}
        >
          {dateStr}
        </span>
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-3.5">
        {/* Play/Pause */}
        <button
          onClick={() => setPlaying((p) => !p)}
          title={playing ? "Pause (Space)" : "Play (Space)"}
          style={{
            background: playing ? "#e63946" : "#238636",
            boxShadow: playing
              ? "0 0 10px rgba(230,57,70,0.4)"
              : "0 0 10px rgba(35,134,54,0.4)",
          }}
          className="border-none rounded-lg text-white w-11 h-11 text-xl cursor-pointer shrink-0 flex items-center justify-center transition-[background,box-shadow] duration-150"
        >
          {playing ? "⏸" : "▶"}
        </button>

        {/* Track + year labels */}
        <div className="flex-1">
          <input
            type="range"
            min={0}
            max={totalDays}
            value={currentDay}
            onChange={(e) => {
              setPlaying(false);
              onChange(Number(e.target.value));
            }}
            style={{ accentColor: "#e63946" }}
            className="w-full cursor-pointer block h-5"
          />
          <div className="relative h-4 mt-0.5">
            {YEARS.map((y) => {
              const left = (dayOffset(warStart, y) / totalDays) * 100;
              if (left > 100) return null;
              return (
                <span
                  key={y}
                  style={{ left: `${left}%` }}
                  className="absolute -translate-x-1/2 text-[11px] text-faint whitespace-nowrap"
                >
                  {y}
                </span>
              );
            })}
          </div>
        </div>

        {/* Speed */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] text-faint uppercase tracking-[0.05em]">
            Speed
          </span>
          <select
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="bg-deep text-dim border border-rim rounded-md px-2 py-1.5 text-xs cursor-pointer"
          >
            <option value={1}>Slow (1 day/s)</option>
            <option value={7}>Normal (1 wk/s)</option>
            <option value={30}>Fast (1 month/s)</option>
            <option value={90}>Very fast (1 qtr/s)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
