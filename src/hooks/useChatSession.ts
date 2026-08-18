import { useEffect, useCallback, useRef, useState } from 'react'
import { useChatContext } from '../context/ChatContext'
import { useLocalStorage } from './useLocalStorage'
import { ApiClient } from '../services/api'
import { extractVisitorMetadata } from '../utils/url'
import { TURNSTILE_SITE_KEY } from '../constants'

const SESSION_TOKEN_KEY = 'acrux_chat_chat_access_token'
const TURNSTILE_SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
const TURNSTILE_TIMEOUT_MS = 5000

// Lazily loads the Turnstile script (idempotent) and executes an invisible
// challenge. Fails open: returns null on any error or timeout.
export function getTurnstileToken(): Promise<string | null> {
  return new Promise((resolve) => {
    let settled = false
    let pollTimer: number | undefined

    // Hidden container for the invisible widget
    const container = document.createElement('div')
    container.style.display = 'none'
    document.body.appendChild(container)

    // Idempotent: every exit path (token, error, timeout) lands here exactly
    // once, so the container and timers are always cleaned up.
    const finish = (token: string | null) => {
      if (settled) return
      settled = true
      clearTimeout(timeoutTimer)
      if (pollTimer !== undefined) clearInterval(pollTimer)
      container.remove()
      resolve(token)
    }

    const timeoutTimer = setTimeout(() => finish(null), TURNSTILE_TIMEOUT_MS)

    const runChallenge = () => {
      if (settled) return
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const turnstile = (window as any).turnstile
        if (!turnstile) {
          finish(null)
          return
        }
        turnstile.render(container, {
          sitekey: TURNSTILE_SITE_KEY,
          callback: (token: string) => finish(token),
          'error-callback': () => finish(null),
          'expired-callback': () => finish(null),
        })
      } catch {
        finish(null)
      }
    }

    try {
      // Inject script once
      if (!document.getElementById('cf-turnstile-script')) {
        const script = document.createElement('script')
        script.id = 'cf-turnstile-script'
        script.src = TURNSTILE_SCRIPT_URL
        script.async = true
        script.onerror = () => finish(null)
        document.head.appendChild(script)
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((window as any).turnstile) {
        runChallenge()
      } else {
        // Poll for the global rather than touching the script's onload:
        // survives the load event having already fired and never clobbers
        // another caller's handler. Bounded by the overall timeout above.
        pollTimer = window.setInterval(() => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if ((window as any).turnstile) {
            if (pollTimer !== undefined) clearInterval(pollTimer)
            runChallenge()
          }
        }, 100)
      }
    } catch {
      finish(null)
    }
  })
}

function readSessionToken(): string | null {
  try {
    return window.sessionStorage.getItem(SESSION_TOKEN_KEY)
  } catch {
    return null
  }
}

function writeSessionToken(value: string | null): void {
  try {
    if (value === null) {
      window.sessionStorage.removeItem(SESSION_TOKEN_KEY)
    } else {
      window.sessionStorage.setItem(SESSION_TOKEN_KEY, value)
    }
  } catch {
    // Storage unavailable
  }
}

export function useChatSession() {
  const { state, dispatch, config } = useChatContext()
  const [storedSessionKey, setStoredSessionKey] = useLocalStorage<string | null>('session_key', null)
  // Access token lives in sessionStorage (not localStorage) to limit exposure.
  // Migration: remove any token previously stored under the localStorage key.
  const [storedAccessToken, setStoredAccessToken] = useState<string | null>(() => {
    localStorage.removeItem(SESSION_TOKEN_KEY)
    return readSessionToken()
  })
  const apiRef = useRef<ApiClient>()
  // Track the active session key to prevent stale restoreSession from
  // overwriting a newer session created while the restore was in-flight.
  const activeSessionKeyRef = useRef<string | null>(null)

  const persistAccessToken = useCallback((value: string | null) => {
    writeSessionToken(value)
    setStoredAccessToken(value)
  }, [])

  if (!apiRef.current) {
    apiRef.current = new ApiClient({ baseUrl: config.apiUrl, token: config.token, region: config.region })
    // Restore chat token from sessionStorage if available
    if (storedAccessToken) {
      apiRef.current.setChatToken(storedAccessToken)
    }
  }

  const api = apiRef.current

  const createSession = useCallback(async (visitorOverrides?: { name?: string; email?: string }) => {
    const metadata = config.mode === 'lead' ? extractVisitorMetadata() : undefined

    // Obtain a Turnstile token; fail open if unavailable
    const turnstileToken = await getTurnstileToken()

    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      const session = await api.createSession({
        source: config.mode === 'lead' ? 'lead_bot' : 'user_bot',
        visitor_name: visitorOverrides?.name || state.visitorName || config.userName,
        visitor_email: visitorOverrides?.email || state.visitorEmail || config.userEmail,
        visitor_metadata: metadata,
        turnstile_token: turnstileToken ?? undefined,
      })

      // Store the chat access token for subsequent requests
      if (session.access_token) {
        api.setChatToken(session.access_token)
        persistAccessToken(session.access_token)
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
  }, [api, config, state.visitorName, state.visitorEmail, dispatch, setStoredSessionKey, persistAccessToken])

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
      persistAccessToken(null)
      api.setChatToken('')
      dispatch({ type: 'SET_LOADING', payload: false })
      return null
    }
  }, [api, dispatch, setStoredSessionKey, persistAccessToken])

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
