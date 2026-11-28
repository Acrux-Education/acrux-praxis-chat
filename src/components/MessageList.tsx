import { useEffect, useRef } from 'react'
import type { ChatMessage } from '../types'
import { MessageBubble } from './MessageBubble'
import { TypingIndicator } from './TypingIndicator'
import { formatDateSeparator, isSameDay } from '../utils/time'

interface MessageListProps {
  messages: ChatMessage[]
  agentTyping: { is_typing: boolean; agent_name?: string }
}

export function MessageList({ messages, agentTyping }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, agentTyping.is_typing])

  return (
    <div
      ref={containerRef}
      className="acx:flex-1 acx:overflow-y-auto acx:px-4 acx:py-3 acx:space-y-1"
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
  )
}
