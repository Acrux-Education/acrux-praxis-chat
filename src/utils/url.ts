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

/**
 * True when `value` parses as an absolute http(s) URL. read_more_url arrives
 * from the host's feed, so it is never trusted to render a javascript: or
 * other unsafe scheme as an anchor href.
 */
export function isSafeHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}
