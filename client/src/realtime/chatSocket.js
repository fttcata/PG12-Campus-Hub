import { io } from 'socket.io-client'

let socket = null
let currentToken = ''

export function getChatSocket(token) {
  if (!token) return null

  if (!socket) {
    socket = io({
      autoConnect: false,
      path: '/socket.io',
      transports: ['websocket', 'polling'],
    })
    socket.on('connect_error', (error) => {
      if (/authentication required|invalid or expired token|user no longer exists/i.test(error.message)) {
        window.dispatchEvent(new Event('campushub:session-expired'))
      }
    })
  }

  if (currentToken !== token) {
    currentToken = token
    socket.auth = { token }
    if (socket.connected) socket.disconnect()
  }

  if (!socket.connected) socket.connect()
  return socket
}

export function disconnectChatSocket() {
  if (socket) socket.disconnect()
  socket = null
  currentToken = ''
}
