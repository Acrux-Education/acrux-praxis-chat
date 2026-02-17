# @acrux-education/chat-widget

Embeddable chat widget for Acrux Education. Provides live chat, knowledge base search, announcements, and product roadmap — packaged as both an ESM library (for React apps) and a standalone IIFE bundle (for non-React sites like Webflow).

## Installation

```bash
npm install @acrux-education/chat-widget
```

## Usage

### React (ESM)

```tsx
import { ChatWidget } from '@acrux-education/chat-widget'
import '@acrux-education/chat-widget/style.css'

function App() {
  return (
    <ChatWidget
      mode="user"
      apiUrl={import.meta.env.VITE_PRAXIS_CHAT_URL}
      token="jwt-token"
      userName="Jane Doe"
      userEmail="jane@school.edu"
      schoolId="school-123"
    />
  )
}
```

### Standalone (IIFE) — Webflow / static sites

Include the built files and initialise:

```html
<link rel="stylesheet" href="acrux-chat.iife.css" />
<script src="acrux-chat.iife.js"></script>
<script>
  AcruxChat.init({
    mode: 'lead',
    apiUrl: 'https://your-praxis-backend-url',
  })
</script>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `mode` | `'lead' \| 'user'` | Yes | `lead` for anonymous visitors, `user` for authenticated users |
| `apiUrl` | `string` | Yes | Backend URL |
| `token` | `string` | No | JWT auth token (required for `user` mode) |
| `userName` | `string` | No | Display name for the current user |
| `userEmail` | `string` | No | Email for the current user |
| `schoolId` | `string` | No | School identifier |
| `position` | `'bottom-right' \| 'bottom-left'` | No | Widget position (default: `bottom-right`) |
| `primaryColor` | `string` | No | Brand colour override (default: `#006383`) |
| `greeting` | `string` | No | Custom greeting message |
| `onSessionCreated` | `(sessionKey: string) => void` | No | Callback when a chat session is created |

## Tabs

Tabs are **dynamic** — they only appear when the backend returns content for them:

- **Home** — greeting, quick actions, knowledge base search
- **Messages** — live chat with WebSocket messaging
- **News** — announcements and updates
- **Roadmap** — product roadmap items
- **Help** — knowledge base articles

## Development

```bash
npm install
npm run dev        # Start dev server
npm run build      # Build both ESM and IIFE bundles
npm run lint       # Run ESLint
npm run test:run   # Run tests
```

### Build outputs

| File | Format | React | Use case |
|------|--------|-------|----------|
| `dist/acrux-chat.es.js` | ESM | Externalised (peer dep) | React host apps |
| `dist/acrux-chat.iife.js` | IIFE | Bundled | Non-React sites (Webflow) |
| `dist/style.css` | CSS | — | Styles for both builds |

### CSS isolation

All Tailwind classes use the `acx-` prefix to avoid collisions with host site styles.

## Backend

The widget connects to the backend via:

- **REST API**: `{apiUrl}/api/chat/sessions/`
- **WebSocket**: `wss://{apiUrl}/ws/chat/{session_key}/`
