import { useState } from 'react'
import type { ChatWidgetProps } from './types'
import { DEFAULTS } from './constants'
import { ChatProvider, useChatContext } from './context/ChatContext'
import { ChatLauncher } from './ChatLauncher'
import { TabBar } from './components/TabBar'
import { MessagesTab } from './tabs/MessagesTab'
import { HelpTab } from './tabs/HelpTab'
import './styles/index.css'

export function ChatWidget(props: ChatWidgetProps) {
  return (
    <ChatProvider {...props}>
      <ChatWidgetInner position={props.position ?? DEFAULTS.POSITION} />
    </ChatProvider>
  )
}

function ChatWidgetInner({ position }: { position: 'bottom-right' | 'bottom-left' }) {
  const { state, dispatch } = useChatContext()
  const [isOpen, setIsOpen] = useState(false)

  const positionClasses = position === 'bottom-right'
    ? 'acx:right-4 acx:sm:right-6'
    : 'acx:left-4 acx:sm:left-6'

  return (
    <div className="acrux-chat-widget">
      {isOpen && (
        <div
          className={`acx:fixed acx:bottom-20 ${positionClasses} acx:z-[9999] acx:w-[380px] acx:max-w-[calc(100vw-2rem)] acx:h-[600px] acx:max-h-[calc(100vh-6rem)] acx:bg-white acx:rounded-2xl acx:shadow-2xl acx:flex acx:flex-col acx:overflow-hidden acx:animate-slide-up`}
          role="dialog"
          aria-label="Chat widget"
        >
          <div className="acx:flex acx:items-center acx:justify-between acx:px-5 acx:py-4 acx:bg-primary-600 acx:text-white">
            <div className="acx:flex acx:items-center acx:gap-2.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 375 375" className="acx:flex-shrink-0">
                <path fill="#ffde5a" d="M 366.039062 86.546875 L 209.414062 117.519531 L 156.304688 4.511719 L 132.847656 127.152344 L 8.957031 142.746094 L 120.160156 174.398438 L 91.242188 158.484375 L 154.742188 150.492188 L 166.765625 87.632812 L 193.984375 145.554688 L 282.449219 125.828125 L 210.808594 181.351562 L 238.035156 239.269531 L 181.964844 208.414062 L 14 374.972656 L 185.960938 240.164062 L 295.355469 300.371094 L 242.242188 187.359375 L 366.039062 86.546875" fillRule="nonzero"/>
              </svg>
              <h2 className="acx:text-lg acx:font-semibold">Acrux Chat</h2>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="acx:p-1 acx:rounded-md acx:bg-white acx:transition-colors acx:hover:bg-gray-100"
              aria-label="Close chat"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#006383" strokeWidth="2" strokeLinecap="round">
                <path d="M15 5L5 15M5 5l10 10" />
              </svg>
            </button>
          </div>

          <div className="acx:flex-1 acx:overflow-hidden">
            {state.activeTab === 'messages' && <MessagesTab />}
            {state.activeTab === 'help' && <HelpTab />}
          </div>

          <TabBar
            activeTab={state.activeTab}
            onTabChange={(tab) => dispatch({ type: 'SET_TAB', payload: tab })}
          />
        </div>
      )}

      <ChatLauncher
        isOpen={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        position={position}
      />
    </div>
  )
}
