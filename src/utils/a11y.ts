import type { ChatMessage } from '../types'

/**
 * Index of the tab to move to for an arrow/Home/End key press in a tablist
 * (WAI-ARIA tabs pattern, wrapping), or null when the key is not a tab key.
 */
export function nextTabIndex(key: string, current: number, count: number): number | null {
  if (count <= 0) return null
  switch (key) {
    case 'ArrowRight':
      return (current + 1) % count
    case 'ArrowLeft':
      return (current - 1 + count) % count
    case 'Home':
      return 0
    case 'End':
      return count - 1
    default:
      return null
  }
}

function isOwnMessage(message: ChatMessage): boolean {
  return message.sender_type === 'visitor' || message.sender_type === 'user'
}

function spoken(message: ChatMessage): string {
  if (message.sender_type === 'system' && message.content_type !== 'auto_response') {
    return message.content
  }
  return message.sender_name ? `${message.sender_name}: ${message.content}` : message.content
}

/**
 * Text for the chat's polite live region when the message list changes from
 * `prev` to `next`, or null when nothing should be announced.
 *
 * Announces every message from someone else whose id was not on screen
 * before (including several landing in one render, or replies missed during
 * a reconnect), and the person's own message failing to send. The first
 * load into an empty list, the person's own sends and send acknowledgements
 * stay silent, so a screen reader is not flooded.
 */
export function chatAnnouncement(prev: readonly ChatMessage[], next: readonly ChatMessage[]): string | null {
  if (prev.length === 0) return null

  const before = new Map(prev.map((message) => [message.id, message]))
  const parts: string[] = []

  if (next.some((message) =>
    isOwnMessage(message) && message.status === 'failed' && before.get(message.id)?.status !== 'failed'
  )) {
    parts.push('Message failed to send')
  }

  for (const message of next) {
    if (!isOwnMessage(message) && !before.has(message.id)) parts.push(spoken(message))
  }

  return parts.length > 0 ? parts.join('. ') : null
}
