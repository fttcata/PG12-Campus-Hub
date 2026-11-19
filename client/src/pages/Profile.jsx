import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { fetchMyTickets } from '../api/events.js'
import TicketQrCode from '../components/TicketQrCode.jsx'
import { formatDateTime, formatMoney } from '../utils/format.js'

export default function Profile() {
  const { user, logout } = useAuth()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    fetchMyTickets()
      .then((result) => {
        if (active) setTickets(result)
      })
      .catch((requestError) => {
        if (active) setError(requestError.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Account</p>
          <h1 className="display mt-4 text-5xl sm:text-6xl">
            Your profile<span className="text-tomato">.</span>
          </h1>
          <p className="mt-3 font-mono text-[11px] tracking-[0.06em] text-muted uppercase">
            {user?.email || 'Signed in'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/dashboard" className="btn btn-dark">Dashboard</Link>
          <button type="button" className="btn btn-outline" onClick={logout}>
            Log out
          </button>
        </div>
      </div>

      <dl className="paper mt-8 grid gap-5 p-5 sm:grid-cols-3">
        <div>
          <dt className="mono-meta">Name</dt>
          <dd className="mt-1.5 font-medium">{user?.name || 'N/A'}</dd>
        </div>
        <div>
          <dt className="mono-meta">Email</dt>
          <dd className="mt-1.5 break-all font-medium">{user?.email || 'N/A'}</dd>
        </div>
        <div>
          <dt className="mono-meta">Role</dt>
          <dd className="mt-1.5">
            <span className="badge">{user?.role || 'student'}</span>
          </dd>
        </div>
      </dl>

      <section className="mt-12" aria-labelledby="profile-tickets-heading">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">Tickets</p>
            <h2 id="profile-tickets-heading" className="display mt-2 text-4xl">Your ticket wallet</h2>
          </div>
          <span className="badge">{tickets.length} ticket{tickets.length === 1 ? '' : 's'}</span>
        </div>

        {loading && (
          <p className="mt-6 font-mono text-[11px] tracking-[0.08em] text-muted uppercase">Loading tickets…</p>
        )}

        {error && <p role="alert" className="alert-danger mt-6">{error}</p>}

        {!loading && !error && tickets.length === 0 && (
          <div className="mt-6 rounded-[3px] border-2 border-dashed border-ink/20 bg-card px-6 py-12 text-center">
            <span aria-hidden="true" className="font-mono text-2xl leading-none text-tomato">✳</span>
            <p className="mt-4 text-muted">No tickets acquired yet.</p>
            <Link to="/events" className="btn btn-dark mt-5 inline-flex">Browse events</Link>
          </div>
        )}

        <ul className="mt-6 space-y-6">
          {tickets.map((ticket) => {
            const confirmed = ticket.status === 'confirmed'
            return (
              <li key={ticket.id} className="ticket p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-[10px] tracking-[0.06em] text-muted uppercase">
                      {formatDateTime(ticket.event.date)}
                    </p>
                    <h3 className="display mt-2 text-2xl">
                      <Link
                        to={`/events/${ticket.event.id}`}
                        className="underline decoration-ink/20 underline-offset-4 transition-colors hover:text-tomato-deep hover:decoration-tomato-deep"
                      >
                        {ticket.event.title}
                      </Link>
                    </h3>
                    <p className="mt-1 text-sm text-muted">{ticket.event.location}</p>
                  </div>
                  <span className={`badge ${confirmed ? 'bg-leaf text-cream' : 'bg-tomato text-ink'}`}>
                    {ticket.status}
                  </span>
                </div>

                <div className="perforation" aria-hidden="true" />

                <dl className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="mono-meta">Attendee</dt>
                    <dd className="mt-1 text-sm font-medium">{ticket.attendee_name}</dd>
                    <dd className="text-sm text-muted">{ticket.attendee_email}</dd>
                  </div>
                  <div>
                    <dt className="mono-meta">Reference</dt>
                    <dd className="mt-1 break-all font-mono text-[11px]">{ticket.reference_code}</dd>
                  </div>
                  <div>
                    <dt className="mono-meta">Price paid</dt>
                    <dd className="mt-1 text-sm font-medium">{formatMoney(ticket.amount_paid)}</dd>
                  </div>
                </dl>

                {confirmed && (
                  <div className="mt-5">
                    <TicketQrCode value={ticket.reference_code} />
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </section>
    </main>
  )
}
