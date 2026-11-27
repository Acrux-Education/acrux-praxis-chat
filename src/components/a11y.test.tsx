import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactElement } from 'react'
import { ChatProvider } from '../context/ChatContext'
import type { ChatMessage, ChatWidgetProps, TabId } from '../types'
import { HelpTab } from '../tabs/HelpTab'
import { MessageBubble } from './MessageBubble'
import { ChatLauncher } from '../ChatLauncher'
import { TabBar } from './TabBar'
import { MessageInput } from './MessageInput'
import { MessageList } from './MessageList'
import { LeadCaptureForm } from './LeadCaptureForm'
import { SearchInput } from './SearchInput'
import { LiveStatus } from './LiveStatus'

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

describe('TabBar', () => {
  it('test_TabBar_selected_tab_controls_panel_and_holds_tab_stop_when_rendered', () => {
    const html = renderTabs('help')

    const help = tag(html, /<button[^>]*id="w-tab-help"[^>]*>/)
    expect(help).toContain('role="tab"')
    expect(help).toContain('aria-selected="true"')
    expect(help).toContain('aria-controls="w-panel"')
    expect(help).toContain('tabindex="0"')
  })

  it('test_TabBar_unselected_tab_has_no_controls_and_no_tab_stop_when_rendered', () => {
    const html = renderTabs('help')

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
})

describe('ChatLauncher', () => {
  it('test_ChatLauncher_is_named_open_chat_when_closed_with_no_unread', () => {
    const html = render(<ChatLauncher isOpen={false} onClick={() => {}} position="bottom-right" />)

    expect(tag(html, /<button[^>]*>/)).toContain('aria-label="Open chat"')
  })
})

describe('MessageInput', () => {
  it('test_MessageInput_textarea_is_named_by_visible_label_when_rendered', () => {
    const html = renderToStaticMarkup(<MessageInput onSend={() => {}} mode="user" />)

    const id = tag(html, /<textarea[^>]*>/).match(/id="([^"]+)"/)?.[1]
    expect(id).toBeTruthy()
    expect(html).toContain(`<label for="${id}" class="acx:block acx:text-xs acx:font-medium acx:text-gray-600">Message</label>`)
  })
})

describe('TabBar selected cue', () => {
  it('test_TabBar_selected_tab_has_bar_and_bold_label_when_rendered', () => {
    const html = renderTabs('help')

    const help = tag(html, /<button[^>]*id="w-tab-help"[^>]*>[\s\S]*?<\/button>/)
    expect(help).toContain('acx:border-primary-600')
    expect(help).toContain('acx:font-semibold')
  })

  it('test_TabBar_unselected_tab_has_no_bar_or_bold_label_when_rendered', () => {
    const html = renderTabs('help')

    const messages = tag(html, /<button[^>]*id="w-tab-messages"[^>]*>[\s\S]*?<\/button>/)
    expect(messages).toContain('acx:border-transparent')
    expect(messages).not.toContain('acx:font-semibold')
  })
})

describe('HelpTab', () => {
  it('test_HelpTab_headings_take_programmatic_focus_and_status_region_is_mounted_when_rendered', () => {
    const html = render(<HelpTab />)

    expect(tag(html, /<h2[^>]*>Help Centre<\/h2>/)).toContain('tabindex="-1"')
    expect(html).toContain('<div aria-live="polite" class="acx:sr-only"></div>')
  })
})

describe('LiveStatus', () => {
  // The server render is the first render, before any effect runs: what a
  // newly mounted view (the Help topic view) inserts into the page.
  it('test_LiveStatus_mounts_empty_and_sr_only_when_it_has_text_to_announce', () => {
    const html = renderToStaticMarkup(<LiveStatus text="Loading..." className="acx:py-4" />)

    expect(html).toBe('<div aria-live="polite" class="acx:sr-only"></div>')
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
  it('test_LeadCaptureForm_fields_have_names_and_autocomplete_when_rendered', () => {
    const html = renderToStaticMarkup(<LeadCaptureForm onSubmit={() => {}} />)

    const name = tag(html, /<input[^>]*type="text"[^>]*>/)
    expect(name).toContain('aria-label="Your name"')
    expect(name).toContain('autoComplete="name"')
    const email = tag(html, /<input[^>]*type="email"[^>]*>/)
    expect(email).toContain('aria-label="Your email"')
    expect(email).toContain('autoComplete="email"')
  })

  it('test_SearchInput_has_accessible_name_without_ellipsis_when_rendered', () => {
    const html = renderToStaticMarkup(<SearchInput onSearch={() => {}} placeholder="Ask a question or search..." />)

    expect(tag(html, /<input[^>]*>/)).toContain('aria-label="Ask a question or search"')
  })
})
