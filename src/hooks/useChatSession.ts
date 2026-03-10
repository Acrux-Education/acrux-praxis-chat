import { useEffect, useCallback, useRef } from 'react'
import { useChatContext } from '../context/ChatContext'
import { useLocalStorage } from './useLocalStorage'
import { ApiClient } from '../services/api'
import { generateUUID } from '../utils/uuid'
import { extractVisitorMetadata } from '../utils/url'

export function useChatSession() {
  const { state, dispatch, config } = useChatContext()
  const [storedSessionKey, setStoredSessionKey] = useLocalStorage<string | null>('session_key', null)
  const [storedAccessToken, setStoredAccessToken] = useLocalStorage<string | null>('chat_access_token', null)
  const apiRef = useRef<ApiClient>()
  // Track the active session key to prevent stale restoreSession from
  // overwriting a newer session created while the restore was in-flight.
  const activeSessionKeyRef = useRef<string | null>(null)

  if (!apiRef.current) {
    apiRef.current = new ApiClient({ baseUrl: config.apiUrl, token: config.token })
    // Restore chat token from localStorage if available
    if (storedAccessToken) {
      apiRef.current.setChatToken(storedAccessToken)
    }
  }

  const api = apiRef.current

  const createSession = useCallback(async (visitorOverrides?: { name?: string; email?: string }) => {
    const sessionKey = generateUUID()
    const metadata = config.mode === 'lead' ? extractVisitorMetadata() : undefined

    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      const session = await api.createSession({
        source: config.mode === 'lead' ? 'lead_bot' : 'user_bot',
        session_key: sessionKey,
        visitor_name: visitorOverrides?.name || state.visitorName || config.userName,
        visitor_email: visitorOverrides?.email || state.visitorEmail || config.userEmail,
        visitor_metadata: metadata,
      })

      // Store the chat access token for subsequent requests
      if (session.access_token) {
        api.setChatToken(session.access_token)
        setStoredAccessToken(session.access_token)
      }

      activeSessionKeyRef.current = session.session_key
      dispatch({ type: 'SET_SESSION', payload: session })
      setStoredSessionKey(session.session_key)
      config.onSessionCreated?.(session.session_key)
      dispatch({ type: 'SET_LOADING', payload: false })
      return session
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create chat session' })
      dispatch({ type: 'SET_LOADING', payload: false })
      throw err
    }
  }, [api, config, state.visitorName, state.visitorEmail, dispatch, setStoredSessionKey, setStoredAccessToken])

  const restoreSession = useCallback(async (sessionKey: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      const data = await api.getSession(sessionKey)

      // Guard: if a new session was created while this restore was in-flight,
      // discard the stale restore result to avoid overwriting the new session
      // and wiping its messages.
      if (activeSessionKeyRef.current && activeSessionKeyRef.current !== sessionKey) {
        dispatch({ type: 'SET_LOADING', payload: false })
        return null
      }

      const { messages, ...session } = data
      activeSessionKeyRef.current = session.session_key
      dispatch({ type: 'SET_SESSION', payload: session })
      dispatch({ type: 'SET_MESSAGES', payload: messages })
      dispatch({ type: 'SET_LOADING', payload: false })
      return session
    } catch {
      // Session expired or invalid — clear it
      setStoredSessionKey(null)
      setStoredAccessToken(null)
      api.setChatToken('')
      dispatch({ type: 'SET_LOADING', payload: false })
      return null
    }
  }, [api, dispatch, setStoredSessionKey, setStoredAccessToken])

  const updateVisitorInfo = useCallback(async (name?: string, email?: string) => {
    if (!state.session) return

    dispatch({ type: 'SET_VISITOR_INFO', payload: { name, email } })

    try {
      await api.updateVisitor(state.session.session_key, {
        visitor_name: name,
        visitor_email: email,
      })
    } catch {
      // Non-critical failure
    }
  }, [api, state.session, dispatch])

  // Restore session on mount if stored key exists
  useEffect(() => {
    if (storedSessionKey && !state.session) {
      restoreSession(storedSessionKey)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    session: state.session,
    sessionKey: state.session?.session_key ?? storedSessionKey,
    accessToken: api.getChatToken() ?? storedAccessToken,
    createSession,
    restoreSession,
    updateVisitorInfo,
    api,
  }
}
