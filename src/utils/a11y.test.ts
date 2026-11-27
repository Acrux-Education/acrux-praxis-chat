import { describe, expect, it } from 'vitest'
import type { ChatMessage } from '../types'
import { chatAnnouncement, nextTabIndex } from './a11y'

function message(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: 1,
    session: 1,
    sender_type: 'agent',
    sender_name: 'Sam Lee',
    content: 'Hello',
    content_type: 'text',
    attachments: [],
    is_read: false,
    created_at: '2026-11-27T01:00:00Z',
    ...overrides,
  }
}

describe('nextTabIndex', () => {
  it('test_nextTabIndex_wraps_to_first_when_arrow_right_on_last', () => {
    expect(nextTabIndex('ArrowRight', 2, 3)).toBe(0)
  })

  it('test_nextTabIndex_wraps_to_last_when_arrow_left_on_first', () => {
    expect(nextTabIndex('ArrowLeft', 0, 3)).toBe(2)
  })

  it('test_nextTabIndex_jumps_to_ends_when_home_or_end', () => {
    expect(nextTabIndex('Home', 1, 3)).toBe(0)
    expect(nextTabIndex('End', 0, 3)).toBe(2)
  })

  it('test_nextTabIndex_returns_null_when_key_is_not_a_tab_key', () => {
    expect(nextTabIndex('Enter', 0, 3)).toBeNull()
  })
})

describe('chatAnnouncement', () => {
  it('test_chatAnnouncement_reads_sender_and_text_when_agent_reply_appended', () => {
    const prev = [message({ id: 1, sender_type: 'user', content: 'Hi' })]
    const next = [...prev, message({ id: 2, content: 'How can I help?' })]

    expect(chatAnnouncement(prev, next)).toBe('Sam Lee: How can I help?')
  })

  it('test_chatAnnouncement_is_silent_when_own_message_appended', () => {
    const prev = [message({ id: 1 })]
    const next = [...prev, message({ id: 2, sender_type: 'visitor', content: 'Thanks' })]

    expect(chatAnnouncement(prev, next)).toBeNull()
  })

  it('test_chatAnnouncement_is_silent_when_history_replaces_the_list', () => {
    const prev = [message({ id: 1 })]
    const next = [message({ id: 1 }), message({ id: 2, content: 'Earlier reply' })]

    expect(chatAnnouncement(prev, next)).toBeNull()
  })

  it('test_chatAnnouncement_is_silent_when_history_loads_into_empty_list', () => {
    const next = [message({ id: 1 }), message({ id: 2 })]

    expect(chatAnnouncement([], next)).toBeNull()
  })

  it('test_chatAnnouncement_is_silent_when_own_message_is_acknowledged', () => {
    const prev = [message({ id: 't1', temp_id: 't1', sender_type: 'user', status: 'sending' })]
    const next = [{ ...prev[0]!, id: 9, temp_id: undefined, status: 'sent' as const }]

    expect(chatAnnouncement(prev, next)).toBeNull()
  })

  it('test_chatAnnouncement_reports_failure_when_own_message_fails_to_send', () => {
    const prev = [message({ sender_type: 'user', status: 'sending' })]
    const next = [{ ...prev[0]!, status: 'failed' as const }]

    expect(chatAnnouncement(prev, next)).toBe('Message failed to send')
  })

  it('test_chatAnnouncement_reads_text_only_when_system_notice_appended', () => {
    const next = [message({ sender_type: 'system', sender_name: 'System', content: 'Sam joined the chat' })]

    expect(chatAnnouncement([], next)).toBe('Sam joined the chat')
  })
})
