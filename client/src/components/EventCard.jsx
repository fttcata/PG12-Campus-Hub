import { Link } from 'react-router-dom'
import ProgressBar from './ProgressBar.jsx'
import { formatDate, formatMoney, getEventKind, getSafeExternalUrl, KIND_LABELS } from '../utils/format.js'

// One accent per event kind: the band and progress bar carry the colour; the label stays explicit.
const KIND_STYLES = {
  free: { band: 'bg-teal', progress: 'bg-teal' },
  paid: { band: 'bg-tomato', progress: 'bg-tomato' },
  fundraiser: { band: 'bg-violet', progress: 'bg-violet' },
  scraped: { band: 'bg-ink', progress: 'bg-ink' },
}

const TILTS = ['-1.4deg', '0.9deg', '-0.6deg', '1.2deg', '-0.9deg', '0.5deg']

function CardBody({ event, external, kind, seatsLeft }) {
  const cardKind = external ? 'scraped' : kind
  const styles = KIND_STYLES[cardKind]
  const seatsCopy = seatsLeft > 0 ? `${seatsLeft} seats left` : 'Sold out'

  return (
    <>
      <div aria-hidden="true" className={`h-2.5 w-full ${styles.band}`} />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <span className="font-mono text-[11px] tracking-[0.08em] text-muted uppercase">{formatDate(event.date)}</span>
          <span className="badge">{external ? 'CEDARS' : KIND_LABELS[kind]}</span>
        </div>

        <h3 className="display mt-auto pt-10 text-[1.65rem] leading-[0.95]">{event.title}</h3>
        <p className="mt-2 text-sm text-muted">
          {event.category}
          {event.location ? ` · ${event.location}` : ''}
        </p>

        {!external && (
          <div className="mt-4 font-mono text-[11px] tracking-[0.06em] text-muted uppercase">
            {kind === 'fundraiser' ? (
              <>
                <ProgressBar value={event.raised} max={event.goal} barClassName={styles.progress} />
                <p className="mt-2">
                  {formatMoney(event.raised)} of {formatMoney(event.goal)}
                </p>
              </>
            ) : (
              <p>
                {kind === 'paid' ? formatMoney(event.price) : 'Free'}
                {event.capacity > 0 && ` · ${seatsCopy}`}
              </p>
            )}
          </div>
        )}

        <p className="mt-5 flex items-center gap-1.5 text-sm font-semibold">
          View details <span aria-hidden="true" className="text-tomato-deep">↗</span>
        </p>
      </div>
    </>
  )
}

export default function EventCard({ event, index = 0 }) {
  const kind = getEventKind(event)
  const seatsLeft = event.capacity - event.booked
  const external = event.isScraped || event.isExternal
  const originalUrl = external ? getSafeExternalUrl(event.originalUrl) : null
  const tilt = TILTS[index % TILTS.length]

  return (
    <article className="print flex h-full min-h-[19rem] flex-col" style={{ '--tilt': tilt }}>
      {external ? (
        originalUrl ? (
          <a
            href={originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`View ${event.title} details on the original listing`}
            className="flex h-full flex-col outline-none"
          >
            <CardBody event={event} external={external} kind={kind} seatsLeft={seatsLeft} />
          </a>
        ) : (
          <div className="flex h-full flex-col">
            <CardBody event={event} external={external} kind={kind} seatsLeft={seatsLeft} />
          </div>
        )
      ) : (
        <Link
          to={`/events/${event.id}`}
          aria-label={`View ${event.title} details`}
          className="flex h-full flex-col outline-none"
        >
          <CardBody event={event} external={external} kind={kind} seatsLeft={seatsLeft} />
        </Link>
      )}
    </article>
  )
}
