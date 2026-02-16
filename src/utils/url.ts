import type { VisitorMetadata } from '../types'

export function extractVisitorMetadata(): VisitorMetadata {
  const params = new URLSearchParams(window.location.search)

  return {
    page_url: window.location.href,
    referrer: document.referrer,
    utm_source: params.get('utm_source') ?? undefined,
    utm_medium: params.get('utm_medium') ?? undefined,
    utm_campaign: params.get('utm_campaign') ?? undefined,
  }
}
