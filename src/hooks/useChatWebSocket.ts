import { useEffect, useRef, useCallback } from 'react'
import { useChatContext } from '../context/ChatContext'
import { ChatWebSocket } from '../services/websocket'
import { WS_PATH, TIMEOUTS } from '../constants'
import { generateUUID } from '../utils/uuid'
import type { WSIncomingMessage, ChatMessage } from '../types'

export function useChatWebSocket(sessionKey: string | null, accessToken?: string | null) {
  const { state, dispatch, config } = useChatContext()
  const wsRef = useRef<ChatWebSocket | null>(null)
  const ackTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  useEffect(() => {
    if (!sessionKey) return

    const wsProtocol = config.apiUrl.startsWith('https') ? 'wss' : 'ws'
    const wsHost = config.apiUrl.replace(/^https?:\/\//, '')
    let wsUrl = `${wsProtocol}://${wsHost}${WS_PATH(sessionKey)}`
    if (accessToken) {
      wsUrl += `?token=${encodeURIComponent(accessToken)}`
    }

    const ws = new ChatWebSocket({
      url: wsUrl,
      onStatusChange: (connected) => {
        dispatch({ type: 'SET_CONNECTED', payload: connected })
      },
      onMessage: (data: WSIncomingMessage) => {
        switch (data.type) {
          case 'history':
            if (data.messages) {
              dispatch({ type: 'SET_MESSAGES', payload: data.messages })
            }
            break

          case 'message':
            if (data.message) {
              dispatch({ type: 'ADD_MESSAGE', payload: data.message })
              // Increment unread if widget is closed or on different tab
              if (!state.isOpen || state.activeTab !== 'messages') {
                dispatch({ type: 'INCREMENT_UNREAD' })
              }
            }
            break

          case 'message_ack':
            if (data.temp_id && data.real_id) {
              dispatch({ type: 'ACK_MESSAGE', payload: { temp_id: data.temp_id, real_id: data.real_id } })
              const timer = ackTimersRef.current.get(data.temp_id)
              if (timer) {
                clearTimeout(timer)
                ackTimersRef.current.delete(data.temp_id)
              }
            }
            break

          case 'agent_joined':
            if (data.agent) {
              dispatch({ type: 'AGENT_JOINED', payload: data.agent })
            }
            break

          case 'agent_typing':
            dispatch({
              type: 'SET_AGENT_TYPING',
              payload: { is_typing: data.is_typing ?? false, agent_name: data.agent_name },
            })
            break

          case 'heartbeat_ack':
            break

          case 'error':
            dispatch({ type: 'SET_ERROR', payload: data.error ?? 'WebSocket error' })
            break
        }
      },
    })

    ws.connect()
    wsRef.current = ws

    const timers = ackTimersRef.current
    return () => {
      ws.disconnect()
      wsRef.current = null
      timers.forEach((timer) => clearTimeout(timer))
      timers.clear()
    }
  }, [sessionKey, accessToken, config.apiUrl]) // eslint-disable-line react-hooks/exhaustive-deps

  const sendMessage = useCallback((text: string) => {
    if (!wsRef.current) return

    const tempId = generateUUID()
    const optimisticMessage: ChatMessage = {
      id: tempId,
      session: 0,
      sender_type: config.mode === 'lead' ? 'visitor' : 'user',
      sender_name: state.visitorName || 'You',
      content: text,
      content_type: 'text',
      attachments: [],
      is_read: true,
      created_at: new Date().toISOString(),
      temp_id: tempId,
      status: 'sending',
    }

    dispatch({ type: 'ADD_MESSAGE', payload: optimisticMessage })

    wsRef.current.send({
      type: 'message',
      text,
      temp_id: tempId,
    })

    // Set ack timeout
    const timer = setTimeout(() => {
      dispatch({ type: 'FAIL_MESSAGE', payload: { temp_id: tempId } })
      ackTimersRef.current.delete(tempId)
    }, TIMEOUTS.MESSAGE_ACK_TIMEOUT)

    ackTimersRef.current.set(tempId, timer)
  }, [config.mode, state.visitorName, dispatch])

  const sendTyping = useCallback((isTyping: boolean) => {
    wsRef.current?.send({ type: 'typing', is_typing: isTyping })
  }, [])

  const requestAgent = useCallback(() => {
    wsRef.current?.send({ type: 'request_agent' })
  }, [])

  const markRead = useCallback((messageId: number) => {
    wsRef.current?.send({ type: 'read', message_id: messageId })
  }, [])

  return {
    isConnected: state.isConnected,
    sendMessage,
    sendTyping,
    requestAgent,
    markRead,
  }
}
