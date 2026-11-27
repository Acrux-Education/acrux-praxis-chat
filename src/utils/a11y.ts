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

/**
 * Text for the chat's polite live region when the message list changes from
 * `prev` to `next`, or null when nothing should be announced.
 *
 * Announces only a single message appended by someone else (ADD_MESSAGE from
 * the socket) and the person's own message failing to send. History loads
 * (SET_MESSAGES replaces the array), the person's own sends and send
 * acknowledgements stay silent, so a screen reader is not flooded.
 */
export function chatAnnouncement(prev: readonly ChatMessage[], next: readonly ChatMessage[]): string | null {
  if (next.length === prev.length + 1 && prev.every((message, i) => next[i] === message)) {
    const added = next[next.length - 1]!
    if (isOwnMessage(added)) return null
    if (added.sender_type === 'system' && added.content_type !== 'auto_response') {
      return added.content
    }
    return added.sender_name ? `${added.sender_name}: ${added.content}` : added.content
  }

  if (next.length === prev.length) {
    const failed = next.some(
      (message, i) => isOwnMessage(message) && message.status === 'failed' && prev[i]?.status !== 'failed'
    )
    if (failed) return 'Message failed to send'
  }

  return null
}
