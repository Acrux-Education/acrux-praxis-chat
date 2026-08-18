import type { ChatSession, ChatMessage, Announcement, RoadmapItem, KBArticle, KBAnswer, KBTopic, OperatingHoursStatus, VisitorMetadata, ChatRegion } from '../types'
import { API_PATHS } from '../constants'

interface ApiClientConfig {
  baseUrl: string
  token?: string
  region?: ChatRegion
}

export class ApiClient {
  private baseUrl: string
  private token?: string
  private chatToken?: string
  private region?: ChatRegion

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '')
    this.token = config.token
    this.region = config.region
  }

  setToken(token: string) {
    this.token = token
  }

  setChatToken(chatToken: string) {
    this.chatToken = chatToken
  }

  getChatToken(): string | undefined {
    return this.chatToken
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    if (this.chatToken) {
      headers['X-Chat-Token'] = this.chatToken
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '')
      throw new ApiError(response.status, response.statusText, errorBody)
    }

    if (response.status === 204) {
      return undefined as T
    }

    return response.json()
  }

  async createSession(data: {
    source: 'lead_bot' | 'user_bot'
    visitor_name?: string
    visitor_email?: string
    visitor_metadata?: VisitorMetadata
    turnstile_token?: string
  }): Promise<ChatSession> {
    return this.request<ChatSession>(API_PATHS.SESSIONS, {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        ...(this.region ? { region: this.region } : {}),
      }),
    })
  }

  async getSession(sessionKey: string): Promise<ChatSession & { messages: ChatMessage[] }> {
    return this.request(API_PATHS.SESSION(sessionKey))
  }

  async sendMessage(sessionKey: string, data: {
    content: string
    sender_type: 'visitor' | 'user'
    temp_id?: string
  }): Promise<ChatMessage> {
    return this.request<ChatMessage>(API_PATHS.SESSION_MESSAGES(sessionKey), {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateVisitor(sessionKey: string, data: {
    visitor_name?: string
    visitor_email?: string
    visitor_metadata?: Partial<VisitorMetadata>
  }): Promise<void> {
    return this.request(API_PATHS.SESSION_VISITOR(sessionKey), {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async getAnnouncements(): Promise<Announcement[]> {
    return this.request<Announcement[]>(API_PATHS.ANNOUNCEMENTS)
  }

  async getRoadmapItems(): Promise<RoadmapItem[]> {
    return this.request<RoadmapItem[]>(API_PATHS.ROADMAP)
  }

  async searchKB(query: string): Promise<KBArticle[]> {
    const params = new URLSearchParams({ q: query })
    return this.request<KBArticle[]>(`${API_PATHS.KB_SEARCH}?${params}`)
  }

  async askKB(question: string, sessionId?: string): Promise<KBAnswer> {
    return this.request<KBAnswer>(API_PATHS.KB_ANSWER, {
      method: 'POST',
      body: JSON.stringify({ question, session_id: sessionId ?? '' }),
    })
  }

  async getKBTopics(): Promise<KBTopic[]> {
    return this.request<KBTopic[]>(API_PATHS.KB_TOPICS)
  }

  async getKBTopicArticles(slug: string): Promise<KBArticle[]> {
    return this.request<KBArticle[]>(API_PATHS.KB_TOPIC_ARTICLES(slug))
  }

  async getOperatingHoursStatus(): Promise<OperatingHoursStatus> {
    const params = this.region ? `?${new URLSearchParams({ region: this.region })}` : ''
    return this.request<OperatingHoursStatus>(`${API_PATHS.OPERATING_HOURS}${params}`)
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public body: string,
  ) {
    super(`API Error ${status}: ${statusText}`)
    this.name = 'ApiError'
  }
}
