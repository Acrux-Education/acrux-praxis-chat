import type { WidgetPosition } from './types'
import { useChatContext } from './context/ChatContext'
import { Badge } from './components/Badge'
import { ChatBubbleIcon, CloseIcon } from './icons'

interface ChatLauncherProps {
  isOpen: boolean
  onClick: () => void
  position: WidgetPosition
}

export function ChatLauncher({ isOpen, onClick, position }: ChatLauncherProps) {
  const { state } = useChatContext()

  const positionClasses = position === 'bottom-right'
    ? 'acx-right-4 sm:acx-right-6'
    : 'acx-left-4 sm:acx-left-6'

  return (
    <div className={`acx-fixed acx-bottom-4 sm:acx-bottom-6 ${positionClasses} acx-z-[9999]`}>
      <button
        onClick={onClick}
        className="acx-relative acx-w-14 acx-h-14 acx-rounded-full acx-bg-white acx-text-primary-700 acx-shadow-lg acx-border acx-border-gray-200 hover:acx-bg-gray-50 acx-transition-all hover:acx-scale-105 acx-flex acx-items-center acx-justify-center"
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? (
          <CloseIcon className="acx-w-6 acx-h-6" />
        ) : (
          <>
            <ChatBubbleIcon className="acx-w-7 acx-h-7" />
            {state.unreadCount > 0 && (
              <Badge count={state.unreadCount} />
            )}
          </>
        )}
      </button>
    </div>
  )
}
