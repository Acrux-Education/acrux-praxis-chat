import { useCallback, useRef, useState } from 'react'
import { useChatContext } from '../context/ChatContext'
import { useKBSearch } from '../hooks/useKBSearch'
import { useAnnouncements } from '../hooks/useAnnouncements'
import { ApiClient } from '../services/api'
import { SearchInput } from '../components/SearchInput'
import { ArticleCard } from '../components/ArticleCard'
import { AnnouncementCard } from '../components/AnnouncementCard'
import type { KBArticle, KBAnswer } from '../types'

export function HomeTab() {
  const { state, dispatch, config } = useChatContext()
  const { search } = useKBSearch()
  const { announcements } = useAnnouncements()
  const [answer, setAnswer] = useState<KBAnswer | null>(null)
  const [asking, setAsking] = useState(false)
  const apiRef = useRef<ApiClient>()

  if (!apiRef.current) {
    apiRef.current = new ApiClient({ baseUrl: config.apiUrl, token: config.token })
  }

  const ask = useCallback(async (question: string) => {
    setAsking(true)
    setAnswer(null)
    try {
      const result = await apiRef.current!.askKB(question, state.session?.session_key)
      setAnswer(result)
      // A fallback response carries the retrieval candidates — surface them
      // as the card list so the user still gets somewhere to click.
      if (result.fallback && result.results.length > 0) {
        dispatch({ type: 'SET_KB_RESULTS', payload: result.results })
      }
    } catch {
      setAnswer(null)
    } finally {
      setAsking(false)
    }
  }, [dispatch, state.session?.session_key])

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
    <div className="acx:flex acx:flex-col acx:h-full acx:overflow-y-auto">
      <div className="acx:bg-gradient-to-b acx:from-primary-600 acx:to-primary-500 acx:px-5 acx:pt-5 acx:pb-8 acx:text-white">
        <h1 className="acx:text-xl acx:font-bold acx:mb-1">
          {config.greeting ?? 'Hi there! 👋'}
        </h1>
        <p className="acx:text-sm acx:text-primary-100">
          How can we help you today?
        </p>
      </div>

      <div className="acx:px-4 acx:-mt-4">
        <div className="acx:bg-white acx:rounded-xl acx:shadow-lg acx:p-4">
          <SearchInput onSearch={search} onSubmit={ask} placeholder="Ask a question or search..." />

          {asking && (
            <div className="acx:mt-3 acx:py-3 acx:text-center acx:text-sm acx:text-gray-400">
              Finding an answer...
            </div>
          )}

          {!asking && answer?.answer && (
            <div className="acx:mt-3 acx:rounded-lg acx:bg-primary-50 acx:border acx:border-primary-100 acx:p-3">
              <p className="acx:text-sm acx:text-gray-800 acx:whitespace-pre-line">{answer.answer}</p>
              {answer.sources.length > 0 && (
                <div className="acx:mt-2 acx:pt-2 acx:border-t acx:border-primary-100 acx:space-y-1">
                  {answer.sources.map((article) => (
                    <button
                      key={article.id}
                      onClick={() => handleArticleClick(article)}
                      className="acx:block acx:text-xs acx:text-primary-600 acx:hover:text-primary-700 acx:text-left"
                    >
                      {article.title} →
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {!asking && answer?.fallback && (
            <p className="acx:mt-3 acx:text-xs acx:text-gray-500">
              We couldn't find a direct answer — try these articles, or start a conversation below.
            </p>
          )}

          <div className="acx:mt-3 acx:space-y-1">
            {state.kbLoading ? (
              <div className="acx:py-4 acx:text-center acx:text-sm acx:text-gray-400">
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
        <div className="acx:px-4 acx:mt-4">
          <AnnouncementCard announcement={pinnedAnnouncement} />
        </div>
      )}

      <div className="acx:mt-auto acx:p-4">
        <button
          onClick={handleStartChat}
          className="acx:w-full acx:bg-white acx:text-primary-600 acx:py-3 acx:rounded-xl acx:font-semibold acx:text-base acx:shadow-md acx:border acx:border-primary-200 acx:hover:bg-primary-600 acx:hover:text-white acx:hover:border-primary-600 acx:transition-colors"
        >
          Start a conversation
        </button>
      </div>
    </div>
  )
}
