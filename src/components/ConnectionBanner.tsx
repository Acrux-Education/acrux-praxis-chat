interface ConnectionBannerProps {
  isConnected: boolean
  retryCount: number
}

export function ConnectionBanner({ isConnected, retryCount }: ConnectionBannerProps) {
  if (isConnected || retryCount === 0) return null

  const isLost = retryCount >= 5

  if (isLost) {
    return (
      <div className="acx-bg-red-50 acx-border-b acx-border-red-200 acx-px-4 acx-py-2.5">
        <div className="acx-flex acx-items-center acx-justify-between acx-gap-2">
          <div className="acx-flex acx-items-center acx-gap-2">
            <div className="acx-w-2 acx-h-2 acx-rounded-full acx-bg-red-400 acx-flex-shrink-0" />
            <p className="acx-text-xs acx-text-red-800">Connection lost. Please refresh.</p>
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="acx-text-xs acx-font-medium acx-text-red-700 acx-bg-red-100 acx-px-2 acx-py-0.5 acx-rounded hover:acx-bg-red-200 acx-flex-shrink-0"
          >
            Refresh
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="acx-bg-amber-50 acx-border-b acx-border-amber-200 acx-px-4 acx-py-2.5">
      <div className="acx-flex acx-items-center acx-gap-2">
        <svg className="acx-w-3 acx-h-3 acx-text-amber-500 acx-animate-spin acx-flex-shrink-0" viewBox="0 0 24 24" fill="none">
          <circle className="acx-opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="acx-opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="acx-text-xs acx-text-amber-800">Reconnecting...</p>
      </div>
    </div>
  )
}
