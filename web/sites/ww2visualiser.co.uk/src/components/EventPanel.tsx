import type { WW2Event, EventCategory, Country } from "../types/events";
import { COUNTRY_COLORS, COUNTRY_FLAGS, COUNTRY_LABELS } from "../types/events";
import { divisionsForEvent } from "../lib/divisionLinks";

interface Props {
  event: WW2Event;
  flags: Record<string, string>;
  onClose: () => void;
}

function SideFlag({
  country,
  flags,
}: {
  country: Country;
  flags: Record<string, string>;
}) {
  const img = flags[country];
  return (
    <div className="flex flex-col items-center gap-1 w-20">
      <div
        className="w-full h-12 rounded border border-rim overflow-hidden flex items-center justify-center"
        style={{ background: img ? "transparent" : COUNTRY_COLORS[country] }}
      >
        {img ? (
          <img
            src={img}
            alt={COUNTRY_LABELS[country]}
            className="w-full h-full object-contain"
          />
        ) : (
          <span className="text-2xl">{COUNTRY_FLAGS[country]}</span>
        )}
      </div>
      <span className="text-[11px] text-muted text-center leading-tight">
        {COUNTRY_LABELS[country]}
      </span>
    </div>
  );
}

const CATEGORY_COLORS: Record<EventCategory, string> = {
  battle: "#e63946",
  naval: "#457b9d",
  air: "#a8dadc",
  political: "#6a4c93",
  atrocity: "#555",
};

const CATEGORY_LABELS: Record<EventCategory, string> = {
  battle: "Battle",
  naval: "Naval",
  air: "Air Operation",
  political: "Political",
  atrocity: "Atrocity",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function EventPanel({ event, flags, onClose }: Props) {
  const color = CATEGORY_COLORS[event.category];
  const allied = event.sides?.allied[0];
  const axis = event.sides?.axis[0];
  const divisions = divisionsForEvent(event);

  return (
    <div
      style={{
        border: `1px solid ${color}44`,
        borderTop: `3px solid ${color}`,
      }}
      className="absolute top-4 right-4 z-[1000] w-[360px] max-h-[calc(100%-2rem)] bg-surface rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="px-3.5 pt-3 pb-2.5 border-b border-rim shrink-0">
        <div className="flex justify-between items-start gap-2">
          <div>
            <span
              style={{
                color,
                background: `${color}22`,
                border: `1px solid ${color}44`,
              }}
              className="inline-block text-[10px] font-bold tracking-[0.08em] uppercase rounded px-1.5 py-px mb-1.5"
            >
              {CATEGORY_LABELS[event.category]}
            </span>
            <h2 className="m-0 text-base font-bold text-ink leading-snug">
              {event.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="bg-transparent border-none text-faint text-lg cursor-pointer px-1 shrink-0 leading-none hover:text-dim transition-colors duration-150"
            title="Close"
          >
            ×
          </button>
        </div>
        <div className="mt-1.5 text-xs text-muted">
          {formatDate(event.date)}
          {event.endDate && ` — ${formatDate(event.endDate)}`}
        </div>
      </div>

      {/* Sides */}
      {(allied || axis) && (
        <div className="flex items-center justify-center gap-4 px-3.5 py-3 border-b border-rim bg-deep/40 shrink-0">
          {allied ? <SideFlag country={allied} flags={flags} /> : <div className="w-20" />}
          <span className="text-[11px] font-bold tracking-[0.1em] text-faint">
            VS
          </span>
          {axis ? <SideFlag country={axis} flags={flags} /> : <div className="w-20" />}
        </div>
      )}

      {/* Body */}
      <div className="px-3.5 py-3 overflow-y-auto flex-1">
        <p className="m-0 mb-3.5 text-sm text-dim leading-7">{event.article}</p>

        {divisions.length > 0 && (
          <div className="border-t border-rim pt-2.5 mb-3.5">
            <div className="text-[11px] font-bold tracking-[0.06em] uppercase text-faint mb-1.5">
              Units Involved
            </div>
            {divisions.map((division) => (
              <a
                key={division.id}
                href={`/divisions?division=${division.id}`}
                className="block text-xs text-link no-underline py-0.5 hover:underline"
              >
                → {division.name}
                {division.branch && (
                  <span className="text-faint"> · {division.branch}</span>
                )}
              </a>
            ))}
          </div>
        )}

        {event.links && event.links.length > 0 && (
          <div className="border-t border-rim pt-2.5">
            <div className="text-[11px] font-bold tracking-[0.06em] uppercase text-faint mb-1.5">
              Further Reading
            </div>
            {event.links.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs text-link no-underline py-0.5 hover:underline"
              >
                → {link.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
