export type WidgetMode = 'lead' | 'user'

export type TabId = 'home' | 'messages' | 'news' | 'roadmap' | 'help'

export type WidgetPosition = 'bottom-right' | 'bottom-left'

export interface ChatWidgetProps {
  mode: WidgetMode
  apiUrl: string
  token?: string
  userName?: string
  userEmail?: string
  schoolId?: string
  position?: WidgetPosition
  greeting?: string
  defaultTab?: TabId
  onSessionCreated?: (sessionKey: string) => void
}

export interface StandaloneInitOptions {
  mode: WidgetMode
  apiUrl: string
  position?: WidgetPosition
  greeting?: string
  defaultTab?: TabId
  containerId?: string
}

export type SessionStatus = 'active' | 'waiting' | 'assigned' | 'resolved' | 'abandoned'

export type SenderType = 'visitor' | 'user' | 'agent' | 'bot' | 'system'

export type ContentType = 'text' | 'markdown' | 'card'

export interface ChatSession {
  id: number
  session_key: string
  access_token?: string
  visitor_name: string
  visitor_email: string
  visitor_metadata: Record<string, string>
  source: 'lead_bot' | 'user_bot' | 'agent_initiated'
  status: SessionStatus
  assigned_agent: AgentInfo | null
  created_at: string
  updated_at: string
  message_count: number
}

export interface ChatMessage {
  id: number | string
  session: number
  sender_type: SenderType
  sender_name: string
  content: string
  content_type: ContentType
  rich_content?: RichContent
  attachments: Attachment[]
  is_read: boolean
  created_at: string
  temp_id?: string
  status?: 'sending' | 'sent' | 'failed'
}

export interface RichContent {
  type: 'article_card' | 'buttons'
  article_id?: number
  title?: string
  url?: string
  buttons?: RichButton[]
}

export interface RichButton {
  label: string
  action: string
}

export interface Attachment {
  name: string
  url: string
  type: string
  size?: number
}

export interface AgentInfo {
  id: number
  name: string
  avatar_url?: string
}

export interface Announcement {
  id: number
  title: string
  summary: string
  content: string
  image_url: string
  category: 'feature' | 'improvement' | 'update' | 'maintenance' | 'event'
  published_at: string
  is_pinned: boolean
}

export interface RoadmapItem {
  id: number
  title: string
  description: string
  status: 'planned' | 'in_progress' | 'beta' | 'released'
  quarter: string
  category: 'assessment' | 'marking' | 'reports' | 'integrations' | 'platform'
}

export interface KBArticle {
  id: number
  slug: string
  title: string
  summary: string
  topic: string
  url: string
  relevance?: number
}

export interface KBTopic {
  id: number
  name: string
  slug: string
  article_count: number
  icon?: string
}

export interface OperatingHoursStatus {
  is_online: boolean
  next_open?: string
  timezone?: string
  offline_message?: string
  response_time?: string
}

export interface VisitorMetadata {
  page_url: string
  referrer: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  [key: string]: string | undefined
}

export interface WSIncomingMessage {
  type: 'history' | 'message' | 'message_ack' | 'agent_joined' | 'agent_typing' | 'heartbeat_ack' | 'error'
  messages?: ChatMessage[]
  message?: ChatMessage
  temp_id?: string
  real_id?: number
  agent?: AgentInfo
  is_typing?: boolean
  agent_name?: string
  error?: string
}

export interface WSOutgoingMessage {
  type: 'message' | 'typing' | 'read' | 'request_agent' | 'heartbeat'
  text?: string
  temp_id?: string
  is_typing?: boolean
  message_id?: number
}
