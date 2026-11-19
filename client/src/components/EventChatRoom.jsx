import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useEventChat } from '../hooks/useEventChat.js'
import { useNow } from '../hooks/useNow.js'
import { getChatStatus } from '../utils/format.js'

export default function EventChatRoom({ event }) {
  const { user } = useAuth()
  const location = useLocation()
  const now = useNow()
  const [messageText, setMessageText] = useState('')
  const [chatExpanded, setChatExpanded] = useState(false)

  const chat = getChatStatus(event.date, now)
  const isOpen = chat.state === 'open'
  const { messages, loading, error, canChat, sending, sendMessage } = useEventChat(event.id, {
    enabled: isOpen && Boolean(user),
  })

  async function handleSubmit(submitEvent) {
    submitEvent.preventDefault()
    const content = messageText.trim()
    if (!content || sending) return

    try {
      await sendMessage(content)
      setMessageText('')
    } catch {
      // useEventChat surfaces the failure through `error`.
    }
  }

  return (
    <section className="panel mt-10">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink/15 pb-4">
        <h2 className="eyebrow">Event chat</h2>
        <div className="flex items-center gap-2">
          <span className="badge">{chat.label}</span>
          {isOpen && (
            <button
              type="button"
              className="btn btn-accent px-3 py-2"
              onClick={() => setChatExpanded((expanded) => !expanded)}
              aria-expanded={chatExpanded}
            >
              {chatExpanded ? 'Close chat' : 'Open chat'}
            </button>
          )}
        </div>
      </div>
      {isOpen && !user && (
        <p className="mt-4 text-sm text-muted">
          Chat is open to ticket holders and donors.{' '}
          <Link to="/login" state={{ from: location.pathname }} className="btn btn-accent mt-2 inline-flex">
            Log in to chat
          </Link>
        </p>
      )}
      {isOpen && user && chatExpanded && error && <p className="mt-3 text-sm text-danger">{error}</p>}
      {isOpen && user && chatExpanded && (
        <>
          <div className="mt-2">
            {messages.length ? messages.map((message) => (
              <div key={message.id} className="border-b border-ink/10 py-3 text-sm">
                <p className="mb-1 font-mono text-[10px] tracking-[0.08em] text-tomato-deep uppercase">
                  {message.user_id === user.id ? 'You' : message.user_name || 'Student'}
                </p>
                <p className="whitespace-pre-wrap break-words">{message.content}</p>
              </div>
            )) : null}
            {!loading && messages.length === 0 && !error && (
              <p className="py-3 text-sm text-muted">No messages yet.</p>
            )}
          </div>
          {canChat && (
            <form onSubmit={handleSubmit} className="mt-4">
              <label className="sr-only" htmlFor="event-chat-room-message">Write a message</label>
              <div className="flex items-end gap-2">
                <textarea
                  id="event-chat-room-message"
                  className="input max-h-24 min-h-11 flex-1 resize-y"
                  rows={1}
                  maxLength={1000}
                  placeholder="Message this event group…"
                  value={messageText}
                  onChange={(changeEvent) => setMessageText(changeEvent.target.value)}
                  disabled={sending}
                />
                <button
                  type="submit"
                  className="btn btn-accent shrink-0 px-3 py-2.5"
                  disabled={!messageText.trim() || sending}
                >
                  {sending ? 'Sending…' : 'Send'}
                </button>
              </div>
              <p className="mt-2 font-mono text-[10px] tracking-[0.06em] text-muted uppercase">
                Messages are visible to this event’s ticket holders and donors.
              </p>
            </form>
          )}
        </>
      )}
    </section>
  )
}
