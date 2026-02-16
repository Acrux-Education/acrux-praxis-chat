# @acrux-education/chat-widget

Embeddable chat widget for Acrux Education. Provides live chat, knowledge base search, announcements, and product roadmap — packaged as both an ESM library (for React apps like Pnyx) and a standalone IIFE bundle (for non-React sites like Webflow).

## Installation

```bash
npm install @acrux-education/chat-widget
```

> This is a **private** npm package. You need an npm token with access to the `@acrux-education` scope.

## Usage

### React (ESM)

```tsx
import { ChatWidget } from '@acrux-education/chat-widget'
import '@acrux-education/chat-widget/style.css'

function App() {
  return (
    <ChatWidget
      mode="user"
      apiUrl="https://praxis-be-prod-sg.acrux.education"
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
    apiUrl: 'https://praxis-be-prod-sg.acrux.education',
  })
</script>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `mode` | `'lead' \| 'user'` | Yes | `lead` for anonymous visitors, `user` for authenticated users |
| `apiUrl` | `string` | Yes | Praxis backend URL |
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
| `dist/acrux-chat.es.js` | ESM | Externalised (peer dep) | React host apps (Pnyx) |
| `dist/acrux-chat.iife.js` | IIFE | Bundled | Non-React sites (Webflow) |
| `dist/style.css` | CSS | — | Styles for both builds |

### CSS isolation

All Tailwind classes use the `acx-` prefix to avoid collisions with host site styles.

## Publishing

Pushing to `main` triggers a GitHub Action that automatically publishes to npm. Before pushing, **bump the version** in `package.json` — npm rejects duplicate versions.

```bash
# Example: bump patch version
npm version patch
```

### npm token

The `NPM_TOKEN` GitHub secret is required for publishing. It expires every 90 days and needs periodic rotation.

## Backend

The widget connects to the Praxis backend:

- **REST API**: `{apiUrl}/api/chat/sessions/`
- **WebSocket**: `wss://{apiUrl}/ws/chat/{session_key}/`

## Pnyx Integration

Pnyx (the school-facing frontend) consumes this widget as an npm dependency. Requirements for the Pnyx team:

1. Set `VITE_PRAXIS_CHAT_URL` env var pointing to the Praxis backend URL
2. Pass it as the `apiUrl` prop to `<ChatWidget>`
3. Add `COMMON__NPM_TOKEN` to GCP Secret Manager for installing the private package
4. Update CSP to allow connections to the backend domain (both `https` and `wss`)
