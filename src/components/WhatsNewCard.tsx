import type { WhatsNewEntry } from '../types'
import { formatRelativeTime } from '../utils/time'
import { isSafeHttpUrl } from '../utils/url'

interface WhatsNewCardProps {
  entry: WhatsNewEntry
}

const categoryStyles: Record<string, string> = {
  update: 'acx:bg-green-100 acx:text-green-700',
  notice: 'acx:bg-orange-100 acx:text-orange-700',
  digest: 'acx:bg-blue-100 acx:text-blue-700',
}

const categoryLabels: Record<string, string> = {
  update: 'New',
  notice: 'Service notice',
  digest: 'Round-up',
}

export function WhatsNewCard({ entry }: WhatsNewCardProps) {
  // The summary is a sentence or two; the page-length explainer lives behind
  // the link, so the card never tries to be the article.
  const readMore = entry.read_more_url && isSafeHttpUrl(entry.read_more_url)
    ? entry.read_more_url
    : null

  return (
    <article className="acx:p-4 acx:border acx:border-gray-200 acx:rounded-xl">
      <div className="acx:flex acx:items-center acx:gap-2 acx:mb-2">
        <span className={`acx:text-[10px] acx:font-semibold acx:px-2 acx:py-0.5 acx:rounded-full ${categoryStyles[entry.category] ?? 'acx:bg-gray-100 acx:text-gray-700'}`}>
          {categoryLabels[entry.category] ?? entry.category}
        </span>
        <span className="acx:text-[10px] acx:text-gray-400">
          {formatRelativeTime(entry.sent_at)}
        </span>
      </div>

      <h4 className="acx:text-sm acx:font-semibold acx:text-gray-900 acx:mb-1">
        {entry.title}
      </h4>

      <p className="acx:text-xs acx:text-gray-500">{entry.summary}</p>

      {readMore && (
        <a
          href={readMore}
          target="_blank"
          rel="noopener noreferrer"
          className="acx:inline-block acx:mt-2 acx:text-xs acx:font-medium acx:text-primary-600 acx:hover:underline"
        >
          Read how it works
        </a>
      )}
    </article>
  )
}
