interface StatusBannerProps {
  isOnline: boolean
  offlineMessage?: string
  responseTime?: string
}

export function StatusBanner({ isOnline, offlineMessage, responseTime }: StatusBannerProps) {
  if (isOnline) return null

  return (
    <div className="acx-bg-amber-50 acx-border-b acx-border-amber-200 acx-px-4 acx-py-2.5">
      <div className="acx-flex acx-items-center acx-gap-2">
        <div className="acx-w-2 acx-h-2 acx-rounded-full acx-bg-amber-400 acx-flex-shrink-0" />
        <p className="acx-text-xs acx-text-amber-800">
          {offlineMessage ?? "We're currently offline."}
          {responseTime && (
            <span className="acx-font-medium"> We typically respond {responseTime}.</span>
          )}
        </p>
      </div>
    </div>
  )
}
