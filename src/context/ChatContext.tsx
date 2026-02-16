import { createContext, useContext, useReducer, useMemo } from 'react'
import type { ReactNode } from 'react'
import type { ChatWidgetProps } from '../types'
import type { ChatAction } from './chatActions'
import { chatReducer, initialState } from './chatReducer'
import type { ChatState } from './chatReducer'

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
    visitorName: config.userName ?? '',
    visitorEmail: config.userEmail ?? '',
  })

  const value = useMemo(
    () => ({ state, dispatch, config }),
    [state, config]
  )

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChatContext(): ChatContextValue {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider')
  }
  return context
}
