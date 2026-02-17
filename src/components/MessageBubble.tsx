import type { ChatMessage } from '../types'
import { AgentAvatar } from './AgentAvatar'
import { formatRelativeTime } from '../utils/time'
import { renderContent } from '../utils/sanitize'

interface MessageBubbleProps {
  message: ChatMessage
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isVisitor = message.sender_type === 'visitor' || message.sender_type === 'user'
  const isSystem = message.sender_type === 'system'

  if (isSystem) {
    return (
      <div className="acx-flex acx-justify-center acx-py-2">
        <span className="acx-text-xs acx-text-gray-400 acx-italic">
          {message.content}
        </span>
      </div>
    )
  }

  return (
    <div className={`acx-flex acx-gap-2 acx-mb-3 ${isVisitor ? 'acx-justify-end' : 'acx-justify-start'}`}>
      {!isVisitor && (
        <AgentAvatar name={message.sender_name} />
      )}

      <div className={`acx-max-w-[75%] ${isVisitor ? 'acx-order-1' : ''}`}>
        {!isVisitor && message.sender_name && (
          <span className="acx-text-xs acx-text-gray-500 acx-ml-1 acx-mb-0.5 acx-block">
            {message.sender_name}
          </span>
        )}

        <div
          className={`acx-px-3.5 acx-py-2.5 acx-rounded-2xl acx-text-sm acx-leading-relaxed ${
            isVisitor
              ? 'acx-bg-primary-600 acx-text-white acx-rounded-br-md'
              : message.sender_type === 'bot'
                ? 'acx-bg-gray-100 acx-text-gray-800 acx-rounded-bl-md'
                : 'acx-bg-gray-100 acx-text-gray-800 acx-rounded-bl-md'
          }`}
        >
          {message.content_type === 'markdown' ? (
            <div
              className="acx-prose acx-prose-sm"
              dangerouslySetInnerHTML={{ __html: renderContent(message.content) }}
            />
          ) : (
            <p className="acx-whitespace-pre-wrap">{message.content}</p>
          )}
        </div>

        {message.attachments?.length > 0 && (
          <div className="acx-mt-1 acx-space-y-1">
            {message.attachments.map((att, i) => (
              <a
                key={i}
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className="acx-block acx-text-xs acx-text-primary-600 hover:acx-underline acx-truncate"
              >
                {att.name}
              </a>
            ))}
          </div>
        )}

        <div className={`acx-flex acx-items-center acx-gap-1 acx-mt-0.5 ${isVisitor ? 'acx-justify-end' : ''}`}>
          <span className="acx-text-[10px] acx-text-gray-400">
            {formatRelativeTime(message.created_at)}
          </span>
          {isVisitor && message.status === 'sending' && (
            <span className="acx-text-[10px] acx-text-gray-400">Sending...</span>
          )}
          {isVisitor && message.status === 'failed' && (
            <span className="acx-text-[10px] acx-text-red-500">Failed</span>
          )}
        </div>
      </div>
    </div>
  )
}
