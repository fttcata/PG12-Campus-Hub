import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { bookEventTickets, fetchEvent } from '../api/events.js'
import Field from '../components/Field.jsx'
import { useActivity } from '../context/ActivityContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useEvents } from '../hooks/useEvents.js'
import { formatDateTime, formatMoney } from '../utils/format.js'
import TicketQrCode from '../components/TicketQrCode.jsx'
import { CheckoutSkeleton } from '../components/LoadingSkeleton.jsx'
import { googleCalendarUrl } from '../utils/calendar.js'

const STEPS = [
  ['attendees', 'Attendee details'],
  ['payment', 'Payment / claim'],
  ['complete', 'Confirmation'],
]

const MAX_TICKETS_PER_ORDER = 4

function validateCardDetails(card) {
  if (!/^\d{16}$/.test(card.number)) return 'Card number must contain exactly 16 digits.'
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(card.expiry)) return 'Expiry date must use MM/YY format.'
  if (!/^\d{3}$/.test(card.cvc)) return 'CVV must contain exactly 3 digits.'
  return ''
}

function CheckoutProgress({ currentStep }) {
  const activeIndex = STEPS.findIndex(([key]) => key === currentStep)

  return (
    <nav aria-label="Checkout progress" className="mb-8">
      <div aria-hidden="true" className="mb-4 flex gap-1.5">
        {STEPS.map(([key], index) => (
          <span
            key={key}
            className={`h-2 flex-1 rounded-[1px] border-2 border-ink ${
              index <= activeIndex ? 'bg-tomato' : 'bg-card'
            }`}
          />
        ))}
      </div>
      <ol className="grid grid-cols-3 gap-3">
        {STEPS.map(([key, label], index) => {
          const complete = index < activeIndex
          const active = index === activeIndex
          return (
            <li
              key={key}
              aria-current={active ? 'step' : undefined}
              className={`flex items-start gap-2 font-mono text-[10px] leading-tight tracking-[0.05em] uppercase sm:items-center sm:text-[11px] ${
                active ? 'text-ink' : 'text-muted'
              }`}
            >
              <span
                className={`grid size-7 shrink-0 place-items-center rounded-[2px] border-2 border-ink text-[10px] shadow-[2px_2px_0_rgba(21,21,21,.12)] ${
                  complete
                    ? 'bg-ink text-cream'
                    : active
                      ? 'bg-tomato text-ink'
                      : 'bg-card text-muted'
                }`}
              >
                {complete ? '✓' : index + 1}
              </span>
              <span className={active ? 'font-semibold' : ''}>{label}</span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

function createAttendees(quantity, user) {
  return Array.from({ length: quantity }, (_, index) => ({
    name: index === 0 ? user.name ?? '' : '',
    email: index === 0 ? user.email ?? '' : '',
  }))
}

function CheckoutFlow({ id }) {
  const { user } = useAuth()
  const { bookTicket } = useActivity()
  const { events, source, loading } = useEvents()
  const [searchParams] = useSearchParams()
  const requestedQuantity = Number(searchParams.get('quantity'))
  const quantity =
    Number.isInteger(requestedQuantity) && requestedQuantity >= 1 && requestedQuantity <= MAX_TICKETS_PER_ORDER
      ? requestedQuantity
      : 1
  const listedEvent = events.find((item) => item.id === id)
  const [remoteResult, setRemoteResult] = useState(null)
  const currentRemoteResult = remoteResult?.id === id ? remoteResult : null
  const event = listedEvent ?? currentRemoteResult?.event ?? null
  const loadError = currentRemoteResult?.error ?? null
  const isLoadingEvent = loading || (!listedEvent && !currentRemoteResult)
  const [attendees, setAttendees] = useState(() => createAttendees(quantity, user))
  const [step, setStep] = useState('attendees')
  const [card, setCard] = useState({ number: '', expiry: '', cvc: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    if (loading || listedEvent) return

    let active = true
    fetchEvent(id)
      .then((loadedEvent) => {
        if (active) setRemoteResult({ id, event: loadedEvent, source: 'api' })
      })
      .catch((requestError) => {
        if (active) setRemoteResult({ id, error: requestError })
      })

    return () => {
      active = false
    }
  }, [id, loading, listedEvent])

  if (isLoadingEvent) {
    return <CheckoutSkeleton />
  }
  if (loadError || !event) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <p role="alert" className="alert-danger">
          {loadError ? `Unable to load this event: ${loadError.message}` : "We couldn't find that event."}
        </p>
        <Link
          to={`/events/${id}`}
          className="mt-5 inline-block font-mono text-[11px] tracking-[0.08em] text-muted uppercase underline decoration-ink/20 underline-offset-4 transition-colors hover:text-tomato-deep"
        >
          ← Back to event
        </Link>
      </main>
    )
  }
  if (event.isScraped) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <div className="paper p-5">
          <p className="eyebrow">External listing</p>
          <p className="mt-3 text-muted">Tickets for CEDARS events must be booked on the original event website.</p>
          <Link to={`/events/${id}`} className="btn btn-outline mt-5 inline-flex">
            Back to event
          </Link>
        </div>
      </main>
    )
  }

  const isPaid = event.price > 0
  const isApiEvent = /^\d+$/.test(event.id) && (source === 'api' || currentRemoteResult?.source === 'api')
  const tickets = result?.tickets ?? []

  function updateAttendee(index, name, value) {
    setAttendees((current) => current.map((attendee, attendeeIndex) => (
      attendeeIndex === index ? { ...attendee, [name]: value } : attendee
    )))
  }

  function continueToPayment(formEvent) {
    formEvent.preventDefault()
    setError('')
    setStep('payment')
  }

  async function completeCheckout(formEvent) {
    formEvent.preventDefault()
    setError('')
    if (isPaid) {
      const cardError = validateCardDetails(card)
      if (cardError) {
        setError(cardError)
        return
      }
    }
    setSaving(true)
    try {
      if (isApiEvent) {
        const booking = await bookEventTickets(event.id, { attendees })
        setResult(booking)
        window.dispatchEvent(new Event('campushub:ticket-booked'))
      } else {
        const booking = bookTicket(event, attendees)
        setResult({
          tickets: booking.attendees.map((attendee) => ({
            reference_code: attendee.reference,
            attendee_name: attendee.name,
            attendee_email: attendee.email,
            amount_paid: event.price,
          })),
          demo: true,
        })
      }
      setStep('complete')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link
        to={`/events/${event.id}`}
        className="font-mono text-[11px] tracking-[0.08em] text-muted uppercase underline decoration-ink/20 underline-offset-4 transition-colors hover:text-tomato-deep"
      >
        ← Back to event
      </Link>

      <header className="mt-7 border-y-2 border-ink/15 py-6">
        <p className="eyebrow">Ticket checkout</p>
        <h1 className="display mt-3 text-4xl sm:text-5xl">{event.title}</h1>
        <p className="mt-4 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[11px] tracking-[0.06em] text-muted uppercase">
          <span>{formatDateTime(event.date)}</span>
          <span aria-hidden="true" className="text-tomato">✳</span>
          <span>{quantity} ticket{quantity === 1 ? '' : 's'}</span>
          <span aria-hidden="true" className="text-tomato">✳</span>
          <span>{isPaid ? formatMoney(event.price * quantity) : 'Free'}</span>
        </p>
      </header>

      <section className="paper mt-8 p-5 sm:p-7">
        <CheckoutProgress currentStep={step} />

        {step === 'attendees' && (
          <form className="space-y-6" onSubmit={continueToPayment}>
            <div>
              <h2 className="display text-3xl">Who is joining?</h2>
              <p className="mt-2 text-sm text-muted">Enter the name and email address for each ticket.</p>
            </div>

            {attendees.map((attendee, index) => (
              <fieldset key={index} className="grid gap-4 border-t-2 border-dashed border-ink/15 pt-5 sm:grid-cols-2">
                <legend className="px-1 font-mono text-[10px] tracking-[0.08em] text-muted uppercase">
                  Attendee {String(index + 1).padStart(2, '0')}
                </legend>
                <Field label="Full name" htmlFor={`attendee-${index}-name`}>
                  <input
                    id={`attendee-${index}-name`}
                    autoComplete={index === 0 ? 'name' : 'off'}
                    className="input"
                    maxLength={120}
                    required
                    value={attendee.name}
                    onChange={(e) => updateAttendee(index, 'name', e.target.value)}
                  />
                </Field>
                <Field label="Email address" htmlFor={`attendee-${index}-email`}>
                  <input
                    id={`attendee-${index}-email`}
                    type="email"
                    autoComplete={index === 0 ? 'email' : 'off'}
                    className="input"
                    maxLength={160}
                    required
                    value={attendee.email}
                    onChange={(e) => updateAttendee(index, 'email', e.target.value)}
                  />
                </Field>
              </fieldset>
            ))}

            <p className="rounded-[3px] border-2 border-ink/20 bg-cream p-3 text-xs leading-relaxed text-ink/80">
              The buyer will receive one email containing all ticket QR codes. Attendees will not receive separate emails.
            </p>
            <button type="submit" className="btn btn-dark w-full">Continue to {isPaid ? 'payment' : 'claim'}</button>
          </form>
        )}

        {step === 'payment' && (
          <form className="space-y-5" onSubmit={completeCheckout}>
            <div>
              <h2 className="display text-3xl">{isPaid ? 'Review and pay' : 'Review and claim'}</h2>
              <p className="mt-2 font-mono text-[11px] tracking-[0.06em] text-muted uppercase">
                {quantity} ticket{quantity === 1 ? '' : 's'} · {isPaid ? formatMoney(event.price * quantity) : 'Free'}
              </p>
            </div>

            <ul className="space-y-3 border-y-2 border-dashed border-ink/15 py-4">
              {attendees.map((attendee, index) => (
                <li key={index} className="flex flex-col justify-between gap-1 text-sm sm:flex-row">
                  <span className="font-medium">{attendee.name}</span>
                  <span className="text-muted">{attendee.email}</span>
                </li>
              ))}
            </ul>

            {isPaid ? (
              <div className="space-y-4 rounded-[3px] border-2 border-dashed border-ink/25 bg-cream/50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="eyebrow">Demo payment</p>
                  <span className="badge">No real charge</span>
                </div>
                <p className="text-xs leading-relaxed text-muted">
                  This checkout does not charge a card or store card details.
                </p>
                <div className="grid gap-3">
                  <Field label="Demo card number" htmlFor="card-number">
                    <input
                      id="card-number"
                      autoComplete="off"
                      inputMode="numeric"
                      className="input"
                      maxLength={16}
                      pattern="\d{16}"
                      placeholder="16 digits"
                      required
                      value={card.number}
                      onChange={(e) => setCard({ ...card, number: e.target.value.replace(/\D/g, '').slice(0, 16) })}
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Expiry" htmlFor="card-expiry">
                      <input
                        id="card-expiry"
                        autoComplete="off"
                        className="input"
                        placeholder="MM/YY"
                        maxLength={5}
                        pattern="(0[1-9]|1[0-2])\/\d{2}"
                        required
                        value={card.expiry}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 4)
                          setCard({ ...card, expiry: value.length > 2 ? `${value.slice(0, 2)}/${value.slice(2)}` : value })
                        }}
                      />
                    </Field>
                    <Field label="CVC" htmlFor="card-cvc">
                      <input
                        id="card-cvc"
                        autoComplete="off"
                        inputMode="numeric"
                        className="input"
                        maxLength={3}
                        pattern="\d{3}"
                        placeholder="3 digits"
                        required
                        value={card.cvc}
                        onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, '').slice(0, 3) })}
                      />
                    </Field>
                  </div>
                </div>
              </div>
            ) : (
              <p className="rounded-[3px] border-2 border-ink/20 bg-cream p-3 text-sm text-ink/80">
                No payment is required for these tickets.
              </p>
            )}

            {error && <p role="alert" className="alert-danger">{error}</p>}
            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="button" className="btn btn-outline flex-1" onClick={() => setStep('attendees')}>
                Back to attendee details
              </button>
              <button type="submit" className="btn btn-accent flex-1" disabled={saving}>
                {saving
                  ? 'Processing…'
                  : isPaid
                    ? `Pay ${formatMoney(event.price * quantity)}`
                    : `Claim ${quantity} free ticket${quantity === 1 ? '' : 's'}`}
              </button>
            </div>
          </form>
        )}

        {step === 'complete' && (
          <section aria-labelledby="checkout-complete-heading">
            <div className="flex flex-wrap items-center gap-3">
              <h2 id="checkout-complete-heading" className="display text-3xl">You’re all set</h2>
              <span className="badge bg-leaf text-cream">Confirmed</span>
            </div>
            {result?.demo ? (
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Demo booking saved in this browser. No attendee email was sent because the API is offline.
              </p>
            ) : (
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Your booking is confirmed. The buyer receives one email with all ticket QR codes when email delivery is configured.
              </p>
            )}
            <ul className="mt-6 space-y-5">
              {tickets.map((ticket) => {
                const emailStatus = result?.receipt_emails?.find(
                  (receipt) => receipt.reference_code === ticket.reference_code,
                )
                return (
                  <li key={ticket.reference_code} className="ticket p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{ticket.attendee_name}</p>
                        <p className="mt-1 text-sm text-muted">{ticket.attendee_email}</p>
                      </div>
                      <span className="badge">Ticket</span>
                    </div>
                    <p className="mt-3 border-t border-dashed border-ink/20 pt-3 font-mono text-[11px] tracking-[0.04em]">
                      {ticket.reference_code}
                    </p>
                    <div className="mt-5">
                      <TicketQrCode value={ticket.reference_code} />
                    </div>
                    {emailStatus && (
                      <p className={`mt-3 text-xs ${emailStatus.sent ? 'text-leaf' : 'text-danger'}`}>
                        {emailStatus.sent ? 'Buyer confirmation email sent' : 'Email could not be sent; keep this ticket reference'}
                      </p>
                    )}
                  </li>
                )
              })}
            </ul>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a
                href={googleCalendarUrl(event)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline"
              >
                Add to Google Calendar
              </a>
              <Link to={`/events/${event.id}`} className="btn btn-dark">
                Return to event
              </Link>
            </div>
          </section>
        )}
      </section>
    </main>
  )
}

export default function TicketCheckoutPage() {
  const { id } = useParams()
  return <CheckoutFlow key={id} id={id} />
}
