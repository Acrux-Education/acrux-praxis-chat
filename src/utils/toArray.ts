/**
 * Safely extract an array from API responses that may be:
 * - A plain array
 * - A DRF paginated object { results: [...] }
 * - undefined/null
 */
export function toArray<T>(data: T[] | { results: T[] } | unknown): T[] {
  if (Array.isArray(data)) return data
  if (data && typeof data === 'object' && 'results' in (data as Record<string, unknown>)) {
    return (data as { results: T[] }).results
  }
  return []
}
