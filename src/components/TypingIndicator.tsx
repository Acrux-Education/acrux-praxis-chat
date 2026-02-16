import { AgentAvatar } from './AgentAvatar'

interface TypingIndicatorProps {
  agentName?: string
}

export function TypingIndicator({ agentName }: TypingIndicatorProps) {
  return (
    <div className="acx-flex acx-items-center acx-gap-2 acx-mb-3">
      <AgentAvatar name={agentName ?? 'Agent'} />
      <div className="acx-bg-gray-100 acx-rounded-2xl acx-rounded-bl-md acx-px-4 acx-py-3">
        <div className="acx-flex acx-gap-1">
          <span className="acx-w-1.5 acx-h-1.5 acx-bg-gray-400 acx-rounded-full acx-typing-dot" />
          <span className="acx-w-1.5 acx-h-1.5 acx-bg-gray-400 acx-rounded-full acx-typing-dot" />
          <span className="acx-w-1.5 acx-h-1.5 acx-bg-gray-400 acx-rounded-full acx-typing-dot" />
        </div>
      </div>
    </div>
  )
}
