import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Field from '../components/Field.jsx'
import MapEmbed from '../components/MapEmbed.jsx'
import { useActivity } from '../context/ActivityContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { toDateTimeInput } from '../utils/format.js'
import { validateEventForm } from '../utils/validation.js'
import { createEvent, fetchEvent, updateEvent } from '../api/events.js'

const CATEGORIES = ['Technology', 'Social', 'Career', 'Sports', 'Arts', 'Charity']

const EMPTY_FORM = {
  type: 'event',
  title: '',
  description: '',
  category: 'Social',
  date: '',
  endDate: '',
  location: '',
  capacity: '50',
  price: '0',
  goal: '5000',
}

function toForm(event) {
  return {
    type: event.type,
    title: event.title,
    description: event.description,
    category: event.category,
    date: toDateTimeInput(event.date),
    endDate: event.endDate ? toDateTimeInput(event.endDate) : '',
    location: event.location,
    capacity: String(event.capacity),
    price: String(event.price),
    goal: String(event.goal),
  }
}

function EventForm({ existing, persisted = false }) {
  const { saveEvent } = useActivity()
  const navigate = useNavigate()
  const [form, setForm] = useState(() => (existing ? toForm(existing) : EMPTY_FORM))
  const [errors, setErrors] = useState({})
  // The map only refreshes when the venue field loses focus, not on every keystroke.
  const [mapQuery, setMapQuery] = useState(existing?.location ?? '')

  const isFundraiser = form.type === 'fundraiser'

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
    // Hide a field's error as soon as the user starts fixing it.
    setErrors({ ...errors, [e.target.name]: '' })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const nextErrors = validateEventForm(form, existing?.booked ?? 0)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const startTime = new Date(form.date).getTime()
    const endTime = new Date(form.endDate).getTime()
    if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) {
      setErrors({ ...nextErrors, ...(!Number.isFinite(startTime) ? { date: 'Enter a valid start date and time.' } : {}), ...(!Number.isFinite(endTime) ? { endDate: 'Enter a valid end date and time.' } : {}) })
      return
    }

    const eventStart = new Date(startTime)
    const eventData = {
      ...(existing && { id: existing.id }),
      type: form.type,
      title: form.title.trim(),
      description: form.description.trim(),
      category: isFundraiser ? 'Charity' : form.category,
      date: new Date(form.date).toISOString(),
      endDate: new Date(form.endDate).toISOString(),
      deadline: new Date(eventStart.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      location: form.location.trim(),
      capacity: isFundraiser ? 0 : Number(form.capacity),
      price: isFundraiser ? 0 : Number(form.price),
      goal: isFundraiser ? Number(form.goal) : 0,
    }
    if (!existing) {
      try {
        const response = await createEvent({
          ...eventData,
          event_type: form.type === 'fundraiser' ? 'fundraiser' : 'standard',
          end_date: eventData.endDate,
          total_tickets: eventData.capacity,
          fundraiser_goal: eventData.goal,
        })
        navigate(`/events/${response.event.id}`)
      } catch (requestError) {
        setErrors({ form: requestError.message })
      }
      return
    }
    if (persisted) {
      try {
        const saved = await updateEvent(existing.id, eventData)
        navigate(`/events/${saved.id}`)
      } catch (requestError) {
        setErrors({ form: requestError.message })
      }
      return
    }

    const saved = saveEvent({ ...eventData, id: existing.id })
    navigate(`/events/${saved.id}`)
  }

  const inputClass = (name) => `input ${errors[name] ? 'input-error' : ''}`

  return (
    <form className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px]" onSubmit={handleSubmit} noValidate>
      <div className="space-y-8">
        {/* Event kind: standard (free/paid tickets) vs fundraiser (pledges toward a goal) */}
        <fieldset>
          <legend className="eyebrow mb-3">What are you organising?</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ['event', 'Standard event', 'Free or paid tickets with a seat limit.'],
              ['fundraiser', 'Fundraiser', 'Collect pledges toward a target amount.'],
            ].map(([value, label, text]) => (
              <label
                key={value}
                className={`cursor-pointer rounded-[3px] border-2 p-4 transition-[transform,box-shadow,background-color,border-color] duration-200 focus-within:ring-2 focus-within:ring-tomato-deep focus-within:ring-offset-2 focus-within:ring-offset-paper ${
                  form.type === value
                    ? 'border-ink bg-cream shadow-[4px_4px_0_rgba(21,21,21,.16)]'
                    : 'border-ink/15 bg-card hover:-translate-y-0.5 hover:border-ink/40'
                }`}
              >
                <input
                  type="radio"
                  name="type"
                  value={value}
                  checked={form.type === value}
                  onChange={handleChange}
                  className="sr-only"
                />
                <span className="flex items-center gap-2 font-semibold">
                  <span
                    aria-hidden="true"
                    className={`size-2.5 rounded-[1px] border border-ink ${
                      form.type === value ? 'bg-tomato' : 'bg-transparent'
                    }`}
                  />
                  {label}
                </span>
                <span className="mt-1.5 block text-sm text-muted">{text}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <section className="space-y-6 border-t-2 border-dashed border-ink/15 pt-6" aria-labelledby="basics-heading">
          <h2 id="basics-heading" className="eyebrow">01 / The basics</h2>
          <Field label="Title" htmlFor="title" error={errors.title}>
            <input id="title" name="title" className={inputClass('title')} value={form.title} onChange={handleChange} />
          </Field>

          <Field label="Description" htmlFor="description" error={errors.description}>
            <textarea
              id="description"
              name="description"
              rows={5}
              className={inputClass('description')}
              value={form.description}
              onChange={handleChange}
            />
          </Field>
        </section>

        <section className="space-y-6 border-t-2 border-dashed border-ink/15 pt-6" aria-labelledby="schedule-heading">
          <h2 id="schedule-heading" className="eyebrow">02 / Schedule</h2>
          <Field label="Starts" htmlFor="date" error={errors.date}>
            <input
              id="date"
              name="date"
              type="datetime-local"
              className={inputClass('date')}
              value={form.date}
              onChange={handleChange}
            />
          </Field>

          <Field label="Ends" htmlFor="endDate" error={errors.endDate}>
            <input
              id="endDate"
              name="endDate"
              type="datetime-local"
              className={inputClass('endDate')}
              value={form.endDate}
              onChange={handleChange}
            />
          </Field>
        </section>

        <section className="space-y-6 border-t-2 border-dashed border-ink/15 pt-6" aria-labelledby="tickets-heading">
          <h2 id="tickets-heading" className="eyebrow">{isFundraiser ? '03 / Fundraising goal' : '03 / Tickets'}</h2>
          {isFundraiser ? (
            <Field label="Fundraising goal (HK$)" htmlFor="goal" error={errors.goal}>
              <input
                id="goal"
                name="goal"
                type="number"
                min="100"
                className={inputClass('goal')}
                value={form.goal}
                onChange={handleChange}
              />
            </Field>
          ) : (
            <div className="grid gap-6 sm:grid-cols-3">
              <Field label="Category" htmlFor="category">
                <select id="category" name="category" className="input" value={form.category} onChange={handleChange}>
                  {CATEGORIES.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </Field>
              <Field label="Capacity" htmlFor="capacity" error={errors.capacity}>
                <input
                  id="capacity"
                  name="capacity"
                  type="number"
                  min="1"
                  className={inputClass('capacity')}
                  value={form.capacity}
                  onChange={handleChange}
                />
              </Field>
              <Field label="Ticket price (HK$)" htmlFor="price" error={errors.price} hint="0 = free event">
                <input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  className={inputClass('price')}
                  value={form.price}
                  onChange={handleChange}
                />
              </Field>
            </div>
          )}
        </section>
      </div>

      <aside className="self-start lg:sticky lg:top-24">
        <div className="paper space-y-5 p-5">
          <div>
            <p className="eyebrow">Venue & publish</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Type the address, then click away to pin it on the map.
            </p>
          </div>
          <Field label="Venue" htmlFor="location" error={errors.location}>
            <input
              id="location"
              name="location"
              className={inputClass('location')}
              placeholder="e.g. Run Run Shaw Tower, HKU"
              value={form.location}
              onChange={handleChange}
              onBlur={() => setMapQuery(form.location.trim())}
            />
          </Field>
          {mapQuery ? (
            <MapEmbed query={mapQuery} className="h-64" />
          ) : (
            <div className="grid h-64 place-items-center rounded-[3px] border-2 border-dashed border-ink/25 bg-cream/60 px-6 text-center font-mono text-[10px] leading-relaxed tracking-[0.08em] text-muted uppercase">
              Map preview appears here
            </div>
          )}
          <p className="border-t border-dashed border-ink/15 pt-4 text-xs leading-relaxed text-muted">
            We take a 5% fee on proceeds from tickets sold through our website. This does not apply to fundraisers.
          </p>
          <button type="submit" className="btn btn-dark w-full">
            {existing ? 'Save changes' : 'Publish event'}
          </button>
          {Object.values(errors).some(Boolean) && (
            <p role="alert" className="alert-danger text-center">{errors.form || 'Please fix the highlighted fields.'}</p>
          )}
        </div>
      </aside>
    </form>
  )
}

// Used for both /events/new and /events/:id/edit.
export default function CreateEventPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const { createdEvents } = useActivity()

  const localExisting = id ? createdEvents.find((event) => event.id === id) : null
  const [remoteResult, setRemoteResult] = useState(null)
  const currentRemoteResult = remoteResult?.id === id ? remoteResult : null
  const remoteExisting = currentRemoteResult?.event ?? null
  const loadingExisting = Boolean(id && !localExisting && !currentRemoteResult)
  const loadError = currentRemoteResult?.error?.message ?? ''

  useEffect(() => {
    if (!id || localExisting) return

    let active = true
    fetchEvent(id)
      .then((event) => {
        if (active) setRemoteResult({ id, event })
      })
      .catch((requestError) => {
        if (active) setRemoteResult({ id, error: requestError })
      })

    return () => {
      active = false
    }
  }, [id, localExisting])

  const existing = localExisting ?? remoteExisting
  const persisted = Boolean(remoteExisting)
  const canEdit =
    !id ||
    (existing && (user.role === 'admin' || (existing.organizerEmail && existing.organizerEmail === user.email)))

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <p className="eyebrow">{id ? 'Manage listing' : 'New listing'}</p>
      <h1 className="display mt-4 text-5xl md:text-6xl">{id ? 'Edit event' : 'Create an event'}</h1>
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">
        {id ? 'Update the details, then save it back to the wall.' : 'Write it up, pin a venue, and put it in front of students across Hong Kong.'}
      </p>

      {loadingExisting ? (
        <p className="mt-10 font-mono text-[11px] tracking-[0.08em] text-muted uppercase">Loading event…</p>
      ) : loadError ? (
        <div role="alert" className="alert-danger mt-10">
          <p>{loadError}</p>
          <Link to={user.role === 'admin' ? '/admin/events' : '/dashboard?tab=events'} className="btn btn-dark mt-4">
            Back
          </Link>
        </div>
      ) : canEdit ? (
        // `key` gives the form fresh state when switching between "new" and "edit".
        <EventForm key={id ?? 'new'} existing={existing} persisted={persisted} />
      ) : (
        <div className="paper mt-10 p-5">
          <p>{user.role === 'admin' ? 'This event could not be loaded.' : 'You can only edit events you created.'}</p>
          <Link to="/dashboard?tab=events" className="btn btn-dark mt-4 inline-flex">
            Back to my events
          </Link>
        </div>
      )}
    </main>
  )
}
