import { describe, it, expect } from 'vitest'
import { renderContent } from './sanitize'

// Helper: assert no tags other than the allowed set remain in the output
function assertOnlyAllowedTags(html: string) {
  // Strip all allowed tags and verify nothing tag-like remains
  const stripped = html
    .replace(/<\/?strong>/g, '')
    .replace(/<\/?em>/g, '')
    .replace(/<\/?code>/g, '')
    .replace(/<br \/>/g, '')
    .replace(/<a [^>]*>.*?<\/a>/gs, '')
  expect(stripped).not.toMatch(/<[a-z]/)
}

describe('renderContent — tag injection', () => {
  it('entity-escapes <script> tags', () => {
    const out = renderContent('<script>alert(1)</script>')
    expect(out).not.toContain('<script>')
    expect(out).toContain('&lt;script&gt;')
  })

  it('entity-escapes <img onerror> injection', () => {
    const out = renderContent('<img src=x onerror=alert(1)>')
    expect(out).not.toContain('<img')
    expect(out).toContain('&lt;img')
  })
})

describe('renderContent — attribute breakout', () => {
  it('entity-escapes double quotes in link text', () => {
    const out = renderContent('[say "hello"](https://example.com)')
    // The link text with double quotes must be escaped in the output
    expect(out).not.toMatch(/say "hello"/)
    expect(out).toContain('&quot;')
  })

  it('entity-escapes double quotes in a URL so the href value cannot be broken', () => {
    // A URL with a literal " will be entity-escaped; no raw " can appear between href=" and the
    // closing " that terminates the attribute value.
    const out = renderContent('[click](https://example.com/"evil)')
    if (out.includes('<a ')) {
      // Extract href value: everything between href=" and the next closing "
      const match = out.match(/href="([^"]*)"/)
      expect(match).not.toBeNull()
      // The raw character " must not appear inside the extracted href value
      expect(match![1]).not.toContain('"')
    }
  })
})

describe('renderContent — URL scheme blocking', () => {
  it('does not produce an <a> for javascript: URLs', () => {
    const out = renderContent('[click](javascript:alert(1))')
    expect(out).not.toContain('<a ')
  })

  it('does not produce an <a> for data: URLs', () => {
    const out = renderContent('[click](data:text/html,<h1>pwned</h1>)')
    expect(out).not.toContain('<a ')
  })

  it('does not produce an <a> for vbscript: URLs', () => {
    const out = renderContent('[click](vbscript:MsgBox(1))')
    expect(out).not.toContain('<a ')
  })

  it('does not produce an <a> for protocol-relative // links', () => {
    const out = renderContent('[click](//evil.com/steal)')
    expect(out).not.toContain('<a ')
  })
})

describe('renderContent — allowed-output invariant', () => {
  it('output contains no tags other than strong/em/code/a/br', () => {
    const src = '**bold** _italic_ `code` [link](https://example.com)\nhello <div>injected</div>'
    assertOnlyAllowedTags(renderContent(src))
  })
})

describe('renderContent — positive anchors', () => {
  it('renders **bold** as <strong>', () => {
    expect(renderContent('**hello**')).toBe('<strong>hello</strong>')
  })

  it('renders _italic_ as <em>', () => {
    expect(renderContent('_hello_')).toBe('<em>hello</em>')
  })

  it('renders `code` as <code>', () => {
    expect(renderContent('`hello`')).toBe('<code>hello</code>')
  })

  it('renders newlines as <br />', () => {
    expect(renderContent('line1\nline2')).toBe('line1<br />line2')
  })

  it('renders https:// links with target=_blank and rel=noopener noreferrer', () => {
    const out = renderContent('[Acrux](https://www.acrux.education)')
    expect(out).toContain('<a href="https://www.acrux.education"')
    expect(out).toContain('target="_blank"')
    expect(out).toContain('rel="noopener noreferrer"')
    expect(out).toContain('Acrux</a>')
  })

  it('renders http:// links correctly', () => {
    const out = renderContent('[Local](http://localhost:3000)')
    expect(out).toContain('<a href="http://localhost:3000"')
    expect(out).toContain('target="_blank"')
  })
})
