import { useState } from 'react'
import type { ChatWidgetProps } from './types'
import { DEFAULTS } from './constants'
import { ChatProvider, useChatContext } from './context/ChatContext'
import { ChatLauncher } from './ChatLauncher'
import { TabBar } from './components/TabBar'
import { HomeTab } from './tabs/HomeTab'
import { MessagesTab } from './tabs/MessagesTab'
import { NewsTab } from './tabs/NewsTab'
import { RoadmapTab } from './tabs/RoadmapTab'
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
    ? 'acx-right-4 sm:acx-right-6'
    : 'acx-left-4 sm:acx-left-6'

  return (
    <div className="acrux-chat-widget">
      {isOpen && (
        <div
          className={`acx-fixed acx-bottom-20 ${positionClasses} acx-z-[9999] acx-w-[380px] acx-max-w-[calc(100vw-2rem)] acx-h-[600px] acx-max-h-[calc(100vh-6rem)] acx-bg-white acx-rounded-2xl acx-shadow-2xl acx-flex acx-flex-col acx-overflow-hidden acx-animate-slide-up`}
          role="dialog"
          aria-label="Chat widget"
        >
          <div className="acx-flex acx-items-center acx-justify-between acx-px-5 acx-py-4 acx-bg-primary-600 acx-text-white">
            <h2 className="acx-text-lg acx-font-semibold">Acrux</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="acx-p-1 acx-rounded-lg hover:acx-bg-white/20 acx-transition-colors"
              aria-label="Close chat"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M15 5L5 15M5 5l10 10" />
              </svg>
            </button>
          </div>

          <div className="acx-flex-1 acx-overflow-hidden">
            {state.activeTab === 'home' && <HomeTab />}
            {state.activeTab === 'messages' && <MessagesTab />}
            {state.activeTab === 'news' && <NewsTab />}
            {state.activeTab === 'roadmap' && <RoadmapTab />}
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
