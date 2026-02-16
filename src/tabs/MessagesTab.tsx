import { useState, useCallback, useRef, useEffect } from 'react'
import { useChatContext } from '../context/ChatContext'
import { useChatSession } from '../hooks/useChatSession'
import { useChatWebSocket } from '../hooks/useChatWebSocket'
import { useOperatingHours } from '../hooks/useOperatingHours'
import { MessageList } from '../components/MessageList'
import { MessageInput } from '../components/MessageInput'
import { StatusBanner } from '../components/StatusBanner'
import { LeadCaptureForm } from '../components/LeadCaptureForm'

export function MessagesTab() {
  const { state, dispatch, config } = useChatContext()
  const { session, sessionKey, createSession, updateVisitorInfo } = useChatSession()
  const { sendMessage, sendTyping, isConnected } = useChatWebSocket(sessionKey)
  const { isOnline, offlineMessage, responseTime } = useOperatingHours()
  const [showLeadCapture, setShowLeadCapture] = useState(false)
  const pendingMessageRef = useRef<string | null>(null)

  // Send pending message once WebSocket connects after session creation
  useEffect(() => {
    if (isConnected && pendingMessageRef.current) {
      sendMessage(pendingMessageRef.current)
      pendingMessageRef.current = null
    }
  }, [isConnected, sendMessage])

  const handleSend = useCallback(async (text: string) => {
    if (!session) {
      if (config.mode === 'lead' && !state.visitorEmail) {
        pendingMessageRef.current = text
        setShowLeadCapture(true)
        return
      }
      try {
        pendingMessageRef.current = text
        await createSession()
        // Message will be sent by the useEffect once WS connects
      } catch {
        pendingMessageRef.current = null
      }
      return
    }
    sendMessage(text)
  }, [session, config.mode, state.visitorEmail, createSession, sendMessage])

  const handleLeadCapture = useCallback(async (data: { name: string; email: string }) => {
    dispatch({ type: 'SET_VISITOR_INFO', payload: data })
    setShowLeadCapture(false)
    try {
      const newSession = await createSession()
      if (newSession) {
        await updateVisitorInfo(data.name, data.email)
      }
      // Pending message will be sent by useEffect once WS connects
    } catch {
      pendingMessageRef.current = null
    }
  }, [createSession, updateVisitorInfo, dispatch])

  // Reset unread when viewing messages tab
  useEffect(() => {
    if (state.unreadCount > 0 && state.activeTab === 'messages') {
      dispatch({ type: 'RESET_UNREAD' })
    }
  }, [state.unreadCount, state.activeTab, dispatch])

  if (showLeadCapture && !session) {
    return (
      <div className="acx-flex acx-flex-col acx-h-full">
        <StatusBanner isOnline={isOnline} offlineMessage={offlineMessage} responseTime={responseTime} />
        <LeadCaptureForm onSubmit={handleLeadCapture} loading={state.loading} />
      </div>
    )
  }

  return (
    <div className="acx-flex acx-flex-col acx-h-full">
      <StatusBanner isOnline={isOnline} offlineMessage={offlineMessage} responseTime={responseTime} />

      {state.messages.length === 0 && !session ? (
        <div className="acx-flex-1 acx-flex acx-flex-col acx-items-center acx-justify-center acx-px-6 acx-text-center">
          <div className="acx-w-12 acx-h-12 acx-bg-primary-100 acx-rounded-full acx-flex acx-items-center acx-justify-center acx-mb-3">
            <svg className="acx-w-6 acx-h-6 acx-text-primary-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <p className="acx-text-sm acx-text-gray-600 acx-font-medium">No messages yet</p>
          <p className="acx-text-xs acx-text-gray-400 acx-mt-1">Send a message to start a conversation</p>
        </div>
      ) : (
        <MessageList messages={state.messages} agentTyping={state.agentTyping} />
      )}

      <MessageInput
        onSend={handleSend}
        onTyping={sendTyping}
        mode={config.mode}
        disabled={state.loading}
      />
    </div>
  )
}
