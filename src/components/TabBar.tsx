import { useRef } from 'react'
import type { TabId } from '../types'
import { useChatContext } from '../context/ChatContext'
import { ChatBubbleIcon, QuestionIcon, MegaphoneIcon } from '../icons'
import { Badge } from './Badge'
import { nextTabIndex } from '../utils/a11y'

interface TabBarProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  /** Prefix for the tab ids; the panel is labelled by `${idBase}-tab-${activeTab}`. */
  idBase: string
  /** Id of the tab panel the selected tab controls. */
  panelId: string
}

type TabSpec = { id: TabId; label: string; Icon: React.ComponentType<{ className?: string }> }

const MESSAGES_TAB: TabSpec = { id: 'messages', label: 'Messages', Icon: ChatBubbleIcon }
const NEWS_TAB: TabSpec = { id: 'news', label: "What's new", Icon: MegaphoneIcon }
const HELP_TAB: TabSpec = { id: 'help', label: 'Help', Icon: QuestionIcon }

export function TabBar({ activeTab, onTabChange, idBase, panelId }: TabBarProps) {
  const { state, config } = useChatContext()
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  // News is a teacher rendition: it shows only when the host passed entries,
  // which the marketing site never does (PLATDEV-914).
  const tabs = (config.whatsNew?.length ?? 0) > 0
    ? [MESSAGES_TAB, NEWS_TAB, HELP_TAB]
    : [MESSAGES_TAB, HELP_TAB]

  // Roving tabindex: one Tab stop for the whole bar. If the active tab is not
  // shown (defaultTab 'news' with no entries), the first tab takes the stop.
  const selectedIndex = tabs.findIndex((tab) => tab.id === activeTab)
  const focusIndex = selectedIndex === -1 ? 0 : selectedIndex

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const next = nextTabIndex(e.key, focusIndex, tabs.length)
    if (next === null) return
    e.preventDefault()
    onTabChange(tabs[next]!.id)
    tabRefs.current[next]?.focus()
  }

  return (
    <nav className="acx:flex acx:border-t acx:border-gray-200 acx:bg-white" role="tablist" aria-label="Chat sections" onKeyDown={handleKeyDown}>
      {tabs.map(({ id, label, Icon }, index) => (
        <button
          key={id}
          ref={(el) => { tabRefs.current[index] = el }}
          type="button"
          role="tab"
          id={`${idBase}-tab-${id}`}
          aria-selected={activeTab === id}
          aria-controls={activeTab === id ? panelId : undefined}
          aria-label={id === 'messages' && state.unreadCount > 0 ? `${label}, ${state.unreadCount} unread` : undefined}
          tabIndex={index === focusIndex ? 0 : -1}
          onClick={() => onTabChange(id)}
          className={`acx:flex-1 acx:flex acx:flex-col acx:items-center acx:py-2 acx:gap-0.5 acx:relative acx:transition-colors ${
            activeTab === id
              ? 'acx:text-primary-600'
              : 'acx:text-gray-400 acx:hover:text-primary-600'
          }`}
        >
          <div className="acx:relative">
            <Icon className="acx:w-5 acx:h-5" />
            {id === 'messages' && state.unreadCount > 0 && (
              <Badge count={state.unreadCount} />
            )}
          </div>
          <span className="acx:text-[10px] acx:font-medium">{label}</span>
        </button>
      ))}
    </nav>
  )
}
