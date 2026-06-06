import { useState, useMemo } from 'react';
import eventsData from '../data/events.json';
import type { WW2Event, EventCategory, Theater } from '../types/events';
import { COUNTRY_FLAGS, COUNTRY_LABELS } from '../types/events';

const events = eventsData as WW2Event[];

const CATEGORY_LABELS: Record<EventCategory, string> = {
  battle: 'Battle',
  naval: 'Naval',
  air: 'Air',
  political: 'Political',
  atrocity: 'Atrocity'
};

const CATEGORY_COLORS: Record<EventCategory, string> = {
  battle: 'bg-red-900/60 text-red-300 border-red-700/50',
  naval: 'bg-blue-900/60 text-blue-300 border-blue-700/50',
  air: 'bg-sky-900/60 text-sky-300 border-sky-700/50',
  political: 'bg-purple-900/60 text-purple-300 border-purple-700/50',
  atrocity: 'bg-rose-950/60 text-rose-400 border-rose-800/50'
};

const THEATER_LABELS: Record<Theater, string> = {
  europe: 'Europe',
  pacific: 'Pacific',
  africa: 'Africa',
  atlantic: 'Atlantic',
  asia: 'Asia',
};

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

const PAGE_SIZE = 50;

export default function EventsList() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<EventCategory | ''>('');
  const [theater, setTheater] = useState<Theater | ''>('');
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return events.filter(e => {
      if (category && e.category !== category) return false;
      if (theater && e.theater !== theater) return false;
      if (q && !e.title.toLowerCase().includes(q) && !e.article.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [query, category, theater]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const clampedPage = Math.min(page, totalPages);
  const slice = filtered.slice((clampedPage - 1) * PAGE_SIZE, clampedPage * PAGE_SIZE);

  function resetPage() {
    setPage(1);
  }

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-deep text-dim font-sans">
      {/* Header */}
      <header className="bg-surface border-b border-rim sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
          <a
            href="/"
            className="text-muted hover:text-ink transition-colors text-sm shrink-0"
          >
            ← Map
          </a>
          <h1 className="text-ink font-semibold text-lg">WW2 Events</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Search & filters */}
        <div className="flex flex-col gap-3 mb-6">
          <input
            type="search"
            placeholder="Search events…"
            value={query}
            onChange={e => { setQuery(e.target.value); resetPage(); }}
            className="w-full bg-surface border border-rim rounded-md px-4 py-2.5 text-dim placeholder-faint focus:outline-none focus:border-accent transition-colors"
          />
          <div className="flex gap-3 flex-wrap items-center">
            <select
              value={category}
              onChange={e => { setCategory(e.target.value as EventCategory | ''); resetPage(); }}
              className="bg-surface border border-rim rounded-md px-3 py-2 text-sm text-dim focus:outline-none focus:border-accent transition-colors"
            >
              <option value="">All categories</option>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <select
              value={theater}
              onChange={e => { setTheater(e.target.value as Theater | ''); resetPage(); }}
              className="bg-surface border border-rim rounded-md px-3 py-2 text-sm text-dim focus:outline-none focus:border-accent transition-colors"
            >
              <option value="">All theaters</option>
              {Object.entries(THEATER_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <span className="ml-auto text-muted text-sm">
              {filtered.length} event{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Event list */}
        <div className="flex flex-col gap-4">
          {slice.length === 0 && (
            <p className="text-muted text-center py-16">No events match your search.</p>
          )}
          {slice.map(event => {
            const isExpanded = expanded.has(event.id);
            const articleTruncated = event.article.length > 400;
            const displayArticle =
              articleTruncated && !isExpanded
                ? event.article.slice(0, 400).trimEnd() + '…'
                : event.article;

            return (
              <article
                key={event.id}
                className="bg-surface border border-rim rounded-lg p-5 hover:border-accent/40 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 mb-3">
                  <h2 className="text-ink font-semibold text-base leading-snug">{event.title}</h2>
                  <time className="text-muted text-sm shrink-0 sm:pl-4">
                    {formatDate(event.date)}
                    {event.endDate && ` – ${formatDate(event.endDate)}`}
                  </time>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${CATEGORY_COLORS[event.category]}`}>
                    {CATEGORY_LABELS[event.category]}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border bg-surface text-muted border-rim">
                    {THEATER_LABELS[event.theater]}
                  </span>
                  {event.sides && (
                    <>
                      {event.sides.allied.map(f => (
                        <span
                          key={f}
                          title={COUNTRY_LABELS[f]}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border bg-surface text-muted border-rim"
                        >
                          <span>{COUNTRY_FLAGS[f]}</span>
                          <span>{COUNTRY_LABELS[f]}</span>
                        </span>
                      ))}
                      {event.sides.allied.length > 0 && event.sides.axis.length > 0 && (
                        <span className="text-faint text-xs px-0.5">vs</span>
                      )}
                      {event.sides.axis.map(f => (
                        <span
                          key={f}
                          title={COUNTRY_LABELS[f]}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border bg-surface text-muted border-rim"
                        >
                          <span>{COUNTRY_FLAGS[f]}</span>
                          <span>{COUNTRY_LABELS[f]}</span>
                        </span>
                      ))}
                    </>
                  )}
                </div>

                <p className="text-body text-sm leading-relaxed">{displayArticle}</p>
                {articleTruncated && (
                  <button
                    onClick={() => toggleExpand(event.id)}
                    className="mt-1.5 text-link text-xs hover:underline"
                  >
                    {isExpanded ? 'Show less' : 'Read more'}
                  </button>
                )}

                {event.links && event.links.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-3">
                    {event.links.map(l => (
                      <a
                        key={l.url}
                        href={l.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-link text-xs hover:underline"
                      >
                        {l.label} ↗
                      </a>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              disabled={clampedPage <= 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 text-sm rounded border border-rim text-muted hover:text-ink hover:border-accent/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ← Prev
            </button>
            <span className="text-muted text-sm">
              {clampedPage} / {totalPages}
            </span>
            <button
              disabled={clampedPage >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 text-sm rounded border border-rim text-muted hover:text-ink hover:border-accent/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
