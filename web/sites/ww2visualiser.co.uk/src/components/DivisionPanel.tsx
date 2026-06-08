import type { Division } from "../types/divisions";
import { COUNTRY_FLAGS, COUNTRY_LABELS } from "../types/events";
import { eventsForDivision } from "../lib/divisionLinks";

interface Props {
  division: Division;
  onClose: () => void;
}

const ACCENT = "#a8763e";

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function DivisionPanel({ division, onClose }: Props) {
  const battles = eventsForDivision(division);

  return (
    <div
      style={{
        border: `1px solid ${ACCENT}44`,
        borderTop: `3px solid ${ACCENT}`,
      }}
      className="fixed top-4 right-4 z-[1000] w-[360px] max-h-[calc(100%-2rem)] bg-surface rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="px-3.5 pt-3 pb-2.5 border-b border-rim shrink-0">
        <div className="flex justify-between items-start gap-2">
          <div>
            {division.type && (
              <span
                style={{
                  color: ACCENT,
                  background: `${ACCENT}22`,
                  border: `1px solid ${ACCENT}44`,
                }}
                className="inline-block text-[10px] font-bold tracking-[0.08em] uppercase rounded px-1.5 py-px mb-1.5"
              >
                {division.type}
              </span>
            )}
            <h2 className="m-0 text-base font-bold text-ink leading-snug">
              {division.name}
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
        <div className="mt-1.5 flex items-center gap-2 text-xs text-muted">
          <span title={COUNTRY_LABELS[division.country]}>
            {COUNTRY_FLAGS[division.country]} {COUNTRY_LABELS[division.country]}
          </span>
          {division.branch && (
            <>
              <span className="text-faint">·</span>
              <span>{division.branch}</span>
            </>
          )}
        </div>
        {(division.formed || division.disbanded) && (
          <div className="mt-1 text-xs text-muted">
            {division.formed && formatDate(division.formed)}
            {division.formed && division.disbanded && " — "}
            {division.disbanded && formatDate(division.disbanded)}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="px-3.5 py-3 overflow-y-auto flex-1">
        <p className="m-0 mb-3.5 text-sm text-dim leading-7">
          {division.article}
        </p>

        {battles.length > 0 && (
          <div className="border-t border-rim pt-2.5 mb-3.5">
            <div className="text-[11px] font-bold tracking-[0.06em] uppercase text-faint mb-1.5">
              Battles
            </div>
            {battles.map((event) => (
              <a
                key={event.id}
                href={`/?event=${event.id}`}
                className="block text-xs text-link no-underline py-0.5 hover:underline"
              >
                → {event.title}
                <span className="text-faint"> · {formatDate(event.date)}</span>
              </a>
            ))}
          </div>
        )}

        {division.links.length > 0 && (
          <div className="border-t border-rim pt-2.5">
            <div className="text-[11px] font-bold tracking-[0.06em] uppercase text-faint mb-1.5">
              Further Reading
            </div>
            {division.links.map((link, i) => (
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
