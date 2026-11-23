import { afterEach, describe, expect, it, vi } from 'vitest'
import { TURNSTILE_SITE_KEY } from '../constants'
import { ApiClient } from '../services/api'
import { getIdentityTokenFromHost, getTurnstileToken } from './useChatSession'

describe('getTurnstileToken', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders without the unsupported invisible size parameter', async () => {
    const container = {
      style: { display: '' },
      remove: vi.fn(),
    }
    const render = vi.fn((_container, options) => {
      options.callback('turnstile-token')
    })

    vi.stubGlobal('document', {
      createElement: vi.fn(() => container),
      body: { appendChild: vi.fn() },
      getElementById: vi.fn(() => ({ id: 'cf-turnstile-script' })),
      head: { appendChild: vi.fn() },
    })
    vi.stubGlobal('window', {
      turnstile: { render },
      setInterval,
    })

    await expect(getTurnstileToken()).resolves.toBe('turnstile-token')
    expect(render).toHaveBeenCalledOnce()
    expect(render.mock.calls[0]![1]).toMatchObject({
      sitekey: TURNSTILE_SITE_KEY,
    })
    expect(render.mock.calls[0]![1]).not.toHaveProperty('size')
    expect(container.remove).toHaveBeenCalledOnce()
  })
})

// PLATDEV-1647: the create request carries the host's signed identity when
// there is one, and a session still starts without it. Exercised through the
// same two calls createSession makes: resolve the token, then POST.
describe('getIdentityTokenFromHost', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  async function createSessionBody(getIdentityToken?: () => Promise<string | null>) {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ session_key: 'session-1' }), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)
    const api = new ApiClient({ baseUrl: 'https://chat.example.test' })

    // Act
    const identityToken = await getIdentityTokenFromHost(getIdentityToken)
    const session = await api.createSession({ source: 'user_bot', identity_token: identityToken })

    expect(fetchMock).toHaveBeenCalledOnce()
    return { session, body: JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string) }
  }

  it('sends identity_token when the host returns a token', async () => {
    // Arrange
    const getIdentityToken = vi.fn().mockResolvedValue('signed.identity.token')

    const { body } = await createSessionBody(getIdentityToken)

    // Assert
    expect(getIdentityToken).toHaveBeenCalledOnce()
    expect(body).toMatchObject({ source: 'user_bot', identity_token: 'signed.identity.token' })
  })

  it('omits identity_token when the host returns null', async () => {
    // Arrange
    const getIdentityToken = vi.fn().mockResolvedValue(null)

    const { body } = await createSessionBody(getIdentityToken)

    // Assert
    expect(getIdentityToken).toHaveBeenCalledOnce()
    expect(body).not.toHaveProperty('identity_token')
  })

  it('omits identity_token and still creates the session when the host rejects', async () => {
    // Arrange
    const getIdentityToken = vi.fn().mockRejectedValue(new Error('agora unavailable'))

    const { session, body } = await createSessionBody(getIdentityToken)

    // Assert
    expect(session).toMatchObject({ session_key: 'session-1' })
    expect(body).not.toHaveProperty('identity_token')
  })

  it('omits identity_token and still creates the session when the host throws', async () => {
    // Arrange
    const getIdentityToken = vi.fn(() => {
      throw new Error('not signed in')
    })

    const { session, body } = await createSessionBody(getIdentityToken)

    // Assert
    expect(session).toMatchObject({ session_key: 'session-1' })
    expect(body).not.toHaveProperty('identity_token')
  })

  it('omits identity_token when the host returns an empty string', async () => {
    // Arrange
    const getIdentityToken = vi.fn().mockResolvedValue('')

    const { body } = await createSessionBody(getIdentityToken)

    // Assert
    expect(body).not.toHaveProperty('identity_token')
  })

  it('omits identity_token when the host supplies no getter', async () => {
    // Arrange: no getIdentityToken prop

    const { session, body } = await createSessionBody(undefined)

    // Assert
    expect(session).toMatchObject({ session_key: 'session-1' })
    expect(body).not.toHaveProperty('identity_token')
  })
})
