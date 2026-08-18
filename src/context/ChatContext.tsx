import { createContext, useContext, useReducer, useMemo, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import type { ChatWidgetProps } from '../types'
import type { ChatAction } from './chatActions'
import { chatReducer, initialState } from './chatReducer'
import type { ChatState } from './chatReducer'
import { ApiClient } from '../services/api'
import { toArray } from '../utils/toArray'
import { useOperatingHours } from '../hooks/useOperatingHours'

interface ChatContextValue {
  state: ChatState
  dispatch: React.Dispatch<ChatAction>
  config: ChatWidgetProps
}

const ChatContext = createContext<ChatContextValue | null>(null)

interface ChatProviderProps extends ChatWidgetProps {
  children: ReactNode
}

export function ChatProvider({ children, ...config }: ChatProviderProps) {
  const [state, dispatch] = useReducer(chatReducer, {
    ...initialState,
    activeTab: config.defaultTab ?? initialState.activeTab,
    visitorName: config.userName ?? '',
    visitorEmail: config.userEmail ?? '',
  })

  const value = useMemo(
    () => ({ state, dispatch, config }),
    [state, config]
  )

  return (
    <ChatContext.Provider value={value}>
      <ContentFetcher />
      <OperatingHoursFetcher />
      {children}
    </ChatContext.Provider>
  )
}

function ContentFetcher() {
  const { dispatch, config } = useChatContext()
  const fetchedRef = useRef(false)

  useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true

    const api = new ApiClient({ baseUrl: config.apiUrl, token: config.token, region: config.region })

    api.getAnnouncements()
      .then((data) => dispatch({ type: 'SET_ANNOUNCEMENTS', payload: toArray(data) }))
      .catch(() => {})

    api.getRoadmapItems()
      .then((data) => dispatch({ type: 'SET_ROADMAP_ITEMS', payload: toArray(data) }))
      .catch(() => {})

    api.getKBTopics()
      .then((data) => dispatch({ type: 'SET_KB_TOPICS', payload: toArray(data) }))
      .catch(() => {})

  }, [config.apiUrl, config.token, config.region, dispatch])

  return null
}

function OperatingHoursFetcher() {
  useOperatingHours()
  return null
}

export function useChatContext(): ChatContextValue {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider')
  }
  return context
}
