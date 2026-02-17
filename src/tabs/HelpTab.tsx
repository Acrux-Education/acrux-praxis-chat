import { useState, useEffect, useRef, useCallback } from 'react'
import { useChatContext } from '../context/ChatContext'
import { ApiClient } from '../services/api'
import { ArticleCard } from '../components/ArticleCard'
import { ChevronLeftIcon, ChevronRightIcon } from '../icons'
import type { KBTopic, KBArticle } from '../types'

export function HelpTab() {
  const { state, dispatch, config } = useChatContext()
  const topics = state.kbTopics
  const [selectedTopic, setSelectedTopic] = useState<KBTopic | null>(null)
  const [articles, setArticles] = useState<KBArticle[]>([])
  const [loading, setLoading] = useState(false)
  const apiRef = useRef<ApiClient>()

  if (!apiRef.current) {
    apiRef.current = new ApiClient({ baseUrl: config.apiUrl, token: config.token })
  }

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

  return (
    <div className="acx-flex acx-flex-col acx-h-full acx-overflow-y-auto">
      <div className="acx-px-5 acx-py-4 acx-border-b acx-border-gray-100">
        <h2 className="acx-text-base acx-font-semibold acx-text-gray-900">Help Centre</h2>
        <p className="acx-text-xs acx-text-gray-500 acx-mt-0.5">Browse help topics</p>
      </div>

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
    </div>
  )
}
