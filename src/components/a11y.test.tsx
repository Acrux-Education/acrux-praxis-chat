import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactElement } from 'react'
import { ChatProvider } from '../context/ChatContext'
import type { ChatWidgetProps, TabId, WhatsNewEntry } from '../types'
import { ChatLauncher } from '../ChatLauncher'
import { TabBar } from './TabBar'

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
