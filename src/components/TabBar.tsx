import type { TabId } from '../types'
import { useChatContext } from '../context/ChatContext'
import { HomeIcon, ChatBubbleIcon, MegaphoneIcon, MapIcon, QuestionIcon } from '../icons'
import { Badge } from './Badge'

interface TabBarProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
}

const allTabs: { id: TabId; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'home', label: 'Home', Icon: HomeIcon },
  { id: 'messages', label: 'Messages', Icon: ChatBubbleIcon },
  { id: 'news', label: 'News', Icon: MegaphoneIcon },
  { id: 'roadmap', label: 'Roadmap', Icon: MapIcon },
  { id: 'help', label: 'Help', Icon: QuestionIcon },
]

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  const { state } = useChatContext()

  const visibleTabs = allTabs.filter(({ id }) => {
    switch (id) {
      case 'home': return true
      case 'messages': return true
      case 'news': return (state.announcements?.length ?? 0) > 0
      case 'roadmap': return (state.roadmapItems?.length ?? 0) > 0
      case 'help': return (state.kbTopics?.length ?? 0) > 0
      default: return false
    }
  })

  // Don't render tab bar if only Home is available
  if (visibleTabs.length <= 1) return null

  return (
    <nav className="acx-flex acx-border-t acx-border-gray-200 acx-bg-white" role="tablist">
      {visibleTabs.map(({ id, label, Icon }) => (
        <button
          key={id}
          role="tab"
          aria-selected={activeTab === id}
          onClick={() => onTabChange(id)}
          className={`acx-flex-1 acx-flex acx-flex-col acx-items-center acx-py-2 acx-gap-0.5 acx-relative acx-transition-colors ${
            activeTab === id
              ? 'acx-text-primary-600'
              : 'acx-text-gray-400 hover:acx-text-primary-600'
          }`}
        >
          <div className="acx-relative">
            <Icon className="acx-w-5 acx-h-5" />
            {id === 'messages' && state.unreadCount > 0 && (
              <Badge count={state.unreadCount} />
            )}
          </div>
          <span className="acx-text-[10px] acx-font-medium">{label}</span>
        </button>
      ))}
    </nav>
  )
}
