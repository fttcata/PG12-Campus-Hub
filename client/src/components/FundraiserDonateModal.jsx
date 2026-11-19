import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { apiPost } from '../api/client.js'
import { formatMoney } from '../utils/format.js'

export default function FundraiserDonateModal({ event, onClose, onSuccess }) {
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const onKeyDown = (keyEvent) => {
      if (keyEvent.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  async function submit(eventObject) {
    eventObject.preventDefault()
    try {
      const result = await apiPost(`/events/${event.id}/donate`, { amount: Number(amount) })
      onSuccess(result)
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-ink/60 p-3 backdrop-blur-[2px] sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="donate-heading"
      onMouseDown={(mouseEvent) => {
        if (mouseEvent.target === mouseEvent.currentTarget) onClose()
      }}
    >
      <form
        className="ticket my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-md space-y-4 overflow-y-auto p-6 sm:max-h-[calc(100dvh-2rem)]"
        onSubmit={submit}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="donate-heading" className="display text-3xl">
            Support {event.title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-9 shrink-0 place-items-center rounded-full border-2 border-ink bg-card text-xl leading-none transition-colors hover:bg-ink hover:text-cream"
          >
            ×
          </button>
        </div>
        <p className="text-sm leading-relaxed text-muted">{event.cause || event.description}</p>
        <label className="block">
          <span className="mono-meta">Pledge amount (HK$)</span>
          <input
            className="input mt-1"
            type="number"
            min="1"
            step="0.01"
            placeholder="e.g. 150"
            value={amount}
            onChange={(changeEvent) => setAmount(changeEvent.target.value)}
            required
            autoFocus
          />
        </label>
        {error && (
          <p role="alert" className="rounded-[3px] border-2 border-danger bg-[#fbeae7] p-2 text-sm text-danger">
            {error}
          </p>
        )}
        <button className="btn btn-accent w-full">Donate {amount ? formatMoney(amount) : ''}</button>
      </form>
    </div>,
    document.body,
  )
}
