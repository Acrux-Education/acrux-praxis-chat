import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactElement } from 'react'
import { ChatProvider } from '../context/ChatContext'
import type { ChatWidgetProps, TabId } from '../types'
import { ChatLauncher } from '../ChatLauncher'
import { TabBar } from './TabBar'
import { MessageInput } from './MessageInput'
import { MessageList } from './MessageList'
import { LeadCaptureForm } from './LeadCaptureForm'
import { SearchInput } from './SearchInput'

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
  it('test_MessageInput_textarea_has_accessible_name_when_rendered', () => {
    const html = renderToStaticMarkup(<MessageInput onSend={() => {}} mode="user" />)

    expect(tag(html, /<textarea[^>]*>/)).toContain('aria-label="Message"')
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
