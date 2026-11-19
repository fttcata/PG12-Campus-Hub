export default function TicketCounter({ available, total, value, onChange, max = 4, id = 'ticket-quantity' }) {
  const limit = Math.max(0, Math.min(max, available ?? max))

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <label htmlFor={id} className="text-sm font-medium">
          Tickets
        </label>
        <p className="mono-meta mt-0.5">
          {available == null ? 'Unlimited availability' : `${available} of ${total} remaining`}
        </p>
      </div>
      <select
        id={id}
        className="input w-20 py-2 text-center font-mono"
        value={value}
        disabled={limit === 0}
        onChange={(event) => onChange(Number(event.target.value))}
      >
        {Array.from({ length: limit }, (_, index) => index + 1).map((count) => (
          <option key={count} value={count}>
            {count}
          </option>
        ))}
      </select>
    </div>
  )
}
