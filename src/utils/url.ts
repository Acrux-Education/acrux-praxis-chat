import type { VisitorMetadata } from '../types'

export function extractVisitorMetadata(): VisitorMetadata {
  const params = new URLSearchParams(window.location.search)

  let referrerOriginPath = ''
  if (document.referrer) {
    try {
      const ref = new URL(document.referrer)
      referrerOriginPath = ref.origin + ref.pathname
    } catch {
      // Malformed referrer — leave empty
    }
  }

  return {
    page_url: window.location.origin + window.location.pathname,
    referrer: referrerOriginPath,
    utm_source: params.get('utm_source') ?? undefined,
    utm_medium: params.get('utm_medium') ?? undefined,
    utm_campaign: params.get('utm_campaign') ?? undefined,
  }
}
