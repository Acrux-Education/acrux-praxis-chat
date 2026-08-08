import { useState, useEffect, useRef, useCallback } from 'react'
import { useChatContext } from '../context/ChatContext'
import { useKBSearch } from '../hooks/useKBSearch'
import { ApiClient } from '../services/api'
import { SearchInput } from '../components/SearchInput'
import { ArticleCard } from '../components/ArticleCard'
import { ChevronLeftIcon, ChevronRightIcon } from '../icons'
import type { KBTopic, KBArticle, KBAnswer } from '../types'

export function HelpTab() {
  const { state, dispatch, config } = useChatContext()
  const { search } = useKBSearch()
  const topics = state.kbTopics
  const [selectedTopic, setSelectedTopic] = useState<KBTopic | null>(null)
  const [articles, setArticles] = useState<KBArticle[]>([])
  const [loading, setLoading] = useState(false)
  const [answer, setAnswer] = useState<KBAnswer | null>(null)
  const [asking, setAsking] = useState(false)
  const apiRef = useRef<ApiClient>()

  if (!apiRef.current) {
    apiRef.current = new ApiClient({ baseUrl: config.apiUrl, token: config.token })
  }

  const handleSearch = useCallback((query: string) => {
    if (!query) setAnswer(null)
    search(query)
  }, [search])

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

  useEffect(() => {
    if (state.kbTopics?.length > 0) return
    apiRef.current!.getKBTopics()
      .then((fetched) => dispatch({ type: 'SET_KB_TOPICS', payload: Array.isArray(fetched) ? fetched : [] }))
      .catch(() => {})
  }, [state.kbTopics?.length, dispatch])

  const handleTopicClick = useCallback(async (topic: KBTopic) => {
    setSelectedTopic(topic)
    setLoading(true)
    try {
      const results = await apiRef.current!.getKBTopicArticles(topic.slug)
      setArticles(results)
    } catch {
      setArticles([])
    } finally {
      setLoading(false)
    }
  }, [])

  const handleArticleClick = useCallback((article: KBArticle) => {
    if (article.url) {
      window.open(article.url, '_blank', 'noopener,noreferrer')
    }
  }, [])

  const handleBack = useCallback(() => {
    setSelectedTopic(null)
    setArticles([])
  }, [])

  if (selectedTopic) {
    return (
      <div className="acx-flex acx-flex-col acx-h-full acx-overflow-y-auto">
        <div className="acx-px-5 acx-py-4 acx-border-b acx-border-gray-100">
          <button
            onClick={handleBack}
            className="acx-flex acx-items-center acx-gap-1 acx-text-sm acx-text-primary-600 acx-mb-2 hover:acx-text-primary-700"
          >
            <ChevronLeftIcon className="acx-w-4 acx-h-4" />
            Back
          </button>
          <h2 className="acx-text-base acx-font-semibold acx-text-gray-900">{selectedTopic.name}</h2>
          <p className="acx-text-xs acx-text-gray-500 acx-mt-0.5">
            {selectedTopic.article_count} article{selectedTopic.article_count !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="acx-p-4 acx-space-y-1">
          {loading ? (
            <div className="acx-py-4 acx-text-center acx-text-sm acx-text-gray-400">Loading...</div>
          ) : articles.length === 0 ? (
            <div className="acx-py-4 acx-text-center acx-text-sm acx-text-gray-400">No articles found</div>
          ) : (
            articles.map((article) => (
              <ArticleCard key={article.id} article={article} onClick={handleArticleClick} />
            ))
          )}
        </div>
      </div>
    )
  }

  const searching = state.kbLoading || state.kbResults.length > 0

  return (
    <div className="acx-flex acx-flex-col acx-h-full acx-overflow-y-auto">
      <div className="acx-px-5 acx-py-4 acx-border-b acx-border-gray-100">
        <h2 className="acx-text-base acx-font-semibold acx-text-gray-900">Help Centre</h2>
        <p className="acx-text-xs acx-text-gray-500 acx-mt-0.5">Ask a question or browse topics</p>
        <div className="acx-mt-3">
          <SearchInput onSearch={handleSearch} onSubmit={ask} placeholder="Ask a question or search..." />
        </div>

        {asking && (
          <div className="acx-mt-3 acx-py-3 acx-text-center acx-text-sm acx-text-gray-400">
            Finding an answer...
          </div>
        )}

        {!asking && answer?.answer && (
          <div className="acx-mt-3 acx-rounded-lg acx-bg-primary-50 acx-border acx-border-primary-100 acx-p-3">
            <p className="acx-text-sm acx-text-gray-800 acx-whitespace-pre-line">{answer.answer}</p>
            {answer.sources.length > 0 && (
              <div className="acx-mt-2 acx-pt-2 acx-border-t acx-border-primary-100 acx-space-y-1">
                {answer.sources.map((article) => (
                  <button
                    key={article.id}
                    onClick={() => handleArticleClick(article)}
                    className="acx-block acx-text-xs acx-text-primary-600 hover:acx-text-primary-700 acx-text-left"
                  >
                    {article.title} →
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {!asking && answer?.fallback && (
          <p className="acx-mt-3 acx-text-xs acx-text-gray-500">
            We couldn't find a direct answer — try these articles, or send us a message.
          </p>
        )}
      </div>

      {searching ? (
        <div className="acx-p-4 acx-space-y-1">
          {state.kbLoading ? (
            <div className="acx-py-4 acx-text-center acx-text-sm acx-text-gray-400">Searching...</div>
          ) : (
            state.kbResults.slice(0, 5).map((article) => (
              <ArticleCard key={article.id} article={article} onClick={handleArticleClick} />
            ))
          )}
        </div>
      ) : (
      <div className="acx-p-4 acx-space-y-1">
        {topics.length === 0 ? (
          <div className="acx-py-8 acx-text-center">
            <p className="acx-text-sm acx-text-gray-400">No help topics available</p>
          </div>
        ) : (
          topics.map((topic) => (
            <button
              key={topic.id}
              onClick={() => handleTopicClick(topic)}
              className="acx-w-full acx-flex acx-items-center acx-justify-between acx-p-3 acx-rounded-lg acx-text-left hover:acx-bg-gray-50 acx-transition-colors"
            >
              <div>
                <h4 className="acx-text-sm acx-font-medium acx-text-gray-900">{topic.name}</h4>
                <p className="acx-text-xs acx-text-gray-500">
                  {topic.article_count} article{topic.article_count !== 1 ? 's' : ''}
                </p>
              </div>
              <ChevronRightIcon className="acx-w-4 acx-h-4 acx-text-gray-400" />
            </button>
          ))
        )}
      </div>
      )}
    </div>
  )
}
