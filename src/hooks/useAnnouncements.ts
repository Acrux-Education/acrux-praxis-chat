import { useEffect, useRef } from 'react'
import { useChatContext } from '../context/ChatContext'
import { ApiClient } from '../services/api'
import { toArray } from '../utils/toArray'

/**
 * @deprecated 4 September 2026 (PLATDEV-914) — the chat announcements feed.
 *
 * Nothing mounts this. Broadcast content now reaches teachers as What's new
 * entries the host passes in (NewsTab / WhatsNewCard), and prospects see no
 * broadcast rendition at all. Left in place rather than deleted: review on
 * 4 March 2027 and remove if still unused.
 */
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
