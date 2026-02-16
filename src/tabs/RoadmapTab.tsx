import { useRoadmap } from '../hooks/useRoadmap'
import { RoadmapCard } from '../components/RoadmapCard'

const STATUS_ORDER = ['in_progress', 'beta', 'planned', 'released'] as const

export function RoadmapTab() {
  const { roadmapItems } = useRoadmap()

  const grouped = STATUS_ORDER.reduce((acc, status) => {
    const items = roadmapItems.filter((item) => item.status === status)
    if (items.length > 0) acc.push({ status, items })
    return acc
  }, [] as { status: string; items: typeof roadmapItems }[])

  const statusLabels: Record<string, string> = {
    planned: 'Planned',
    in_progress: 'In Progress',
    beta: 'Beta',
    released: 'Released',
  }

  return (
    <div className="acx-flex acx-flex-col acx-h-full acx-overflow-y-auto">
      <div className="acx-px-5 acx-py-4 acx-border-b acx-border-gray-100">
        <h2 className="acx-text-base acx-font-semibold acx-text-gray-900">Product Roadmap</h2>
        <p className="acx-text-xs acx-text-gray-500 acx-mt-0.5">See what we're building</p>
      </div>

      <div className="acx-p-4 acx-space-y-5">
        {grouped.length === 0 ? (
          <div className="acx-py-8 acx-text-center">
            <p className="acx-text-sm acx-text-gray-400">No roadmap items yet</p>
          </div>
        ) : (
          grouped.map(({ status, items }) => (
            <div key={status}>
              <h3 className="acx-text-xs acx-font-semibold acx-text-gray-500 acx-uppercase acx-tracking-wider acx-mb-2">
                {statusLabels[status] ?? status}
              </h3>
              <div className="acx-space-y-2">
                {items.map((item) => (
                  <RoadmapCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
