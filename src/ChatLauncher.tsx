import type { WidgetPosition } from './types'
import { useChatContext } from './context/ChatContext'
import { Badge } from './components/Badge'
import { QuestionIcon, CloseIcon } from './icons'

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
        // PLATDEV-1685: 44px with a question mark, so it reads as help.
        className="acx-launcher-btn acx:relative acx:w-11 acx:h-11 acx:rounded-full acx:shadow-lg acx:transition-all acx:hover:scale-105 acx:flex acx:items-center acx:justify-center"
        aria-label={isOpen ? 'Close help' : openLabel(state.unreadCount)}
      >
        {isOpen ? (
          <span className="acx-launcher-icon-stroke">
            <CloseIcon className="acx:w-5 acx:h-5" />
          </span>
        ) : (
          <>
            <span className="acx-launcher-icon-stroke">
              <QuestionIcon className="acx:w-6 acx:h-6" />
            </span>
            {state.unreadCount > 0 && (
              <Badge count={state.unreadCount} />
            )}
          </>
        )}
      </button>
    </div>
  )
}

// The badge is inside an aria-labelled button, so its count has to be in the label.
function openLabel(unreadCount: number): string {
  if (unreadCount <= 0) return 'Open help'
  return `Open help, ${unreadCount} unread ${unreadCount === 1 ? 'message' : 'messages'}`
}
