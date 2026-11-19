import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import EventCard from '../components/EventCard.jsx'
import { EventGridSkeleton } from '../components/LoadingSkeleton.jsx'
import { useEvents } from '../hooks/useEvents.js'
import { byDate, getEventKind } from '../utils/format.js'
import { UNIVERSITIES } from '../utils/universities.js'

const KIND_FILTERS = [
  ['all', 'All'],
  ['scraped', 'CEDARS'],
  ['free', 'Free'],
  ['paid', 'Paid'],
  ['fundraiser', 'Fundraisers'],
]

export default function EventsPage() {
  const { events, loading } = useEvents()

  // Filters live in the URL (?q=run&type=paid) so a filtered list can be shared or bookmarked.
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const kind = searchParams.get('type') ?? 'all'
  const university = searchParams.get('uni') ?? 'all'

  function updateParam(name, value) {
    const next = new URLSearchParams(searchParams)
    if (!value || value === 'all') next.delete(name)
    else next.set(name, value)
    setSearchParams(next, { replace: true })
  }

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    return events
      .filter((event) => {
        if (kind === 'all') return true
        if (kind === 'scraped') return event.isScraped || event.isExternal
        return !(event.isScraped || event.isExternal) && getEventKind(event) === kind
      })
      .filter((event) => university === 'all' || event.university === university)
      .filter((event) => {
        if (!keyword) return true
        const text = [event.title, event.description, event.location, event.category, event.organizer].join(' ')
        return text.toLowerCase().includes(keyword)
      })
      .sort((a, b) => Number(b.isScraped) - Number(a.isScraped) || byDate(a, b))
  }, [events, query, kind, university])

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="eyebrow">Directory</p>
          <h1 className="display mt-4 text-[clamp(3rem,7vw,5.5rem)]">All events.</h1>
        </div>
        <p className="mono-meta pb-1 md:text-right">
          {loading ? 'Loading events…' : `${events.length} pinned · ${filtered.length} shown`}
        </p>
      </div>

      <section className="mt-8 border-y border-ink/15 py-5" aria-label="Search and filter events">
        <div className="flex flex-col gap-3 md:flex-row">
          <input
            type="search"
            className="input md:flex-1"
            placeholder="Search by title, venue, society…"
            value={query}
            onChange={(e) => updateParam('q', e.target.value)}
            aria-label="Search events"
          />
          <select
            className="input md:w-56"
            value={university}
            onChange={(e) => updateParam('uni', e.target.value)}
            aria-label="Filter by university"
          >
            <option value="all">All universities</option>
            {UNIVERSITIES.map((u) => (
              <option key={u.code} value={u.code}>
                {u.code}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 flex flex-wrap gap-2.5">
          {KIND_FILTERS.map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={kind === value}
              onClick={() => updateParam('type', value)}
              className={`rounded-[3px] border-2 border-ink px-3.5 py-1.5 font-mono text-[10px] font-medium tracking-[0.1em] uppercase transition-[transform,box-shadow,background-color,color] duration-200 ${
                kind === value
                  ? 'bg-ink text-cream shadow-[3px_3px_0_rgba(21,21,21,.2)]'
                  : 'bg-cream text-ink shadow-[2px_2px_0_rgba(21,21,21,.12)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_rgba(21,21,21,.2)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <p className="mono-meta mt-6">
        {loading ? 'Fetching the noticeboard…' : `Showing ${filtered.length} of ${events.length} events · sorted by date`}
      </p>

      {loading ? (
        <div className="mt-6">
          <EventGridSkeleton count={6} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-8 border-2 border-dashed border-ink/25 bg-card p-10 text-center">
          <p className="display text-3xl">Nothing pinned here yet.</p>
          <p className="mt-3 text-sm text-muted">Try a different search, campus or event type.</p>
          <button type="button" className="btn btn-outline mt-6" onClick={() => setSearchParams({})}>
            Clear filters
          </button>
        </div>
      ) : (
        <div className="mt-7 grid gap-x-6 gap-y-10 pb-10 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((event, index) => (
            <EventCard key={event.id} event={event} index={index} />
          ))}
        </div>
      )}
    </main>
  )
}
