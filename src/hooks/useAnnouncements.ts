import { useEffect, useRef } from 'react'
import { useChatContext } from '../context/ChatContext'
import { ApiClient } from '../services/api'
import { toArray } from '../utils/toArray'

export function useAnnouncements() {
  const { state, dispatch, config } = useChatContext()
  const apiRef = useRef<ApiClient>()
  const fetchedRef = useRef(false)

  if (!apiRef.current) {
    apiRef.current = new ApiClient({ baseUrl: config.apiUrl, token: config.token })
  }

  useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true

    apiRef.current!.getAnnouncements()
      .then((data) => {
        dispatch({ type: 'SET_ANNOUNCEMENTS', payload: toArray(data) })
      })
      .catch(() => {
        // Non-critical
      })
  }, [dispatch])

  return { announcements: state.announcements }
}
