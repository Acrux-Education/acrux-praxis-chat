export const TURNSTILE_SITE_KEY = '0x4AAAAAADHbxC4Cc2tAgr_N'

export const API_PATHS = {
  SESSIONS: '/api/chat/sessions/',
  SESSION: (key: string) => `/api/chat/sessions/${key}/`,
  SESSION_MESSAGES: (key: string) => `/api/chat/sessions/${key}/messages/`,
  SESSION_VISITOR: (key: string) => `/api/chat/sessions/${key}/visitor/`,
  ANNOUNCEMENTS: '/api/chat/announcements/',
  ROADMAP: '/api/chat/roadmap/',
  KB_SEARCH: '/api/kb/chatbot/search/',
  KB_ANSWER: '/api/kb/chatbot/answer/',
  KB_TOPICS: '/api/kb/topics/',
  KB_TOPIC_ARTICLES: (slug: string) => `/api/kb/topics/${slug}/articles/`,
  OPERATING_HOURS: '/api/chat/operating-hours/status/',
} as const

export const WS_PATH = (sessionKey: string) => `/ws/chat/${sessionKey}/`

export const DEFAULTS = {
  POSITION: 'bottom-right' as const,
  GREETING: 'Hi there! How can we help?',
  WIDGET_WIDTH: 380,
  WIDGET_HEIGHT: 600,
  LAUNCHER_SIZE: 60,
} as const

export const TIMEOUTS = {
  WS_RECONNECT_BASE: 1000,
  WS_RECONNECT_MAX: 30000,
  WS_HEARTBEAT_INTERVAL: 30000,
  MESSAGE_ACK_TIMEOUT: 5000,
  SEARCH_DEBOUNCE: 300,
  TYPING_DEBOUNCE: 1000,
  TYPING_TIMEOUT: 3000,
} as const

export const LIMITS = {
  MAX_FILE_SIZE_MB: 5,
  MAX_FILES_PER_MESSAGE: 3,
  MAX_MESSAGE_LENGTH: 5000,
  ALLOWED_FILE_TYPES: [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/gif',
    'image/webp',
    'application/pdf',
  ],
} as const
