import type { ChatMessage, ChatSession, AgentInfo, Announcement, RoadmapItem, KBArticle, TabId, OperatingHoursStatus } from '../types'
import type { ChatAction } from './chatActions'

export interface ChatState {
  session: ChatSession | null
  messages: ChatMessage[]
  isConnected: boolean
  isOpen: boolean
  activeTab: TabId
  unreadCount: number
  agentTyping: { is_typing: boolean; agent_name?: string }
  currentAgent: AgentInfo | null
  announcements: Announcement[]
  roadmapItems: RoadmapItem[]
  kbResults: KBArticle[]
  kbLoading: boolean
  operatingHours: OperatingHoursStatus | null
  visitorName: string
  visitorEmail: string
  loading: boolean
  error: string | null
}

export const initialState: ChatState = {
  session: null,
  messages: [],
  isConnected: false,
  isOpen: false,
  activeTab: 'home',
  unreadCount: 0,
  agentTyping: { is_typing: false },
  currentAgent: null,
  announcements: [],
  roadmapItems: [],
  kbResults: [],
  kbLoading: false,
  operatingHours: null,
  visitorName: '',
  visitorEmail: '',
  loading: false,
  error: null,
}

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_SESSION':
      return { ...state, session: action.payload }

    case 'SET_MESSAGES':
      return { ...state, messages: action.payload }

    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload],
      }

    case 'ACK_MESSAGE':
      return {
        ...state,
        messages: state.messages.map((msg) =>
          msg.temp_id === action.payload.temp_id
            ? { ...msg, id: action.payload.real_id, status: 'sent' as const, temp_id: undefined }
            : msg
        ),
      }

    case 'FAIL_MESSAGE':
      return {
        ...state,
        messages: state.messages.map((msg) =>
          msg.temp_id === action.payload.temp_id
            ? { ...msg, status: 'failed' as const }
            : msg
        ),
      }

    case 'SET_AGENT_TYPING':
      return { ...state, agentTyping: action.payload }

    case 'AGENT_JOINED':
      return { ...state, currentAgent: action.payload }

    case 'SET_CONNECTED':
      return { ...state, isConnected: action.payload }

    case 'SET_TAB':
      return { ...state, activeTab: action.payload }

    case 'SET_OPEN':
      return { ...state, isOpen: action.payload }

    case 'INCREMENT_UNREAD':
      return { ...state, unreadCount: state.unreadCount + 1 }

    case 'RESET_UNREAD':
      return { ...state, unreadCount: 0 }

    case 'SET_ANNOUNCEMENTS':
      return { ...state, announcements: action.payload }

    case 'SET_ROADMAP_ITEMS':
      return { ...state, roadmapItems: action.payload }

    case 'SET_KB_RESULTS':
      return { ...state, kbResults: action.payload, kbLoading: false }

    case 'SET_KB_LOADING':
      return { ...state, kbLoading: action.payload }

    case 'SET_OPERATING_HOURS':
      return { ...state, operatingHours: action.payload }

    case 'SET_VISITOR_INFO':
      return {
        ...state,
        visitorName: action.payload.name ?? state.visitorName,
        visitorEmail: action.payload.email ?? state.visitorEmail,
      }

    case 'SET_LOADING':
      return { ...state, loading: action.payload }

    case 'SET_ERROR':
      return { ...state, error: action.payload }

    default:
      return state
  }
}
