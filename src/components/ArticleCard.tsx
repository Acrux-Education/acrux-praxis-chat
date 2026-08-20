import type { KBArticle } from '../types'
import { ChevronRightIcon } from '../icons'

interface ArticleCardProps {
  article: KBArticle
  onClick: (article: KBArticle) => void
}

export function ArticleCard({ article, onClick }: ArticleCardProps) {
  return (
    <button
      onClick={() => onClick(article)}
      className="acx:w-full acx:flex acx:items-center acx:justify-between acx:p-3 acx:rounded-lg acx:text-left acx:hover:bg-gray-50 acx:transition-colors acx:group"
    >
      <div className="acx:flex-1 acx:min-w-0">
        <h4 className="acx:text-sm acx:font-medium acx:text-gray-900 acx:truncate acx:group-hover:text-primary-600 acx:transition-colors">
          {article.title}
        </h4>
        {article.summary && (
          <p className="acx:text-xs acx:text-gray-500 acx:mt-0.5 acx:line-clamp-2">
            {article.summary}
          </p>
        )}
      </div>
      <ChevronRightIcon className="acx:w-4 acx:h-4 acx:text-gray-400 acx:flex-shrink-0 acx:ml-2" />
    </button>
  )
}
