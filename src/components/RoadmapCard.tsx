import type { RoadmapItem } from '../types'

interface RoadmapCardProps {
  item: RoadmapItem
}

const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
  planned: { bg: 'acx-bg-gray-100', text: 'acx-text-gray-600', label: 'Planned' },
  in_progress: { bg: 'acx-bg-blue-100', text: 'acx-text-blue-700', label: 'In Progress' },
  beta: { bg: 'acx-bg-amber-100', text: 'acx-text-amber-700', label: 'Beta' },
  released: { bg: 'acx-bg-green-100', text: 'acx-text-green-700', label: 'Released' },
}

const categoryLabels: Record<string, string> = {
  assessment: 'Assessments',
  marking: 'Marking',
  reports: 'Reports',
  integrations: 'Integrations',
  platform: 'Platform',
}

export function RoadmapCard({ item }: RoadmapCardProps) {
  const status = statusStyles[item.status] ?? statusStyles.planned!

  return (
    <div className="acx-p-4 acx-border acx-border-gray-200 acx-rounded-xl">
      <div className="acx-flex acx-items-center acx-justify-between acx-mb-2">
        <span className={`acx-text-[10px] acx-font-semibold acx-px-2 acx-py-0.5 acx-rounded-full ${status.bg} ${status.text}`}>
          {status.label}
        </span>
        {item.quarter && (
          <span className="acx-text-[10px] acx-text-gray-400">{item.quarter}</span>
        )}
      </div>

      <h4 className="acx-text-sm acx-font-semibold acx-text-gray-900 acx-mb-1">
        {item.title}
      </h4>

      <p className="acx-text-xs acx-text-gray-500 acx-line-clamp-2 acx-mb-2">
        {item.description}
      </p>

      <span className="acx-text-[10px] acx-text-gray-400">
        {categoryLabels[item.category] ?? item.category}
      </span>
    </div>
  )
}
