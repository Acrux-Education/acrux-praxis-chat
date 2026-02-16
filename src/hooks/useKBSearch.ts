import { useEffect, useRef, useCallback } from 'react'
import { useChatContext } from '../context/ChatContext'
import { ApiClient } from '../services/api'
import { TIMEOUTS } from '../constants'

export function useKBSearch() {
  const { dispatch, config } = useChatContext()
  const apiRef = useRef<ApiClient>()
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  if (!apiRef.current) {
    apiRef.current = new ApiClient({ baseUrl: config.apiUrl, token: config.token })
  }

  const search = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!query.trim()) {
      dispatch({ type: 'SET_KB_RESULTS', payload: [] })
      return
    }

    dispatch({ type: 'SET_KB_LOADING', payload: true })

    debounceRef.current = setTimeout(async () => {
      try {
        const results = await apiRef.current!.searchKB(query)
        dispatch({ type: 'SET_KB_RESULTS', payload: results })
      } catch {
        dispatch({ type: 'SET_KB_RESULTS', payload: [] })
      }
    }, TIMEOUTS.SEARCH_DEBOUNCE)
  }, [dispatch])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  return { search }
}
