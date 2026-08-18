import { describe, expect, it } from 'vitest'
import { TIMEOUTS } from '../constants'
import { boundaryDelay, OFFLINE_FALLBACK } from './useOperatingHours'

describe('availability refresh scheduling', () => {
  it('refreshes just after the next status boundary', () => {
    const now = Date.parse('2026-08-18T00:00:00.000Z')

    expect(boundaryDelay('2026-08-18T00:01:00.000Z', now)).toBe(
      60000 + TIMEOUTS.AVAILABILITY_BOUNDARY_SKEW,
    )
  })

  it('refreshes promptly when the boundary has already passed', () => {
    const now = Date.parse('2026-08-18T00:01:00.000Z')

    expect(boundaryDelay('2026-08-18T00:00:00.000Z', now)).toBe(
      TIMEOUTS.AVAILABILITY_BOUNDARY_SKEW,
    )
  })

  it('falls back to periodic polling for absent or invalid boundaries', () => {
    expect(boundaryDelay(null)).toBeNull()
    expect(boundaryDelay('not-a-date')).toBeNull()
    expect(TIMEOUTS.AVAILABILITY_POLL).toBeGreaterThan(0)
  })

  it('uses an offline fallback when availability is unknown', () => {
    expect(OFFLINE_FALLBACK.is_online).toBe(false)
  })
})
