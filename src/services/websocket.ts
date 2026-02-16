import type { WSIncomingMessage, WSOutgoingMessage } from '../types'
import { TIMEOUTS } from '../constants'

type MessageHandler = (message: WSIncomingMessage) => void
type StatusHandler = (connected: boolean) => void

interface ChatWebSocketConfig {
  url: string
  onMessage: MessageHandler
  onStatusChange: StatusHandler
}

export class ChatWebSocket {
  private ws: WebSocket | null = null
  private url: string
  private onMessage: MessageHandler
  private onStatusChange: StatusHandler
  private retryCount = 0
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null
  private messageQueue: WSOutgoingMessage[] = []
  private intentionallyClosed = false

  constructor(config: ChatWebSocketConfig) {
    this.url = config.url
    this.onMessage = config.onMessage
    this.onStatusChange = config.onStatusChange
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return

    this.intentionallyClosed = false

    try {
      this.ws = new WebSocket(this.url)
    } catch {
      this.scheduleReconnect()
      return
    }

    this.ws.onopen = () => {
      this.retryCount = 0
      this.onStatusChange(true)
      this.startHeartbeat()
      this.flushQueue()
    }

    this.ws.onclose = () => {
      this.onStatusChange(false)
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
        const data = JSON.parse(event.data) as WSIncomingMessage
        this.onMessage(data)
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
