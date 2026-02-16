import { useAnnouncements } from '../hooks/useAnnouncements'
import { AnnouncementCard } from '../components/AnnouncementCard'

export function NewsTab() {
  const { announcements } = useAnnouncements()

  return (
    <div className="acx-flex acx-flex-col acx-h-full acx-overflow-y-auto">
      <div className="acx-px-5 acx-py-4 acx-border-b acx-border-gray-100">
        <h2 className="acx-text-base acx-font-semibold acx-text-gray-900">News & Updates</h2>
        <p className="acx-text-xs acx-text-gray-500 acx-mt-0.5">Latest from the team</p>
      </div>

      <div className="acx-p-4 acx-space-y-3">
        {announcements.length === 0 ? (
          <div className="acx-py-8 acx-text-center">
            <p className="acx-text-sm acx-text-gray-400">No announcements yet</p>
          </div>
        ) : (
          announcements.map((announcement) => (
            <AnnouncementCard key={announcement.id} announcement={announcement} />
          ))
        )}
      </div>
    </div>
  )
}
