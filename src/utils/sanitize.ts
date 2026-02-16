/**
 * Basic markdown-to-HTML renderer.
 * Only supports bold, italic, code, and links.
 * Sanitizes HTML to prevent XSS.
 */
export function renderContent(markdown: string): string {
  let html = escapeHtml(markdown)

  // Bold: **text** or __text__
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>')

  // Italic: *text* or _text_
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
  html = html.replace(/(?<!\w)_(.+?)_(?!\w)/g, '<em>$1</em>')

  // Inline code: `code`
  html = html.replace(/`(.+?)`/g, '<code>$1</code>')

  // Links: [text](url) — only allow http/https
  html = html.replace(
    /\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  )

  // Line breaks
  html = html.replace(/\n/g, '<br />')

  return html
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (char) => map[char] ?? char)
}
