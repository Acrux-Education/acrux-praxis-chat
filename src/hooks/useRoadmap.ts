import { useEffect, useRef } from 'react'
import { useChatContext } from '../context/ChatContext'
import { ApiClient } from '../services/api'
import { toArray } from '../utils/toArray'

export function useRoadmap() {
  const { state, dispatch, config } = useChatContext()
  const apiRef = useRef<ApiClient>()
  const fetchedRef = useRef(false)

  if (!apiRef.current) {
    apiRef.current = new ApiClient({ baseUrl: config.apiUrl, token: config.token })
  }

  useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true

    apiRef.current!.getRoadmapItems()
      .then((data) => {
        dispatch({ type: 'SET_ROADMAP_ITEMS', payload: toArray(data) })
      })
      .catch(() => {
        // Non-critical
      })
  }, [dispatch])

  return { roadmapItems: state.roadmapItems }
}
