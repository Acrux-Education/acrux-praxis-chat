import { useState, useCallback, useRef, useEffect } from 'react'
import { useChatContext } from '../context/ChatContext'
import { useChatSession } from '../hooks/useChatSession'
import { useChatWebSocket } from '../hooks/useChatWebSocket'
import { MessageList } from '../components/MessageList'
import { MessageInput } from '../components/MessageInput'
import { StatusBanner } from '../components/StatusBanner'
import { ConnectionBanner } from '../components/ConnectionBanner'
import { LeadCaptureForm } from '../components/LeadCaptureForm'

export function MessagesTab() {
  const { state, dispatch, config } = useChatContext()
  const { session, sessionKey, accessToken, createSession } = useChatSession()
  const { sendMessage, sendTyping, isConnected } = useChatWebSocket(sessionKey, accessToken)
  const isOnline = state.operatingHours?.is_online ?? false
  const offlineMessage = state.operatingHours?.offline_message
  const responseTime = state.operatingHours?.response_time
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
      // Pass visitor data directly to avoid React async state race condition
      await createSession({ name: data.name, email: data.email })
    } catch {
      pendingMessageRef.current = null
    }
  }, [createSession, dispatch])

  // Reset unread when viewing messages tab
  useEffect(() => {
    if (state.unreadCount > 0 && state.activeTab === 'messages') {
      dispatch({ type: 'RESET_UNREAD' })
    }
  }, [state.unreadCount, state.activeTab, dispatch])

  if (showLeadCapture && !session) {
    return (
      <div className="acx:flex acx:flex-col acx:h-full">
        <ConnectionBanner isConnected={isConnected} retryCount={state.wsRetryCount} />
        <StatusBanner isOnline={isOnline} offlineMessage={offlineMessage} responseTime={responseTime} />
        <LeadCaptureForm onSubmit={handleLeadCapture} loading={state.loading} />
      </div>
    )
  }

  return (
    <div className="acx:flex acx:flex-col acx:h-full">
      <ConnectionBanner isConnected={isConnected} retryCount={state.wsRetryCount} />
      <StatusBanner isOnline={isOnline} offlineMessage={offlineMessage} responseTime={responseTime} />

      {state.messages.length === 0 && !session ? (
        <div className="acx:flex-1 acx:flex acx:flex-col acx:items-center acx:justify-center acx:px-6 acx:text-center">
          {isOnline ? (
            <>
              <p className="acx:text-lg acx:font-semibold acx:text-gray-800 acx:mb-1">{config.greeting || 'Hi there! How can we help?'}</p>
              <p className="acx:text-sm acx:text-gray-500">Send a message to start a conversation</p>
            </>
          ) : (
            <>
              <div className="acx:w-12 acx:h-12 acx:bg-amber-100 acx:rounded-full acx:flex acx:items-center acx:justify-center acx:mb-3">
                <svg className="acx:w-6 acx:h-6 acx:text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H6l-4 4V6c0-1.1.9-2 2-2z" />
                  <path d="M12 11v1" />
                  <path d="M12 8h.01" />
                </svg>
              </div>
              <p className="acx:text-sm acx:text-gray-600 acx:font-medium">Leave us a message</p>
              <p className="acx:text-xs acx:text-gray-400 acx:mt-1">
                Our team is currently away. Leave a message and we'll get back to you
                {responseTime ? ` ${responseTime}` : ' as soon as possible'}.
              </p>
            </>
          )}
        </div>
      ) : (
        <MessageList messages={state.messages} agentTyping={state.agentTyping} />
      )}

      <MessageInput
        onSend={handleSend}
        onTyping={sendTyping}
        mode={config.mode}
        disabled={state.loading}
        placeholder={isOnline ? 'Type a message...' : 'Leave a message...'}
      />
    </div>
  )
}
