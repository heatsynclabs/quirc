# QUIRC Handoff Document

**QUIRC** (QUick IRC) — mobile-first, self-hosted IRC client.
Vue 3 + Vite + Pinia. Punk-zine aesthetic. Zero dependencies beyond Vue ecosystem.

**Status:** MVP feature-complete. Build passes clean (104 modules, 0 warnings).
**Version:** 0.1.0 | **License:** MIT (quirc.chat)

---

## File Tree (81 source files)

```
quirc/
├── package.json              # vue 3.5, vue-router 4, pinia 3, dexie 4, vite 6
├── vite.config.js            # Vue plugin, @ → src/ alias
├── index.html                # Entry HTML, Space Mono font, viewport-fit=cover
├── netlify.toml              # Build config, /api/* → functions, SPA fallback
├── .env.example              # All VITE_ + DO_SPACES_ env vars documented
├── .gitignore                # node_modules, dist, .env*, !.env.example
├── LICENSE                   # MIT
├── README.md                 # Setup instructions
├── prd.md                    # Full PRD v0.3.0 (reference only)
├── quirc_app.jsx             # React mockup (design reference only, not used)
│
├── public/
│   ├── favicon.svg           # Pink "Q" pixel favicon
│   ├── manifest.json         # PWA manifest
│   └── noise.svg             # feTurbulence noise texture
│
├── deploy/
│   ├── setup.sh              # DigitalOcean droplet bootstrap (ergo + nginx + certbot)
│   ├── ergo.yaml             # Ergo IRC server config template
│   └── nginx.conf            # nginx reverse proxy for WebSocket + TLS
│
├── netlify/functions/
│   ├── unfurl.js             # OpenGraph metadata proxy for link previews
│   └── upload-url.js         # Presigned S3/DO Spaces upload URL generator
│
└── src/
    ├── main.js               # Creates app, installs Pinia + Router, imports CSS
    ├── App.vue               # Root shell: splash → main layout + all overlays
    │
    ├── router/
    │   └── index.js          # / → /channel/general, /channel/:name
    │
    ├── styles/
    │   ├── variables.css     # Full --q-* design system (palette, type, spacing)
    │   └── base.css          # Reset, border-radius:0 !important, 100dvh, scrollbars
    │
    ├── stores/               # Pinia composition-style (setup function syntax)
    │   ├── connection.js     # Nick, server, SASL, MOTD, saved profiles. localStorage.
    │   ├── channels.js       # Channel list, active, topics, unread, mute. localStorage.
    │   ├── messages.js       # Per-channel message maps, reply target, reactions
    │   ├── users.js          # User list with op/voice/status, sorted computed
    │   ├── settings.js       # 16 settings across 4 categories, auto-persist via watch
    │   └── ui.js             # All overlay/drawer open states + toggle methods
    │
    ├── irc/                  # Core IRC protocol
    │   ├── client.js         # WebSocket client: CAP LS 302, SASL PLAIN, reconnect
    │   ├── parser.js         # IRCv3 message parser (tags, source, command, params)
    │   ├── commands.js       # Slash command parser (20+ commands) + COMMAND_HELP
    │   ├── format.js         # mIRC color/bold/italic stripper
    │   └── caps.js           # CAP constants (mostly handled in client.js now)
    │
    ├── composables/
    │   ├── useIRC.js         # Main bridge: IRC events → stores. 20+ handlers.
    │   ├── useSearch.js      # Debounced message search (300ms)
    │   ├── useRichText.js    # Code block + inline code parser
    │   ├── useFileUpload.js  # Stub: presigned URL upload flow
    │   └── useNotifications.js # Stub: web push notifications
    │
    ├── db/
    │   └── index.js          # Dexie schema (messages, channels, settings, unfurlCache)
    │
    ├── utils/
    │   ├── logoPixels.js     # QUIRC pixel bitmap data + builder for logo components
    │   ├── nickColor.js      # Deterministic nick → color hash (10 colors)
    │   ├── time.js           # formatTime(date, use24h)
    │   ├── sanitize.js       # HTML entity escaping
    │   └── linkDetect.js     # URL regex extraction
    │
    └── components/
        ├── SplashScreen.vue          # 3-phase animation (logo→text→fade), dynamic server name
        │
        ├── icons/                    # SVG icons, square stroke caps, punk aesthetic
        │   ├── IconHamburger.vue     # Three lines (menu)
        │   ├── IconSearch.vue        # Magnifying glass
        │   ├── IconClose.vue         # X mark
        │   ├── IconReply.vue         # Curved reply arrow
        │   ├── IconPlus.vue          # Plus sign
        │   ├── IconPaperclip.vue     # File attach
        │   ├── IconSend.vue          # Send arrow
        │   ├── IconSettings.vue      # Gear
        │   └── index.js              # Barrel export
        │
        ├── logo/
        │   ├── QuircMark.vue         # Static SVG pixel logo (uses logoPixels)
        │   └── SplashLogo.vue        # Canvas animation: pixel rain, scanline, CRT
        │
        ├── shared/
        │   ├── NoiseOverlay.vue      # Fixed noise texture at 3.5% opacity
        │   ├── TypingIndicator.vue   # Animated dots + nick list
        │   └── UnreadMarker.vue      # Orange "new messages" divider
        │
        ├── layout/
        │   ├── TopBar.vue            # Logo + channel + status + search + user count
        │   ├── InputBar.vue          # Reply bar + > prompt + input + send. History + tab complete.
        │   ├── ChannelDrawer.vue     # Left slide: channels, join (+), leave (ctx), settings gear
        │   └── UsersDrawer.vue       # Right slide: users, click → WHOIS/DM/Kick actions
        │
        ├── messages/
        │   ├── MessageList.vue       # Scroll container, server MOTD, empty state, auto-scroll
        │   ├── MessageItem.vue       # Nick + time + body + reactions + hover actions
        │   ├── SystemMessage.vue     # Italic muted server messages
        │   ├── RichText.vue          # Fenced code blocks + inline code
        │   ├── CodeBlock.vue         # Green text, dark bg, left accent border
        │   ├── ReplyContext.vue      # Nick-colored left border + quoted text
        │   ├── LinkPreview.vue       # Teal left border card (domain, title, desc)
        │   ├── InlineImage.vue       # Image display with gradient placeholder
        │   └── Reactions.vue         # Emoji badges with counts
        │
        └── overlays/
            ├── ConnectionModal.vue   # Full connect form: nick, server, WS URL, SASL, saved servers
            ├── SettingsPanel.vue     # All 16 settings: display, media, behavior, advanced, connection
            ├── JoinChannelModal.vue  # Channel name + key, server LIST browser, click-to-join
            ├── SearchOverlay.vue     # Full-screen search with filtered results
            ├── EmojiPicker.vue       # 10 quick-access emojis
            └── FileUploadToast.vue   # Upload progress bar stub
```

---

## Architecture

### Data Flow

```
WebSocket ↔ IRCClient (singleton)
                ↓ events
          useIRC composable
                ↓ mutations
          Pinia Stores ←→ localStorage
                ↓ reactivity
          Vue Components
```

### IRC Client (`src/irc/client.js`)

Singleton WebSocket IRC client accessed via `getClient()`.

- **CAP negotiation**: Requests `message-tags server-time batch echo-message labeled-response sasl chathistory away-notify account-notify draft/reply draft/react typing`
- **SASL PLAIN**: Base64-encoded `user\0user\0pass` via AUTHENTICATE
- **Reconnect**: Exponential backoff `[1, 2, 4, 8, 16, 30]` seconds
- **Commands**: `join part privmsg notice action topic changeNick who whois kick ban unban mode invite list away sendRaw`
- **Events**: `status registered serverinfo motd nick:error channel:error error sasl:success sasl:fail reconnecting` + all IRC commands (`PRIVMSG JOIN PART KICK QUIT NICK TOPIC MODE NOTICE INVITE TAGMSG AWAY` + numerics)

### useIRC Composable (`src/composables/useIRC.js`)

Bridges IRC events to Pinia stores. Registers 20+ event handlers on mount, cleans up on unmount.

Key behaviors:
- `PRIVMSG` → `messages.addMessage()`, DM channel auto-creation, unread increment
- `JOIN/PART/KICK/QUIT` → `channels.addChannel/removeChannel`, `usersStore.addUser/removeUser`
- `353 (NAMES)` / `352 (WHO)` → populate user list with op/voice/status
- `WHOIS` → buffer across 311-318 numerics, display on 318 (end)
- `433 (nick in use)` → auto-retry with `nick_1`, `nick_2`, etc. during registration
- `MODE` → parse +o/-o/+v/-v, update user modes
- Slash commands → `handleCommand()` dispatches to IRC client methods

### Stores

All use Pinia composition API (setup function syntax).

| Store | Persists | Key State |
|-------|----------|-----------|
| `connection` | localStorage | nick, serverHost, gatewayUrl, SASL config, savedServers[], motd[], status |
| `channels` | localStorage (lastActive, muted) | channels[], activeChannel, currentChannel computed |
| `messages` | memory only | messagesByChannel Map, replyTarget |
| `users` | memory only | users[], sortedUsers computed (ops→voiced→alpha) |
| `settings` | localStorage (auto-watch) | 16 refs across display/media/behavior/advanced |
| `ui` | none | channelDrawerOpen, usersDrawerOpen, searchOpen, connectionModalOpen, settingsOpen, joinChannelOpen |

### Routing

```
/                  → redirect to /channel/general
/channel/:name     → sets active channel to #name
```

Router uses inline ChannelView component (App.vue handles actual rendering).

---

## Feature Status

### Working

- Real WebSocket IRC connection with CAP + SASL
- Auto-reconnect with exponential backoff
- Channel join/part/list with unread badges
- Message display with timestamps + deterministic nick colors
- System messages (join/part/quit/kick/nick change/mode/invite)
- 20+ slash commands (/join /part /me /topic /nick /msg /notice /kick /ban /mode /invite /whois /list /away /back /clear /connect /help /raw /quit)
- User list with op/voice badges and online/away status
- MOTD display from server (dynamic, not hardcoded)
- Connection modal with full config (nick, server, WS URL, port, auto-join, password, SASL)
- Saved server profiles (add/load/switch)
- Settings panel (16 persistent settings)
- Join channel modal with server LIST browser
- Input history (up/down arrow, 100 entries)
- Tab nick completion
- Channel context menu (leave, mute)
- User actions (click → WHOIS, DM, Kick if op)
- Connection status indicator (top bar + channel drawer footer)
- First-run flow (show ConnectionModal if not configured)
- Splash screen with dynamic server name
- All config via env vars (no hardcoded deployment references)
- Mobile-first layout with safe-area insets
- Animated splash (pixel logo → wordmark → fade)
- Noise texture overlay
- Scoped CSS with full `--q-*` design system

### Stubbed (component exists, integration incomplete)

- **Link previews** — `unfurl.js` serverless function ready, `LinkPreview.vue` exists, not wired to message flow
- **Inline images** — `InlineImage.vue` exists, URL detection stub
- **Reactions** — `Reactions.vue` + TAGMSG parsing ready, rendering not wired
- **Typing indicators** — received via TAGMSG `+typing`, component exists, sending not implemented
- **Reply threading** — `ReplyContext.vue` + `+draft/reply` parsing, context display partial
- **File upload** — `upload-url.js` function ready, `FileUploadToast.vue` stub, client flow not wired
- **Emoji picker** — `EmojiPicker.vue` has 10 hardcoded emojis, not connected to reactions
- **Notifications** — `useNotifications.js` empty stub

### Not Started

- Service worker / PWA offline
- Web push notifications
- Server-side history (`CHATHISTORY` command)
- Read markers / last-read tracking
- Virtual scrolling for large message lists
- IndexedDB message persistence (schema ready in Dexie)
- mIRC color rendering (parser strips them, doesn't render)
- Multi-server simultaneous connections
- End-to-end encryption
- Custom themes
- Syntax highlighting in code blocks

---

## Environment Variables

```env
# Client-side (VITE_ prefix, baked into build)
VITE_DEFAULT_SERVER=irc.example.org
VITE_DEFAULT_PORT=6697
VITE_GATEWAY_URL=wss://irc.example.org
VITE_AUTO_JOIN=#general,#random
VITE_UPLOAD_API=/api/upload-url
VITE_UNFURL_API=/api/unfurl
VITE_CDN_DOMAIN=cdn.example.org

# Server-side (Netlify Functions only)
DO_SPACES_KEY=
DO_SPACES_SECRET=
DO_SPACES_REGION=nyc3
DO_SPACES_BUCKET=quirc-files
DO_SPACES_CDN_DOMAIN=cdn.example.org
```

---

## Deployment

### Frontend: Netlify
```bash
npm run build          # → dist/
netlify deploy --prod  # or git push (auto-deploy)
```

### Backend: DigitalOcean Droplet (~$6/mo)
- **Ergo IRC server** on `:6667` (plain), `:6697` (TLS), `:8097` (WebSocket)
- **nginx** reverse proxy: `wss://irc.example.org` → `localhost:8097`
- **Let's Encrypt** for TLS
- Bootstrap: `scp deploy/setup.sh root@IP:/root/ && ssh root@IP bash /root/setup.sh`

### File Storage: DO Spaces (~$5/mo)
- S3-compatible, CDN-enabled
- Presigned PUT URLs via `upload-url.js` function
- Path: `uploads/YYYY-MM/uuid.ext`

### DNS Records
```
quirc.example.org   → Netlify (static)
irc.example.org     → DO Droplet (WebSocket)
cdn.example.org     → DO Spaces CDN (files)
```

---

## Design System

### Palette
| Variable | Value | Use |
|----------|-------|-----|
| `--q-accent-teal` | `#08D9D6` | Active states, links, focus borders |
| `--q-accent-orange` | `#e85d3b` | Primary actions, CONNECT button, unread badges |
| `--q-accent-pink` | `#FF2E63` | Errors, danger actions, QUIRC "QU" letters |
| `--q-accent-acid` | `#EAFF00` | Scanline effects, highlights |
| `--q-accent-gold` | `#f0c040` | Warnings, away status |
| `--q-accent-green` | `#6bcb77` | Online status, success |

### Rules
- **Font**: Space Mono everywhere. No exceptions.
- **Border-radius**: 0 everywhere. `border-radius: 0 !important` in base.css.
- **Borders**: Solid 1-2px. Dashed for info containers (MOTD).
- **Labels**: UPPERCASE, letter-spacing 2-4px, 9-10px size.
- **Touch targets**: 44px minimum height.
- **No emoji in UI chrome**. Emoji only in: message content, reactions, emoji picker.
- **No CSS framework**. Scoped styles + custom properties only.

---

## Key Decisions

1. **Singleton IRC client** — single connection per app instance, accessed via `getClient()`
2. **Event-driven bridge** — `useIRC()` composable registers handlers, routes to stores
3. **localStorage for config** — connection, settings, channel state survive refresh
4. **Memory-only messages** — IndexedDB schema ready but not active (performance tradeoff)
5. **No component library** — all UI hand-built for precise control over punk aesthetic
6. **Shared logo data** — `logoPixels.js` feeds both static SVG and canvas animation
7. **Env var defaults** — deployers configure via `.env`, users override in ConnectionModal
8. **Saved server profiles** — multi-deployment support without multi-connection complexity

---

## Dev Commands

```bash
npm install            # Install dependencies
npm run dev            # Vite dev server (localhost:5173)
npm run build          # Production build → dist/
npm run preview        # Preview production build locally
```
