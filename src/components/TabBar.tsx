import type { TabId } from '../types'
import { useChatContext } from '../context/ChatContext'
import { ChatBubbleIcon, QuestionIcon, MegaphoneIcon } from '../icons'
import { Badge } from './Badge'
import { HELP_CENTRE_URL } from '../constants'

interface TabBarProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
}

type TabSpec = { id: TabId; label: string; Icon: React.ComponentType<{ className?: string }> }

const MESSAGES_TAB: TabSpec = { id: 'messages', label: 'Messages', Icon: ChatBubbleIcon }
const NEWS_TAB: TabSpec = { id: 'news', label: "What's new", Icon: MegaphoneIcon }

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  const { state, config } = useChatContext()

  // News is a teacher rendition: it shows only when the host passed entries,
  // which the marketing site never does (PLATDEV-914).
  const tabs = (config.whatsNew?.length ?? 0) > 0
    ? [MESSAGES_TAB, NEWS_TAB]
    : [MESSAGES_TAB]

  return (
    <div className="acx:flex acx:border-t acx:border-gray-200 acx:bg-white">
    {/* Tabs and the Help link share the bar equally: the tablist takes one
        share per tab, the link one more. */}
    <nav className="acx:flex" style={{ flex: tabs.length }} role="tablist">
      {tabs.map(({ id, label, Icon }) => (
        <button
          key={id}
          role="tab"
          aria-selected={activeTab === id}
          onClick={() => onTabChange(id)}
          className={`acx:flex-1 acx:flex acx:flex-col acx:items-center acx:py-2 acx:gap-0.5 acx:relative acx:transition-colors acx:border-b-2 ${
            activeTab === id
              ? 'acx:text-primary-600 acx:border-primary-600'
              : 'acx:text-gray-500 acx:border-transparent acx:hover:text-primary-600'
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
    {/* PLATDEV-1685: Help is the help site, not a tab. It sits outside the
        tab buttons and is its own Tab
        stop. */}
    <a
      href={HELP_CENTRE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="acx:flex-1 acx:flex acx:flex-col acx:items-center acx:py-2 acx:gap-0.5 acx:transition-colors acx:border-b-2 acx:border-transparent acx:text-gray-500 acx:hover:text-primary-600"
    >
      <QuestionIcon className="acx:w-5 acx:h-5" />
      <span className="acx:text-[10px] acx:font-medium">Help<span className="acx:sr-only"> (opens in a new tab)</span></span>
    </a>
    </div>
  )
}
