import { afterEach, describe, expect, it, vi } from 'vitest'
import { TURNSTILE_SITE_KEY } from '../constants'
import { getTurnstileToken } from './useChatSession'

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
    expect(render.mock.calls[0][1]).toMatchObject({
      sitekey: TURNSTILE_SITE_KEY,
    })
    expect(render.mock.calls[0][1]).not.toHaveProperty('size')
    expect(container.remove).toHaveBeenCalledOnce()
  })
})
