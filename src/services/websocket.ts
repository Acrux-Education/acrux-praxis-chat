import type { WSIncomingMessage, WSOutgoingMessage } from '../types'
import { TIMEOUTS } from '../constants'

type MessageHandler = (message: WSIncomingMessage) => void
type StatusHandler = (connected: boolean, retryCount: number) => void

interface ChatWebSocketConfig {
  url: string
  token?: string
  onMessage: MessageHandler
  onStatusChange: StatusHandler
}

const KNOWN_WS_TYPES: WSIncomingMessage['type'][] = [
  'history',
  'message',
  'message_ack',
  'agent_joined',
  'agent_typing',
  'heartbeat_ack',
  'error',
]

function isValidWSMessage(data: unknown): data is WSIncomingMessage {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as Record<string, unknown>).type === 'string' &&
    KNOWN_WS_TYPES.includes((data as Record<string, unknown>).type as WSIncomingMessage['type'])
  )
}

export class ChatWebSocket {
  private ws: WebSocket | null = null
  private url: string
  private token?: string
  private onMessage: MessageHandler
  private onStatusChange: StatusHandler
  private retryCount = 0
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null
  private messageQueue: WSOutgoingMessage[] = []
  private intentionallyClosed = false

  constructor(config: ChatWebSocketConfig) {
    this.url = config.url
    this.token = config.token
    this.onMessage = config.onMessage
    this.onStatusChange = config.onStatusChange
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return

    this.intentionallyClosed = false

    try {
      const protocols = this.token
        ? ['acrux-chat', `acrux-chat-token.${this.token}`]
        : ['acrux-chat']
      this.ws = new WebSocket(this.url, protocols)
    } catch {
      this.scheduleReconnect()
      return
    }

    this.ws.onopen = () => {
      this.retryCount = 0
      this.onStatusChange(true, 0)
      this.startHeartbeat()
      this.flushQueue()
    }

    this.ws.onclose = () => {
      this.onStatusChange(false, this.retryCount)
      this.stopHeartbeat()
      if (!this.intentionallyClosed) {
        this.scheduleReconnect()
      }
    }

    this.ws.onerror = () => {
      // onclose will fire after onerror
    }

    this.ws.onmessage = (event) => {
      try {
        const data: unknown = JSON.parse(event.data)
        if (isValidWSMessage(data)) {
          this.onMessage(data)
        }
        // Silently ignore messages with unknown type (consistent with malformed-JSON catch below)
      } catch {
        // Ignore malformed messages
      }
    }
  }

  send(message: WSOutgoingMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      this.messageQueue.push(message)
    }
  }

  disconnect(): void {
    this.intentionallyClosed = true
    this.stopHeartbeat()
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  private flushQueue(): void {
    while (this.messageQueue.length > 0) {
      const msg = this.messageQueue.shift()
      if (msg) this.send(msg)
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return

    const delay = Math.min(
      TIMEOUTS.WS_RECONNECT_BASE * Math.pow(2, this.retryCount),
      TIMEOUTS.WS_RECONNECT_MAX
    )

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.retryCount++
      this.connect()
    }, delay)
  }

  private startHeartbeat(): void {
    this.stopHeartbeat()
    this.heartbeatTimer = setInterval(() => {
      this.send({ type: 'heartbeat' })
    }, TIMEOUTS.WS_HEARTBEAT_INTERVAL)
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }
}
