import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { checkInTicket, fetchEvent } from '../api/events.js'
import CameraQrScanner from '../components/CameraQrScanner.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { formatDateTime, formatMoney } from '../utils/format.js'

export default function EventCheckInPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [ticketInput, setTicketInput] = useState('')
  const [checking, setChecking] = useState(false)
  const [scanError, setScanError] = useState('')
  const [checkIn, setCheckIn] = useState(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setLoadError('')
    setEvent(null)
    setCheckIn(null)
    setScanError('')

    fetchEvent(id)
      .then((loadedEvent) => {
        if (active) setEvent(loadedEvent)
      })
      .catch((requestError) => {
        if (active) setLoadError(requestError.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [id])

  const verifyCode = useCallback(
    async (rawCode) => {
      const ticketCode = rawCode.trim()
      if (!ticketCode) {
        setScanError('Enter or scan a ticket code.')
        return
      }

      setChecking(true)
      setScanError('')
      setCheckIn(null)
      try {
        const data = await checkInTicket(id, ticketCode)
        setCheckIn(data.check_in)
        setTicketInput('')
      } catch (requestError) {
        setScanError(requestError.message)
      } finally {
        setChecking(false)
      }
    },
    [id],
  )

  function handleManualSubmit(submitEvent) {
    submitEvent.preventDefault()
    verifyCode(ticketInput)
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <p className="font-mono text-[11px] tracking-[0.08em] text-muted uppercase">Loading check-in…</p>
      </main>
    )
  }

  if (loadError || !event) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <p role="alert" className="alert-danger">
          {loadError ? `Unable to load this event: ${loadError}` : "We couldn't find that event."}
        </p>
        <Link
          to="/dashboard"
          className="mt-5 inline-block font-mono text-[11px] tracking-[0.08em] text-muted uppercase underline decoration-ink/20 underline-offset-4 transition-colors hover:text-tomato-deep"
        >
          ← Back to dashboard
        </Link>
      </main>
    )
  }

  const isOwner = user && String(event.organizerId) === String(user.id)
  const canScan = Boolean(isOwner)
  const scannerUnavailable = event.isScraped || event.type === 'fundraiser'

  if (!canScan) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <div className="paper p-6">
          <p className="eyebrow">Access restricted</p>
          <h1 className="display mt-3 text-3xl">Organizer check-in only</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Only the organizer of {event.title} can check in tickets.
          </p>
          <Link to={`/events/${event.id}`} className="btn btn-dark mt-5 inline-flex">
            Back to event
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <Link
        to={`/events/${event.id}`}
        className="font-mono text-[11px] tracking-[0.08em] text-muted uppercase underline decoration-ink/20 underline-offset-4 transition-colors hover:text-tomato-deep"
      >
        ← Back to event
      </Link>

      <header className="mt-6 border-y-2 border-ink/15 py-6">
        <p className="eyebrow">Organizer check-in</p>
        <h1 className="display mt-3 text-4xl sm:text-5xl">{event.title}</h1>
        <p className="mt-4 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[11px] tracking-[0.06em] text-muted uppercase">
          <span>{formatDateTime(event.date)}</span>
          <span aria-hidden="true" className="text-tomato">✳</span>
          <span>{event.location}</span>
        </p>
      </header>

      {scannerUnavailable || event.status === 'cancelled' ? (
        <div className="paper mt-8 p-5">
          <p className="text-sm leading-relaxed text-muted">
            {event.status === 'cancelled'
              ? 'This event has been cancelled. Ticket check-in is closed.'
              : 'Ticket check-in is only available for standard Campus Hub events.'}
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <section className="paper p-5 sm:p-6" aria-labelledby="scanner-heading">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id="scanner-heading" className="display text-3xl">Scan a ticket</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  Point the camera at the QR code on the attendee’s ticket.
                </p>
              </div>
              <span className="badge bg-ink text-cream">Live check-in</span>
            </div>

            <div className="mt-5">
              <CameraQrScanner onScan={verifyCode} disabled={checking} />
            </div>

            <form className="mt-6 space-y-3 border-t-2 border-dashed border-ink/15 pt-5" onSubmit={handleManualSubmit}>
              <label htmlFor="ticket-code" className="font-mono text-[10px] font-medium tracking-[0.08em] uppercase">
                Enter a ticket code manually
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  id="ticket-code"
                  className="input font-mono"
                  autoComplete="off"
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  value={ticketInput}
                  onChange={(changeEvent) => setTicketInput(changeEvent.target.value)}
                />
                <button type="submit" className="btn btn-dark shrink-0" disabled={checking}>
                  {checking ? 'Checking…' : 'Check in'}
                </button>
              </div>
              <p className="text-xs leading-relaxed text-muted">
                Use this fallback when camera access is unavailable. Camera access needs HTTPS or localhost.
              </p>
            </form>
          </section>

          <div className="space-y-4">
            {checking && (
              <div className="paper p-5" role="status" aria-live="polite">
                <p className="font-mono text-[11px] tracking-[0.08em] text-muted uppercase">Checking ticket…</p>
              </div>
            )}

            {scanError && (
              <div role="alert" className="alert-danger p-5">
                <p className="eyebrow text-danger">Check-in failed</p>
                <p className="mt-2 leading-relaxed">{scanError}</p>
              </div>
            )}

            {checkIn && (
              <section
                role="status"
                aria-live="polite"
                className="paper overflow-hidden"
              >
                <div aria-hidden="true" className={`h-2 w-full ${checkIn.already_checked_in ? 'bg-tomato' : 'bg-leaf'}`} />
                <div className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className={`eyebrow ${checkIn.already_checked_in ? 'text-tomato-deep' : 'text-leaf'}`}>
                      {checkIn.already_checked_in ? 'Already checked in' : 'Checked in'}
                    </p>
                    <span className={`badge ${checkIn.already_checked_in ? 'bg-tomato text-ink' : 'bg-leaf text-cream'}`}>
                      {checkIn.already_checked_in ? 'Duplicate scan' : 'Admitted'}
                    </span>
                  </div>
                  <h2 className="display mt-3 text-2xl">{checkIn.attendee_name}</h2>
                  <p className="mt-1 text-sm text-muted">{checkIn.attendee_email}</p>

                  <dl className="mt-5 space-y-2.5 border-t-2 border-dashed border-ink/15 pt-4 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="mono-meta">Ticket</dt>
                      <dd className="break-all text-right font-mono text-[11px]">{checkIn.ticket_code}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="mono-meta">Type</dt>
                      <dd className="font-medium capitalize">{checkIn.type}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="mono-meta">Paid</dt>
                      <dd className="font-medium">{formatMoney(checkIn.amount_paid)}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="mono-meta">Check-in time</dt>
                      <dd className="text-right font-medium">{formatDateTime(checkIn.checked_in_at)}</dd>
                    </div>
                  </dl>

                  {checkIn.already_checked_in && (
                    <p className="mt-4 rounded-[3px] border-2 border-ink/15 bg-cream p-3 text-xs leading-relaxed text-ink/80">
                      This ticket was already used. The original check-in time is shown above.
                    </p>
                  )}
                </div>
              </section>
            )}

            <section className="rounded-[3px] border-2 border-dashed border-ink/20 bg-cream/50 p-5 text-sm">
              <h2 className="eyebrow">How it works</h2>
              <p className="mt-2 leading-relaxed text-muted">
                A valid ticket is marked as checked in once. Scanning it again shows the original
                check-in time instead of creating a duplicate.
              </p>
            </section>
          </div>
        </div>
      )}
    </main>
  )
}
