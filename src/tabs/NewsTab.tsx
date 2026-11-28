import { useChatContext } from '../context/ChatContext'
import { WhatsNewCard } from '../components/WhatsNewCard'

/**
 * What's new in the widget (PLATDEV-914) — one of the renditions of a
 * broadcast, alongside the in-app banner, the archive page and the email.
 *
 * The entries come from the host as a prop, never from a fetch of our own:
 * this is teacher content and the widget cannot prove it is running for a
 * teacher.
 */
export function NewsTab() {
  const { config } = useChatContext()
  const entries = config.whatsNew ?? []

  return (
    <div className="acx:flex acx:flex-col acx:h-full acx:overflow-y-auto">
      <div className="acx:px-5 acx:py-4 acx:border-b acx:border-gray-100">
        <h2 className="acx:text-base acx:font-semibold acx:text-gray-900">What&rsquo;s new</h2>
        <p className="acx:text-xs acx:text-gray-500 acx:mt-0.5">Recent updates from the team</p>
      </div>

      <div className="acx:p-4 acx:space-y-3">
        {entries.length === 0 ? (
          <div className="acx:py-8 acx:text-center">
            <p className="acx:text-sm acx:text-gray-400">Nothing new right now</p>
          </div>
        ) : (
          entries.map((entry) => <WhatsNewCard key={entry.id} entry={entry} />)
        )}
      </div>
    </div>
  )
}
