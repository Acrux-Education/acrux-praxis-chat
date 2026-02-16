import { useEffect, useRef } from 'react'
import { useChatContext } from '../context/ChatContext'
import { ApiClient } from '../services/api'

export function useOperatingHours() {
  const { state, dispatch, config } = useChatContext()
  const apiRef = useRef<ApiClient>()
  const fetchedRef = useRef(false)

  if (!apiRef.current) {
    apiRef.current = new ApiClient({ baseUrl: config.apiUrl, token: config.token })
  }

  useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true

    apiRef.current!.getOperatingHoursStatus()
      .then((status) => {
        dispatch({ type: 'SET_OPERATING_HOURS', payload: status })
      })
      .catch(() => {
        // Default to online if we can't determine
      })
  }, [dispatch])

  return {
    isOnline: state.operatingHours?.is_online ?? true,
    offlineMessage: state.operatingHours?.offline_message,
    responseTime: state.operatingHours?.response_time,
  }
}
