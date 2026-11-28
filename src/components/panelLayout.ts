// Open-panel layout (PLATDEV-1684, WCAG 1.4.10). On a short viewport (a phone
// in landscape, or 400% zoom on a desktop: about 320 x 256 CSS px) the
// floating 600 px panel would clip the message box and the conversation, so
// it fills the screen and scrolls as a whole, with room kept for the tab's
// content. `!` beats the floating position classes, including `sm:` ones.
// Class names are written out in full: Tailwind finds them by scanning the
// source text, so a name built from a template is never generated.
export const SHORT_VIEWPORT_PANEL = [
  'acx:[@media(max-height:500px)]:inset-0!',
  'acx:[@media(max-height:500px)]:w-auto!',
  'acx:[@media(max-height:500px)]:max-w-none!',
  'acx:[@media(max-height:500px)]:h-dvh!',
  'acx:[@media(max-height:500px)]:max-h-none!',
  'acx:[@media(max-height:500px)]:rounded-none!',
  'acx:[@media(max-height:500px)]:overflow-y-auto!',
].join(' ')

export const SHORT_VIEWPORT_TABPANEL = 'acx:[@media(max-height:500px)]:flex-none! acx:[@media(max-height:500px)]:min-h-[16rem]!'

export function panelClasses(position: 'bottom-right' | 'bottom-left'): string {
  const positionClasses = position === 'bottom-right'
    ? 'acx:right-4 acx:sm:right-6'
    : 'acx:left-4 acx:sm:left-6'
  return `acx:fixed acx:bottom-20 ${positionClasses} acx:z-[9999] acx:w-[380px] acx:max-w-[calc(100vw-2rem)] acx:h-[600px] acx:max-h-[calc(100vh-6rem)] acx:bg-white acx:rounded-2xl acx:shadow-2xl acx:flex acx:flex-col acx:overflow-hidden acx:animate-slide-up acx:outline-none ${SHORT_VIEWPORT_PANEL}`
}

export const TABPANEL_CLASSES = `acx:flex-1 acx:overflow-hidden ${SHORT_VIEWPORT_TABPANEL}`
