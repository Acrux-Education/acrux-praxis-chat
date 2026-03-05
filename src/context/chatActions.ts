import type { ChatMessage, ChatSession, AgentInfo, Announcement, RoadmapItem, KBArticle, KBTopic, TabId, OperatingHoursStatus } from '../types'

export type ChatAction =
  | { type: 'SET_SESSION'; payload: ChatSession }
  | { type: 'SET_MESSAGES'; payload: ChatMessage[] }
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'ACK_MESSAGE'; payload: { temp_id: string; real_id: number } }
  | { type: 'FAIL_MESSAGE'; payload: { temp_id: string } }
  | { type: 'SET_AGENT_TYPING'; payload: { is_typing: boolean; agent_name?: string } }
  | { type: 'AGENT_JOINED'; payload: AgentInfo }
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_TAB'; payload: TabId }
  | { type: 'SET_OPEN'; payload: boolean }
  | { type: 'INCREMENT_UNREAD' }
  | { type: 'RESET_UNREAD' }
  | { type: 'SET_ANNOUNCEMENTS'; payload: Announcement[] }
  | { type: 'SET_ROADMAP_ITEMS'; payload: RoadmapItem[] }
  | { type: 'SET_KB_TOPICS'; payload: KBTopic[] }
  | { type: 'SET_KB_RESULTS'; payload: KBArticle[] }
  | { type: 'SET_KB_LOADING'; payload: boolean }
  | { type: 'SET_OPERATING_HOURS'; payload: OperatingHoursStatus }
  | { type: 'SET_VISITOR_INFO'; payload: { name?: string; email?: string } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_WS_RETRY_COUNT'; payload: number }
