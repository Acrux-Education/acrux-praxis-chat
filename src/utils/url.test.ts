import { describe, it, expect } from 'vitest'
import { isSafeHttpUrl } from './url'

describe('isSafeHttpUrl', () => {
  it('accepts an absolute https URL', () => {
    expect(isSafeHttpUrl('https://help.acrux.education/articles/streaming')).toBe(true)
  })

  it('accepts an absolute http URL', () => {
    expect(isSafeHttpUrl('http://localhost:8000/articles/streaming')).toBe(true)
  })

  it('rejects a javascript: URL', () => {
    expect(isSafeHttpUrl('javascript:alert(1)')).toBe(false)
  })

  it('rejects a data: URL', () => {
    expect(isSafeHttpUrl('data:text/html,<script>alert(1)</script>')).toBe(false)
  })

  it('rejects a relative path, which has no scheme to check', () => {
    expect(isSafeHttpUrl('/articles/streaming')).toBe(false)
  })

  it('rejects an empty string', () => {
    expect(isSafeHttpUrl('')).toBe(false)
  })
})
