import type { WidgetPosition } from './types'
import { useChatContext } from './context/ChatContext'
import { Badge } from './components/Badge'
import { ChatBubbleFilledIcon, CloseIcon } from './icons'

interface ChatLauncherProps {
  isOpen: boolean
  onClick: () => void
  position: WidgetPosition
}

export function ChatLauncher({ isOpen, onClick, position }: ChatLauncherProps) {
  const { state } = useChatContext()

  const positionClasses = position === 'bottom-right'
    ? 'acx:right-4 acx:sm:right-6'
    : 'acx:left-4 acx:sm:left-6'

  return (
    <div className={`acx:fixed acx:bottom-4 acx:sm:bottom-6 ${positionClasses} acx:z-[9999]`}>
      <button
        onClick={onClick}
        className="acx-launcher-btn acx:relative acx:w-14 acx:h-14 acx:rounded-full acx:shadow-lg acx:transition-all acx:hover:scale-105 acx:flex acx:items-center acx:justify-center"
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? (
          <span className="acx-launcher-icon-stroke">
            <CloseIcon className="acx:w-6 acx:h-6" />
          </span>
        ) : (
          <>
            <ChatBubbleFilledIcon className="acx:w-7 acx:h-7" />
            {state.unreadCount > 0 && (
              <Badge count={state.unreadCount} />
            )}
          </>
        )}
      </button>
    </div>
  )
}
