import { useEffect } from 'react'
import { useChatContext } from '../context/ChatContext'
import { ApiClient } from '../services/api'
import { TIMEOUTS } from '../constants'
import type { OperatingHoursStatus } from '../types'

export const OFFLINE_FALLBACK: OperatingHoursStatus = { is_online: false }

export function boundaryDelay(nextStatusChangeAt: string | null | undefined, now = Date.now()): number | null {
  if (!nextStatusChangeAt) return null
  const boundary = Date.parse(nextStatusChangeAt)
  if (!Number.isFinite(boundary)) return null
  return Math.min(
    Math.max(boundary - now + TIMEOUTS.AVAILABILITY_BOUNDARY_SKEW, TIMEOUTS.AVAILABILITY_BOUNDARY_SKEW),
    TIMEOUTS.MAX_TIMER_DELAY,
  )
}

export function useOperatingHours() {
  const { state, dispatch, config } = useChatContext()
  useEffect(() => {
    const api = new ApiClient({ baseUrl: config.apiUrl, token: config.token, region: config.region })
    let boundaryTimer: ReturnType<typeof setTimeout> | null = null
    let stopped = false
    let inFlight = false

    const fetchStatus = async () => {
      if (stopped || inFlight) return
      inFlight = true
      try {
        const status = await api.getOperatingHoursStatus()
        if (stopped) return
        dispatch({ type: 'SET_OPERATING_HOURS', payload: status })
        if (boundaryTimer) clearTimeout(boundaryTimer)
        const delay = boundaryDelay(status.next_status_change_at)
        if (delay !== null) boundaryTimer = setTimeout(fetchStatus, delay)
      } catch {
        if (!stopped) dispatch({ type: 'SET_OPERATING_HOURS', payload: OFFLINE_FALLBACK })
      } finally {
        inFlight = false
      }
    }

    void fetchStatus()
    const pollTimer = setInterval(fetchStatus, TIMEOUTS.AVAILABILITY_POLL)

    return () => {
      stopped = true
      clearInterval(pollTimer)
      if (boundaryTimer) clearTimeout(boundaryTimer)
    }
  }, [config.apiUrl, config.token, config.region, dispatch])

  return {
    isOnline: state.operatingHours?.is_online ?? false,
    offlineMessage: state.operatingHours?.offline_message,
    responseTime: state.operatingHours?.response_time,
  }
}
