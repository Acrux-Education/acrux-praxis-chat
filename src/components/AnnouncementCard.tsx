import type { Announcement } from '../types'
import { formatRelativeTime } from '../utils/time'

interface AnnouncementCardProps {
  announcement: Announcement
  onClick?: (announcement: Announcement) => void
}

const categoryStyles: Record<string, string> = {
  feature: 'acx:bg-green-100 acx:text-green-700',
  improvement: 'acx:bg-blue-100 acx:text-blue-700',
  update: 'acx:bg-purple-100 acx:text-purple-700',
  maintenance: 'acx:bg-orange-100 acx:text-orange-700',
  event: 'acx:bg-pink-100 acx:text-pink-700',
}

const categoryLabels: Record<string, string> = {
  feature: 'New Feature',
  improvement: 'Improvement',
  update: 'Update',
  maintenance: 'Maintenance',
  event: 'Event',
}

export function AnnouncementCard({ announcement, onClick }: AnnouncementCardProps) {
  return (
    <button
      onClick={() => onClick?.(announcement)}
      className="acx:w-full acx:text-left acx:p-4 acx:border acx:border-gray-200 acx:rounded-xl acx:hover:border-primary-200 acx:hover:bg-primary-50/50 acx:transition-all"
    >
      <div className="acx:flex acx:items-center acx:gap-2 acx:mb-2">
        <span className={`acx:text-[10px] acx:font-semibold acx:px-2 acx:py-0.5 acx:rounded-full ${categoryStyles[announcement.category] ?? 'acx:bg-gray-100 acx:text-gray-700'}`}>
          {categoryLabels[announcement.category] ?? announcement.category}
        </span>
        {announcement.is_pinned && (
          <span className="acx:text-[10px] acx:text-amber-600 acx:font-medium">Pinned</span>
        )}
      </div>

      <h4 className="acx:text-sm acx:font-semibold acx:text-gray-900 acx:mb-1">
        {announcement.title}
      </h4>

      <p className="acx:text-xs acx:text-gray-500 acx:line-clamp-2 acx:mb-2">
        {announcement.summary}
      </p>

      {announcement.image_url && (
        <img
          src={announcement.image_url}
          alt=""
          className="acx:w-full acx:h-32 acx:object-cover acx:rounded-lg acx:mb-2"
        />
      )}

      <span className="acx:text-[10px] acx:text-gray-400">
        {formatRelativeTime(announcement.published_at)}
      </span>
    </button>
  )
}
