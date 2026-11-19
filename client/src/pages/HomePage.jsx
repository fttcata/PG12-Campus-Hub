import { Link } from 'react-router-dom'
import EventCard from '../components/EventCard.jsx'
import { EventGridSkeleton } from '../components/LoadingSkeleton.jsx'
import { useEvents } from '../hooks/useEvents.js'
import { byDate, formatDate, getEventKind, KIND_LABELS } from '../utils/format.js'

const STEPS = [
  ['01', 'Browse', 'Search events and fundraisers across HKU, CUHK and PolyU, filtered by free, paid or charity.'],
  ['02', 'Book or pledge', 'Claim a free ticket, check out a paid one, or pledge to a campaign in a couple of taps.'],
  ['03', 'Get your receipt', 'Every booking gets a unique reference, and the event chat unlocks 6 hours before it starts.'],
]

const MINI_ACCENTS = {
  free: { band: 'bg-teal', text: 'text-cream' },
  paid: { band: 'bg-tomato', text: 'text-ink' },
  fundraiser: { band: 'bg-violet', text: 'text-cream' },
}

function MiniPoster({ event, position, tilt, delay, withTape = false }) {
  const kind = getEventKind(event)
  const accent = MINI_ACCENTS[kind] ?? MINI_ACCENTS.free

  return (
    <Link
      to={`/events/${event.id}`}
      className={`print drop block p-3 ${withTape ? 'tape' : ''} ${position}`}
      style={{ '--tilt': tilt, '--delay': delay }}
    >
      <div className={`relative flex h-24 items-end p-3 ${accent.band}`}>
        <span
          className={`absolute top-2 left-3 font-mono text-[9px] tracking-[0.14em] uppercase ${accent.text} opacity-80`}
        >
          {formatDate(event.date)}
        </span>
        <span className={`display text-3xl leading-none ${accent.text}`}>{KIND_LABELS[kind]}</span>
      </div>
      <p className="display mt-3 line-clamp-3 text-[1.15rem] leading-[1.02]">{event.title}</p>
      <p className="mt-2 line-clamp-1 font-mono text-[9px] tracking-[0.1em] text-muted uppercase">
        {event.location || event.university}
      </p>
    </Link>
  )
}

function MiniPosterSkeleton({ position, tilt }) {
  return (
    <div aria-hidden="true" className={`print block p-3 ${position}`} style={{ '--tilt': tilt }}>
      <div className="h-24 animate-pulse bg-line" />
      <div className="mt-3 h-5 w-4/5 animate-pulse bg-line" />
      <div className="mt-2 h-3 w-2/3 animate-pulse bg-line" />
      <div className="mt-2 h-3 w-1/2 animate-pulse bg-line" />
    </div>
  )
}

export default function HomePage() {
  const { events, loading } = useEvents()

  const sorted = [...events].sort(byDate)
  const upcoming = sorted.filter((event) => new Date(event.date) >= new Date())
  const featured = (upcoming.length ? upcoming : sorted).slice(0, 3)

  return (
    <main>
      <section className="grid-paper relative border-b border-ink/10">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 pt-14 pb-16 sm:px-6 md:pt-20 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:items-center lg:gap-10 lg:pt-24 lg:pb-24">
          <div>
            <p className="eyebrow rise">Campus Hub · HKU · CUHK · PolyU</p>
            <h1 className="display rise mt-5 text-[clamp(3.2rem,8.6vw,7.5rem)]" style={{ '--delay': '80ms' }}>
              Find your next <span className="text-tomato">good reason</span> to show up.
            </h1>
            <p
              className="rise mt-7 max-w-md text-[15px] leading-relaxed text-muted sm:text-base"
              style={{ '--delay': '160ms' }}
            >
              Student events, tickets and grassroots fundraisers in one place, instead of scattered across twenty group
              chats and a noticeboard.
            </p>
            <div
              className="rise mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5"
              style={{ '--delay': '240ms' }}
            >
              <Link to="/events" className="btn btn-dark px-5 py-3.5">
                Browse events <span aria-hidden="true">↗</span>
              </Link>
              <Link
                to="/events?type=fundraiser"
                className="text-sm font-semibold underline decoration-ink/30 underline-offset-4 transition-colors hover:text-tomato-deep hover:decoration-tomato-deep"
              >
                Support a fundraiser <span aria-hidden="true">→</span>
              </Link>
            </div>
            <p
              className="rise mt-10 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] tracking-[0.12em] text-muted uppercase"
              style={{ '--delay': '320ms' }}
            >
              <span>Verified students</span>
              <span aria-hidden="true" className="text-tomato">
                ✳
              </span>
              <span>Free to browse</span>
              <span aria-hidden="true" className="text-tomato">
                ✳
              </span>
              <span>3 campuses</span>
            </p>
          </div>

          <div className="relative hidden h-[30rem] lg:block" aria-label="Featured events">
            {loading || featured.length === 0 ? (
              <>
                <MiniPosterSkeleton position="absolute top-0 left-0 w-52" tilt="-6deg" />
                <MiniPosterSkeleton position="absolute top-24 right-0 w-60" tilt="3deg" />
                <MiniPosterSkeleton position="absolute bottom-2 left-12 w-56" tilt="-2deg" />
              </>
            ) : (
              <>
                {featured[0] && (
                  <MiniPoster
                    event={featured[0]}
                    position="absolute top-0 left-0 z-10 w-52"
                    tilt="-6deg"
                    delay="280ms"
                    withTape
                  />
                )}
                {featured[1] && (
                  <MiniPoster
                    event={featured[1]}
                    position="absolute top-24 right-0 z-20 w-60"
                    tilt="3deg"
                    delay="400ms"
                  />
                )}
                {featured[2] && (
                  <MiniPoster
                    event={featured[2]}
                    position="absolute bottom-2 left-12 z-30 w-56"
                    tilt="-2deg"
                    delay="520ms"
                  />
                )}
              </>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl border-b border-ink/10 px-4 py-14 sm:px-6">
        <div className="mb-9 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="eyebrow">Up next</p>
            <h2 className="display mt-4 max-w-md text-4xl sm:text-5xl">Events worth leaving your room for.</h2>
          </div>
          <Link
            to="/events"
            className="font-mono text-[11px] tracking-[0.1em] text-muted uppercase underline decoration-ink/20 underline-offset-4 transition-colors hover:text-tomato-deep"
          >
            All events <span aria-hidden="true">→</span>
          </Link>
        </div>
        {loading ? (
          <EventGridSkeleton className="md:grid-cols-3" />
        ) : (
          <div className="grid gap-x-6 gap-y-10 pb-4 md:grid-cols-3">
            {featured.map((event, index) => (
              <EventCard key={event.id} event={event} index={index} />
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <p className="eyebrow">How it works</p>
        <div className="mt-8 grid gap-8 md:grid-cols-3 md:gap-10">
          {STEPS.map(([number, title, text]) => (
            <div key={number} className="border-t-2 border-ink/15 pt-4">
              <p className="font-mono text-3xl leading-none font-medium tracking-[-0.04em] text-tomato-deep">
                {number}
              </p>
              <h3 className="display mt-4 text-2xl">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
