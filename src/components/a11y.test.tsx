import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactElement } from 'react'
import { ChatProvider } from '../context/ChatContext'
import type { ChatMessage, ChatWidgetProps, TabId, WhatsNewEntry } from '../types'
import { MessageBubble } from './MessageBubble'
import { ChatLauncher } from '../ChatLauncher'
import { TabBar } from './TabBar'
import { MessageInput } from './MessageInput'
import { MessageList } from './MessageList'
import { LeadCaptureForm } from './LeadCaptureForm'
import { panelClasses, TABPANEL_CLASSES } from './panelLayout'
import panelLayoutSource from './panelLayout.ts?raw'

// No DOM test environment is installed (see report), so these assert the
// rendered accessibility markup; focus and key handling are covered by the
// pure helpers in utils/a11y.test.ts.
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
  return render(<TabBar activeTab={activeTab} onTabChange={() => {}} idBase="w" panelId="w-panel" />, config)
}

const WHATS_NEW: WhatsNewEntry[] = [
  { id: 'e1', title: 'Bulk marking', summary: 'Mark a class at once.', read_more_url: null, category: 'update', sent_at: '2026-11-01T00:00:00Z' },
]

function renderTabsWithNews(activeTab: TabId): string {
  return renderTabs(activeTab, { whatsNew: WHATS_NEW })
}

describe('TabBar', () => {
  it('test_TabBar_selected_tab_controls_panel_and_holds_tab_stop_when_rendered', () => {
    const html = renderTabsWithNews('news')

    const news = tag(html, /<button[^>]*id="w-tab-news"[^>]*>/)
    expect(news).toContain('role="tab"')
    expect(news).toContain('aria-selected="true"')
    expect(news).toContain('aria-controls="w-panel"')
    expect(news).toContain('tabindex="0"')
  })

  it('test_TabBar_unselected_tab_has_no_controls_and_no_tab_stop_when_rendered', () => {
    const html = renderTabsWithNews('news')

    const messages = tag(html, /<button[^>]*id="w-tab-messages"[^>]*>/)
    expect(messages).toContain('aria-selected="false"')
    expect(messages).not.toContain('aria-controls')
    expect(messages).toContain('tabindex="-1"')
  })

  it('test_TabBar_first_tab_holds_tab_stop_when_active_tab_is_not_shown', () => {
    const html = renderTabs('news')

    expect(tag(html, /<button[^>]*id="w-tab-messages"[^>]*>/)).toContain('tabindex="0"')
  })

  it('test_TabBar_tablist_is_named_when_rendered', () => {
    expect(tag(renderTabs('messages'), /<nav[^>]*>/)).toContain('aria-label="Chat sections"')
  })

  it('test_TabBar_has_no_help_tab_when_rendered', () => {
    const html = renderTabsWithNews('messages')

    expect(html).not.toContain('id="w-tab-help"')
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

describe('MessageInput', () => {
  // Focus staying in the box after a send can only be checked live (no DOM
  // environment); this checks the box is never disabled under focus.
  it('test_MessageInput_textarea_is_read_only_not_disabled_while_a_send_is_in_flight', () => {
    const textarea = tag(renderToStaticMarkup(<MessageInput onSend={() => {}} mode="user" disabled />), /<textarea[^>]*>/)

    expect(textarea).toContain('readOnly=""')
    expect(textarea).toContain('aria-disabled="true"')
    expect(textarea).not.toMatch(/\sdisabled=""/)
  })

  it('test_MessageInput_textarea_is_named_by_visible_label_when_rendered', () => {
    const html = renderToStaticMarkup(<MessageInput onSend={() => {}} mode="user" />)

    const id = tag(html, /<textarea[^>]*>/).match(/id="([^"]+)"/)?.[1]
    expect(id).toBeTruthy()
    expect(html).toContain(`<label for="${id}" class="acx:block acx:text-xs acx:font-medium acx:text-gray-600">Message</label>`)
  })
})

describe('TabBar selected cue', () => {
  it('test_TabBar_selected_tab_has_bar_and_bold_label_when_rendered', () => {
    const html = renderTabsWithNews('news')

    const news = tag(html, /<button[^>]*id="w-tab-news"[^>]*>[\s\S]*?<\/button>/)
    expect(news).toContain('acx:border-primary-600')
    expect(news).toContain('acx:font-semibold')
  })

  it('test_TabBar_unselected_tab_has_no_bar_or_bold_label_when_rendered', () => {
    const html = renderTabsWithNews('news')

    const messages = tag(html, /<button[^>]*id="w-tab-messages"[^>]*>[\s\S]*?<\/button>/)
    expect(messages).toContain('acx:border-transparent')
    expect(messages).not.toContain('acx:font-semibold')
  })
})

describe('MessageBubble', () => {
  it('test_MessageBubble_attachment_link_is_24px_tall_when_message_has_attachment', () => {
    const message: ChatMessage = {
      id: 1, session: 1, sender_type: 'agent', sender_name: 'Sam', content: 'Hi', content_type: 'text',
      attachments: [{ url: 'https://files.example.test/a.pdf', name: 'a.pdf', type: 'application/pdf' }],
      is_read: true, created_at: '2026-11-27T00:00:00Z',
    }

    const html = renderToStaticMarkup(<MessageBubble message={message} />)

    expect(tag(html, /<a [^>]*>/)).toContain('acx:leading-6')
  })
})

describe('MessageBubble sender', () => {
  const base: ChatMessage = {
    id: 2, session: 1, sender_type: 'visitor', sender_name: '', content: 'Hello', content_type: 'text',
    attachments: [], is_read: true, created_at: '2026-11-27T00:00:00Z',
  }

  it('test_MessageBubble_prefixes_sr_only_You_when_the_visitor_sent_it', () => {
    // Arrange / Act
    const html = renderToStaticMarkup(<MessageBubble message={{ ...base, sender_type: 'user' }} />)

    // Assert
    expect(html).toContain('<span class="acx:sr-only">You: </span><p class="acx:whitespace-pre-wrap">Hello</p>')
    expect(html).not.toContain('Acrux: ')
  })

  it('test_MessageBubble_prefixes_sr_only_Acrux_when_an_unnamed_bot_sent_it', () => {
    // Arrange / Act
    const html = renderToStaticMarkup(<MessageBubble message={{ ...base, sender_type: 'bot' }} />)

    // Assert
    expect(html).toContain('<span class="acx:sr-only">Acrux: </span><p class="acx:whitespace-pre-wrap">Hello</p>')
    expect(html).not.toContain('You: ')
  })

  it('test_MessageBubble_has_no_sr_only_prefix_when_a_named_agent_sent_it', () => {
    // Arrange / Act
    const html = renderToStaticMarkup(<MessageBubble message={{ ...base, sender_type: 'agent', sender_name: 'Sam' }} />)

    // Assert: the visible name above the bubble already says who sent it
    expect(html).toContain('>Sam</span>')
    expect(html).not.toContain('acx:sr-only')
  })
})

describe('Panel layout', () => {
  // Rendering at 400% zoom / 320 x 256 needs a live check; this guards the classes.
  it('test_panelClasses_fill_the_screen_and_scroll_when_the_viewport_is_short', () => {
    // Arrange / Act
    const classes = panelClasses('bottom-right').split(' ')

    // Assert
    for (const c of ['inset-0!', 'h-dvh!', 'max-h-none!', 'max-w-none!', 'w-auto!', 'overflow-y-auto!', 'rounded-none!']) {
      expect(classes).toContain(`acx:[@media(max-height:500px)]:${c}`)
    }
    expect(classes).toContain('acx:h-[600px]')
  })

  it('test_panelLayout_writes_every_short_viewport_class_literally_when_tailwind_scans_it', () => {
    // Arrange: Tailwind generates only class names it finds as literal text
    const source = panelLayoutSource
    const shortClasses = [...panelClasses('bottom-left').split(' '), ...TABPANEL_CLASSES.split(' ')]
      .filter(c => c.includes('max-height:500px'))

    // Act / Assert
    expect(shortClasses).toHaveLength(9)
    for (const c of shortClasses) expect(source).toContain(c)
  })

  it('test_TABPANEL_CLASSES_keep_room_for_the_tab_when_the_viewport_is_short', () => {
    // Arrange / Act
    const classes = TABPANEL_CLASSES.split(' ')

    // Assert
    expect(classes).toContain('acx:[@media(max-height:500px)]:flex-none!')
    expect(classes).toContain('acx:[@media(max-height:500px)]:min-h-[16rem]!')
  })
})

describe('MessageList', () => {
  const agentTyping = { is_typing: true, agent_name: 'Sam Lee' }

  it('test_MessageList_is_a_silent_log_with_a_polite_announcer_when_rendered', () => {
    const html = renderToStaticMarkup(<MessageList messages={[]} agentTyping={agentTyping} />)

    const log = tag(html, /<div[^>]*role="log"[^>]*>/)
    expect(log).toContain('aria-live="off"')
    expect(log).toContain('aria-label="Conversation"')
    expect(html).toMatch(/<div class="acx:sr-only" aria-live="polite" aria-atomic="true">/)
  })

  it('test_MessageList_typing_indicator_is_hidden_from_assistive_tech_when_agent_typing', () => {
    const html = renderToStaticMarkup(<MessageList messages={[]} agentTyping={agentTyping} />)

    expect(html).toMatch(/<div class="[^"]*acx:mb-3" aria-hidden="true">/)
  })
})

describe('form fields', () => {
  it('test_LeadCaptureForm_fields_are_named_by_visible_labels_when_rendered', () => {
    // Arrange / Act
    const html = renderToStaticMarkup(<LeadCaptureForm onSubmit={() => {}} />)

    // Assert: each field is tied to a visible <label>, not a placeholder or aria-label alone
    const name = tag(html, /<input[^>]*type="text"[^>]*>/)
    const nameId = name.match(/id="([^"]+)"/)?.[1]
    expect(nameId).toBeTruthy()
    expect(html).toContain(`<label for="${nameId}" class="acx:block acx:mb-1 acx:text-xs acx:font-medium acx:text-gray-600">Your name</label>`)
    expect(name).toContain('autoComplete="name"')
    expect(name).not.toContain('aria-label')
    expect(name).not.toContain('placeholder')
    const email = tag(html, /<input[^>]*type="email"[^>]*>/)
    const emailId = email.match(/id="([^"]+)"/)?.[1]
    expect(emailId).toBeTruthy()
    expect(emailId).not.toBe(nameId)
    expect(html).toContain(`<label for="${emailId}" class="acx:block acx:mb-1 acx:text-xs acx:font-medium acx:text-gray-600">Your email (required)</label>`)
    expect(email).toContain('autoComplete="email"')
    expect(email).not.toContain('aria-label')
  })
})
