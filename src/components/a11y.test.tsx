import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactElement } from 'react'
import { ChatProvider } from '../context/ChatContext'
import type { ChatMessage, ChatWidgetProps, TabId, WhatsNewEntry } from '../types'
import { ChatLauncher } from '../ChatLauncher'
import { TabBar } from './TabBar'
import { MessageBubble } from './MessageBubble'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { WhatsNewCard } from './WhatsNewCard'
import { Badge } from './Badge'
import { AgentAvatar } from './AgentAvatar'
import { ConnectionBanner } from './ConnectionBanner'
import { TypingIndicator } from './TypingIndicator'
import { MessagesTab } from '../tabs/MessagesTab'
import chatWidgetSource from '../ChatWidget.tsx?raw'

// No DOM test environment is installed, so these assert the rendered markup.
const CONFIG: ChatWidgetProps = { mode: 'user', apiUrl: 'https://chat.example.test' }

function render(ui: ReactElement, config: Partial<ChatWidgetProps> = {}): string {
  return renderToStaticMarkup(<ChatProvider {...CONFIG} {...config}>{ui}</ChatProvider>)
}

function tag(html: string, pattern: RegExp): string {
  const match = html.match(pattern)
  expect(match, `no element matching ${pattern}`).not.toBeNull()
  return match![0]
}

function renderTabs(activeTab: TabId, config: Partial<ChatWidgetProps> = {}): string {
  return render(<TabBar activeTab={activeTab} onTabChange={() => {}} />, config)
}

const WHATS_NEW: WhatsNewEntry[] = [
  { id: 'e1', title: 'Bulk marking', summary: 'Mark a class at once.', read_more_url: null, category: 'update', sent_at: '2026-11-01T00:00:00Z' },
]

function renderTabsWithNews(activeTab: TabId): string {
  return renderTabs(activeTab, { whatsNew: WHATS_NEW })
}

describe('TabBar', () => {
  it('test_TabBar_has_no_help_tab_when_rendered', () => {
    const html = renderTabsWithNews('messages')

    expect(html).not.toContain('>Help</span></button>')
    expect(html.match(/role="tab"/g)).toHaveLength(2)
  })

  it('test_TabBar_help_link_opens_help_site_in_new_tab_when_rendered', () => {
    const html = renderTabs('messages')

    const link = tag(html, /<a[^>]*>/)
    expect(link).toContain('href="https://help.acrux.education"')
    expect(link).toContain('target="_blank"')
    expect(link).toContain('rel="noopener noreferrer"')
  })

  it('test_TabBar_help_link_says_it_opens_a_new_tab_when_rendered', () => {
    const html = renderTabs('messages')

    expect(tag(html, /<a[^>]*>[\s\S]*?<\/a>/)).toContain('<span class="acx:sr-only"> (opens in a new tab)</span>')
  })

  it('test_TabBar_help_link_is_outside_the_tablist_when_rendered', () => {
    const html = renderTabsWithNews('messages')

    const tablist = tag(html, /<nav[^>]*role="tablist"[^>]*>[\s\S]*?<\/nav>/)
    expect(tablist).not.toContain('<a')
  })
})

describe('ChatLauncher', () => {
  it('test_ChatLauncher_is_named_open_help_when_closed_with_no_unread', () => {
    const html = render(<ChatLauncher isOpen={false} onClick={() => {}} position="bottom-right" />)

    expect(tag(html, /<button[^>]*>/)).toContain('aria-label="Open help"')
  })

  it('test_ChatLauncher_is_named_close_help_when_open', () => {
    const html = render(<ChatLauncher isOpen onClick={() => {}} position="bottom-right" />)

    expect(tag(html, /<button[^>]*>/)).toContain('aria-label="Close help"')
  })

  it('test_ChatLauncher_is_44px_when_rendered', () => {
    const html = render(<ChatLauncher isOpen={false} onClick={() => {}} position="bottom-right" />)

    const button = tag(html, /<button[^>]*>/)
    expect(button).toContain('acx:w-11')
    expect(button).toContain('acx:h-11')
  })
})

// PLATDEV-1684 (WCAG 2.2 AA). Example data only.
const NOW = new Date('2026-11-28T10:00:00Z')

const MESSAGE: ChatMessage = {
  id: 1, session: 1, sender_type: 'agent', sender_name: 'Sarah Lee', content: 'Hello Jane', content_type: 'text',
  attachments: [], is_read: true, created_at: '2026-11-28T09:58:00Z',
}

function bubble(overrides: Partial<ChatMessage>): string {
  return renderToStaticMarkup(<MessageBubble message={{ ...MESSAGE, ...overrides }} />)
}

describe('PLATDEV-1684 chat', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
    // MessagesTab reads its session token from storage while rendering.
    const store = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => { store.set(k, v) },
      removeItem: (k: string) => { store.delete(k) },
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  // signin-chat-v1: 1.4.3, gray-400 (2.60:1) -> gray-500 (4.84:1)
  it('test_MessageBubble_timestamp_is_gray_500_when_rendered', () => {
    const html = bubble({})

    expect(tag(html, /<span class="[^"]*">2m ago<\/span>/)).toContain('acx:text-gray-500')
  })

  it('test_MessageBubble_auto_response_timestamp_is_gray_500_when_rendered', () => {
    const html = bubble({ sender_type: 'system', content_type: 'auto_response' })

    expect(tag(html, /<span class="[^"]*">2m ago<\/span>/)).toContain('acx:text-gray-500')
  })

  it('test_MessageBubble_system_line_is_gray_500_when_rendered', () => {
    const html = bubble({ sender_type: 'system', content: 'Sarah joined the chat' })

    expect(tag(html, /<span class="[^"]*">Sarah joined the chat<\/span>/)).toContain('acx:text-gray-500')
  })

  it('test_MessageBubble_sending_is_gray_500_when_message_is_sending', () => {
    const html = bubble({ sender_type: 'visitor', status: 'sending' })

    expect(tag(html, /<span class="[^"]*">Sending\.\.\.<\/span>/)).toContain('acx:text-gray-500')
  })

  it('test_MessageList_date_pill_is_gray_500_when_rendered', () => {
    const html = renderToStaticMarkup(<MessageList messages={[MESSAGE]} agentTyping={{ is_typing: false }} />)

    expect(tag(html, /<span class="[^"]*acx:rounded-full[^"]*">Today<\/span>/)).toContain('acx:text-gray-500')
  })

  it('test_MessagesTab_away_line_is_gray_500_when_offline_with_no_messages', () => {
    const html = render(<MessagesTab />)

    expect(tag(html, /<p class="[^"]*">Our team is currently away/)).toContain('acx:text-gray-500')
  })

  it('test_WhatsNewCard_timestamp_is_gray_500_when_rendered', () => {
    const html = renderToStaticMarkup(<WhatsNewCard entry={{ ...WHATS_NEW[0]!, sent_at: '2026-11-28T09:58:00Z' }} />)

    expect(tag(html, /<span class="[^"]*">2m ago<\/span>/)).toContain('acx:text-gray-500')
  })

  it('test_TabBar_unselected_tab_is_gray_500_when_rendered', () => {
    const html = renderTabsWithNews('messages')

    expect(tag(html, /<button[^>]*>(?:(?!<\/button>)[\s\S])*What&#x27;s new/)).toContain('acx:text-gray-500')
  })

  it('test_MessageInput_placeholder_is_gray_500_when_rendered', () => {
    const html = render(<MessageInput onSend={() => {}} mode="user" />)

    expect(tag(html, /<textarea[^>]*>/)).toContain('acx:placeholder:text-gray-500')
  })

  // signin-chat-v2: 1.4.1, the selected tab gets a bar as well as colour
  it('test_TabBar_selected_tab_has_primary_bar_when_rendered', () => {
    const html = renderTabsWithNews('messages')

    const selected = tag(html, /<button[^>]*aria-selected="true"[^>]*>/)
    expect(selected).toContain('acx:border-b-2')
    expect(selected).toContain('acx:border-primary-600')
  })

  it('test_TabBar_unselected_tab_has_transparent_bar_when_rendered', () => {
    const html = renderTabsWithNews('messages')

    const unselected = tag(html, /<button[^>]*aria-selected="false"[^>]*>/)
    expect(unselected).toContain('acx:border-b-2')
    expect(unselected).toContain('acx:border-transparent')
  })

  // signin-chat-v3: 1.4.3, red-500 (3.81:1) -> red-600 (4.77:1)
  it('test_Badge_is_red_600_when_count_is_positive', () => {
    const html = renderToStaticMarkup(<Badge count={3} />)

    expect(html).toContain('acx:bg-red-600')
  })

  it('test_MessageBubble_failed_is_red_600_when_message_failed', () => {
    const html = bubble({ sender_type: 'visitor', status: 'failed' })

    expect(tag(html, /<span class="[^"]*">Failed<\/span>/)).toContain('acx:text-red-600')
  })

  // signin-chat-v4: 1.4.3, white initials pass 4.5:1 on every avatar colour
  it.each([
    ['blue', 'acx:bg-blue-600'],
    ['green', 'acx:bg-green-700'],
    ['purple', 'acx:bg-purple-600'],
    ['orange', 'acx:bg-orange-700'],
    ['pink', 'acx:bg-pink-600'],
    ['teal', 'acx:bg-teal-700'],
  ])('test_AgentAvatar_uses_passing_%s_shade_when_rendered', (_hue, expected) => {
    const seen = new Set<string>()
    for (let i = 0; i < 200; i++) {
      const cls = renderToStaticMarkup(<AgentAvatar name={`Agent ${i}`} />).match(/acx:bg-[a-z]+-\d+/)![0]
      seen.add(cls)
    }

    expect(seen).toContain(expected)
    expect([...seen].some((c) => c.endsWith('-500'))).toBe(false)
  })

  // signin-chat-v5: 1.4.10, the panel fills and scrolls below 500px tall
  it('test_ChatWidget_panel_fills_and_scrolls_when_viewport_is_short', () => {
    for (const cls of ['inset-0!', 'h-auto!', 'max-h-none!', 'w-auto!', 'max-w-none!', 'rounded-none!', 'overflow-y-auto!', 'flex-none!', 'min-h-[16rem]!']) {
      expect(chatWidgetSource).toContain(`acx:[@media(max-height:499px)]:${cls}`)
    }
  })

  // signin-chat-v11: 1.4.3, Refresh on hover 4.42:1 -> red-800 5.75:1
  it('test_ConnectionBanner_refresh_is_red_800_on_hover_when_connection_lost', () => {
    const html = renderToStaticMarkup(<ConnectionBanner isConnected={false} retryCount={5} />)

    expect(tag(html, /<button[^>]*>/)).toContain('acx:hover:text-red-800')
  })

  // signin-chat-i2: 1.3.1, the unread count is in the launcher's name
  it('test_ChatLauncher_name_includes_unread_count_when_messages_are_unread', async () => {
    // The provider starts at 0 unread and a server render runs no effects,
    // so the context is stubbed with two unread messages.
    vi.resetModules()
    vi.doMock('../context/ChatContext', () => ({ useChatContext: () => ({ state: { unreadCount: 2 } }) }))
    const { ChatLauncher: Launcher } = await import('../ChatLauncher')
    vi.doUnmock('../context/ChatContext')

    const html = renderToStaticMarkup(<Launcher isOpen={false} onClick={() => {}} position="bottom-right" />)

    expect(tag(html, /<button[^>]*>/)).toContain('aria-label="Open help, 2 unread messages"')
  })

  // signin-chat-i3: 1.3.1, who sent each message is in text
  it('test_MessageBubble_starts_with_sr_only_You_when_visitor_sent_it', () => {
    const html = bubble({ sender_type: 'visitor', sender_name: 'Jane' })

    expect(html).toContain('<span class="acx:sr-only">You: </span><p class="acx:whitespace-pre-wrap">Hello Jane</p>')
  })

  it('test_MessageBubble_starts_with_sr_only_Acrux_when_agent_has_no_name', () => {
    const html = bubble({ sender_name: '' })

    expect(html).toContain('<span class="acx:sr-only">Acrux: </span><p class="acx:whitespace-pre-wrap">Hello Jane</p>')
  })

  it('test_MessageBubble_auto_response_starts_with_sr_only_Acrux_when_unnamed', () => {
    const html = bubble({ sender_type: 'system', content_type: 'auto_response', sender_name: '' })

    expect(html).toContain('<span class="acx:sr-only">Acrux: </span><p class="acx:whitespace-pre-wrap">Hello Jane</p>')
  })

  it('test_MessageBubble_has_no_sr_only_prefix_when_agent_is_named', () => {
    const html = bubble({})

    expect(html).not.toContain('acx:sr-only')
  })

  // signin-chat-i4 / i6: 4.1.3, Sending... and Failed are in an always-mounted status
  it('test_MessageBubble_status_region_is_mounted_when_visitor_message_is_sent', () => {
    const html = bubble({ sender_type: 'visitor', status: 'sent' })

    expect(html).toContain('<span role="status" class="acx:text-[10px] acx:[&amp;:not(:empty)]:ml-1"></span>')
  })

  it.each([['sending', 'Sending...'], ['failed', 'Failed']] as const)(
    'test_MessageBubble_status_region_holds_text_when_message_is_%s',
    (status, text) => {
      const html = bubble({ sender_type: 'visitor', status })

      expect(tag(html, /<span role="status"[^>]*>[\s\S]*?<\/span><\/span>/)).toContain(`>${text}</span>`)
    },
  )

  // signin-chat-i5: 4.1.3, the connection banners sit in an always-mounted status
  it('test_MessagesTab_connection_banner_region_is_mounted_when_connected', () => {
    const html = render(<MessagesTab />)

    expect(html).toContain('<div role="status"></div>')
  })

  // signin-chat-i7: 1.1.1, the typing dots have a text alternative
  it('test_TypingIndicator_dots_are_named_when_agent_is_typing', () => {
    const html = renderToStaticMarkup(<TypingIndicator agentName="Sarah Lee" />)

    expect(html).toContain('role="img" aria-label="Sarah Lee is typing"')
  })

  it('test_TypingIndicator_dots_name_falls_back_to_Agent_when_name_missing', () => {
    const html = renderToStaticMarkup(<TypingIndicator />)

    expect(html).toContain('aria-label="Agent is typing"')
  })
})
