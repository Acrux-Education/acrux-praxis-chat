import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiClient } from './api'

describe('ApiClient region propagation', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('uses the configured region for availability and session creation', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ is_online: false }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ session_key: 'session-1' }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    const api = new ApiClient({ baseUrl: 'https://chat.example.test/', region: 'au' })

    await api.getOperatingHoursStatus()
    await api.createSession({ source: 'user_bot' })

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'https://chat.example.test/api/chat/operating-hours/status/?region=au',
    )
    expect(JSON.parse(fetchMock.mock.calls[1]?.[1]?.body as string)).toMatchObject({ region: 'au' })
  })

  it('omits the optional region when none is configured', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValue(new Response(JSON.stringify({ is_online: false }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    const api = new ApiClient({ baseUrl: 'https://chat.example.test' })

    await api.getOperatingHoursStatus()

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'https://chat.example.test/api/chat/operating-hours/status/',
    )
  })
})
