import { useEffect, useRef, useState } from 'react'
import type { ChatMessage } from '../types'
import { MessageBubble } from './MessageBubble'
import { TypingIndicator } from './TypingIndicator'
import { formatDateSeparator, isSameDay } from '../utils/time'
import { chatAnnouncement } from '../utils/a11y'

interface MessageListProps {
  messages: ChatMessage[]
  agentTyping: { is_typing: boolean; agent_name?: string }
}

export function MessageList({ messages, agentTyping }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  // What the list held at the previous render, so only a newly arrived reply
  // (not the history already on screen) reaches the live region.
  const prevMessagesRef = useRef(messages)
  // The count keys the text node, so the same words twice are read twice.
  const [announcement, setAnnouncement] = useState({ text: '', count: 0 })

  useEffect(() => {
    const text = chatAnnouncement(prevMessagesRef.current, messages)
    prevMessagesRef.current = messages
    if (text) setAnnouncement((prev) => ({ text, count: prev.count + 1 }))
  }, [messages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, agentTyping.is_typing])

  return (
    <>
    {/* Polite announcements of replies; the log itself stays silent so
        history loads and the person's own messages are not read out. */}
    <div className="acx:sr-only" aria-live="polite" aria-atomic="true">
      <span key={announcement.count}>{announcement.text}</span>
    </div>
    <div
      ref={containerRef}
      className="acx:flex-1 acx:overflow-y-auto acx:px-4 acx:py-3 acx:space-y-1"
      role="log"
      aria-live="off"
      aria-label="Conversation"
    >
      {messages.map((message, index) => {
        const prevMessage = messages[index - 1]
        const showDateSeparator = !prevMessage || !isSameDay(prevMessage.created_at, message.created_at)

        return (
          <div key={message.temp_id ?? message.id}>
            {showDateSeparator && (
              <div className="acx:flex acx:items-center acx:justify-center acx:py-3">
                <span className="acx:text-xs acx:text-gray-400 acx:bg-gray-50 acx:px-3 acx:py-1 acx:rounded-full">
                  {formatDateSeparator(message.created_at)}
                </span>
              </div>
            )}
            <MessageBubble message={message} />
          </div>
        )
      })}

      {agentTyping.is_typing && (
        <TypingIndicator agentName={agentTyping.agent_name} />
      )}

      <div ref={bottomRef} />
    </div>
    </>
  )
}
