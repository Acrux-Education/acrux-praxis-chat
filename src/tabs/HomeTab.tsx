import { useCallback } from 'react'
import { useChatContext } from '../context/ChatContext'
import { useKBSearch } from '../hooks/useKBSearch'
import { useAnnouncements } from '../hooks/useAnnouncements'
import { SearchInput } from '../components/SearchInput'
import { ArticleCard } from '../components/ArticleCard'
import { AnnouncementCard } from '../components/AnnouncementCard'
import type { KBArticle } from '../types'

export function HomeTab() {
  const { state, dispatch, config } = useChatContext()
  const { search } = useKBSearch()
  const { announcements } = useAnnouncements()

  const pinnedAnnouncement = announcements.find((a) => a.is_pinned)

  const handleArticleClick = useCallback((article: KBArticle) => {
    if (article.url) {
      window.open(article.url, '_blank', 'noopener,noreferrer')
    }
  }, [])

  const handleStartChat = useCallback(() => {
    dispatch({ type: 'SET_TAB', payload: 'messages' })
  }, [dispatch])

  return (
    <div className="acx-flex acx-flex-col acx-h-full acx-overflow-y-auto">
      <div className="acx-bg-gradient-to-b acx-from-primary-600 acx-to-primary-500 acx-px-5 acx-pt-5 acx-pb-8 acx-text-white">
        <h1 className="acx-text-xl acx-font-bold acx-mb-1">
          {config.greeting ?? 'Hi there! 👋'}
        </h1>
        <p className="acx-text-sm acx-text-primary-100">
          How can we help you today?
        </p>
      </div>

      <div className="acx-px-4 -acx-mt-4">
        <div className="acx-bg-white acx-rounded-xl acx-shadow-lg acx-p-4">
          <SearchInput onSearch={search} />

          <div className="acx-mt-3 acx-space-y-1">
            {state.kbLoading ? (
              <div className="acx-py-4 acx-text-center acx-text-sm acx-text-gray-400">
                Searching...
              </div>
            ) : state.kbResults.length > 0 ? (
              state.kbResults.slice(0, 5).map((article) => (
                <ArticleCard key={article.id} article={article} onClick={handleArticleClick} />
              ))
            ) : null}
          </div>
        </div>
      </div>

      {pinnedAnnouncement && (
        <div className="acx-px-4 acx-mt-4">
          <AnnouncementCard announcement={pinnedAnnouncement} />
        </div>
      )}

      <div className="acx-mt-auto acx-p-4">
        <button
          onClick={handleStartChat}
          className="acx-w-full acx-bg-white acx-text-primary-700 acx-py-3 acx-rounded-xl acx-font-semibold acx-text-base acx-shadow-md acx-border acx-border-primary-200 hover:acx-bg-primary-50 acx-transition-colors"
        >
          Start a conversation
        </button>
      </div>
    </div>
  )
}
