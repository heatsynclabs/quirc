# QUIRC Handoff Document

**QUIRC** (QUick IRC) — mobile-first, self-hosted IRC client.
Vue 3 + Vite + Pinia. Punk-zine aesthetic. Zero dependencies beyond Vue ecosystem.

**Status:** Deployed to production. All 8 MVP features wired and working.
**Version:** 0.1.0 | **License:** MIT (quirc.chat)

**Production URLs:**
- Frontend: https://quirc.chat (Netlify)
- IRC Server: wss://irc.quirc.chat (DO App Platform, Ergo IRC)
- CDN: quirc.sfo3.cdn.digitaloceanspaces.com (DO Spaces)

---

## File Tree (81 source files)

```
quirc/
├── package.json              # vue 3.5, vue-router 4, pinia 3, dexie 4, @aws-sdk/client-s3, vite 6
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
│   ├── Dockerfile            # Ergo IRC from ghcr.io/ergochat/ergo:stable
│   ├── ircd.yaml             # Ergo config: WebSocket :8080, enforce-utf8, bouncer, history
│   └── app.yaml              # DO App Platform spec: basic-xxs, auto-deploy from GitHub
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
    │   ├── useFileUpload.js  # Presigned URL upload via XHR (progress events)
    │   └── useNotifications.js # Desktop notifications via Web Notifications API
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
        │   ├── InputBar.vue          # Reply bar + > prompt + input + send. History + tab complete + typing + upload.
        │   ├── ChannelDrawer.vue     # Left slide: channels, join (+), leave (ctx), settings gear
        │   └── UsersDrawer.vue       # Right slide: users, click → WHOIS/DM/Kick actions
        │
        ├── messages/
        │   ├── MessageList.vue       # Scroll container, server MOTD, empty state, auto-scroll
        │   ├── MessageItem.vue       # Nick + time + body + reactions + hover actions + inline image
        │   ├── SystemMessage.vue     # Italic muted server messages
        │   ├── RichText.vue          # Fenced code blocks + inline code
        │   ├── CodeBlock.vue         # Green text, dark bg, left accent border
        │   ├── ReplyContext.vue      # Nick-colored left border + quoted text
        │   ├── LinkPreview.vue       # Teal left border card (domain, title, desc)
        │   ├── InlineImage.vue       # Image display with loading placeholder, 340×300px max
        │   └── Reactions.vue         # Emoji badges with counts
        │
        └── overlays/
            ├── ConnectionModal.vue   # Full connect form: nick, server, WS URL, SASL, saved servers
            ├── SettingsPanel.vue     # All 16 settings: display, media, behavior, advanced, connection
            ├── JoinChannelModal.vue  # Channel name + key, server LIST browser, click-to-join
            ├── SearchOverlay.vue     # Full-screen search with filtered results
            ├── EmojiPicker.vue       # 10 quick-access emojis, wired to reactions
            └── FileUploadToast.vue   # Upload progress bar with percentage
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
- **Commands**: `join part privmsg notice action topic changeNick who whois kick ban unban mode invite list away sendRaw tagmsg privmsgWithTags`
- **Events**: `status registered serverinfo motd nick:error channel:error error sasl:success sasl:fail reconnecting` + all IRC commands (`PRIVMSG JOIN PART KICK QUIT NICK TOPIC MODE NOTICE INVITE TAGMSG AWAY` + numerics)

#### tagmsg / privmsgWithTags

```js
// Send TAGMSG (requires message-tags cap, used by reactions + typing)
client.tagmsg(target, { '+draft/react': '👍', '+draft/reply': msgId })

// Send PRIVMSG with IRCv3 tags (used by reply threading)
client.privmsgWithTags(target, text, { '+draft/reply': msgId })
```

### useIRC Composable (`src/composables/useIRC.js`)

Bridges IRC events to Pinia stores. Registers 20+ event handlers on mount, cleans up on unmount.

Key behaviors:
- `PRIVMSG` → `messages.addMessage()`, DM channel auto-creation, unread increment, URL detection → inline image or async link preview fetch, reply reference resolution
- `JOIN/PART/KICK/QUIT` → `channels.addChannel/removeChannel`, `usersStore.addUser/removeUser`
- `353 (NAMES)` / `352 (WHO)` → populate user list with op/voice/status
- `WHOIS` → buffer across 311-318 numerics, display on 318 (end)
- `433 (nick in use)` → auto-retry with `nick_1`, `nick_2`, etc. during registration
- `MODE` → parse +o/-o/+v/-v, update user modes
- `TAGMSG` → reactions (`+draft/react`) and typing indicators (`+typing`)
- Slash commands → `handleCommand()` dispatches to IRC client methods
- `sendInput()` → uses `privmsgWithTags()` with `+draft/reply` tag when replying

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
- **Link previews** — URLs in messages async-fetched via unfurl API, rendered in `LinkPreview.vue`
- **Inline images** — image URLs (.jpg/.png/.gif/.webp/.svg) render inline with loading placeholder
- **Reactions** — send via TAGMSG `+draft/react`, receive + display with emoji badges
- **Typing indicators** — send throttled (3s) TAGMSG `+typing=active`, display via `TypingIndicator.vue`
- **Reply threading** — send with `+draft/reply` tag, receive + resolve parent message context
- **File upload** — presigned PUT to DO Spaces via XHR (progress events), CDN URL inserted into input
- **Emoji picker** — 10 quick-access emojis wired to reaction sending
- **Desktop notifications** — Web Notifications API, fires on DMs and @mentions when tab is backgrounded

### Not Started

- Service worker / PWA offline
- Web push notifications (service worker push, not desktop notifications)
- Server-side history (`CHATHISTORY` command — Ergo supports it, client does not yet request it)
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
VITE_DEFAULT_SERVER=irc.quirc.chat
VITE_DEFAULT_PORT=6697
VITE_GATEWAY_URL=wss://irc.quirc.chat
VITE_AUTO_JOIN=#general,#projects
VITE_UPLOAD_API=/api/upload-url
VITE_UNFURL_API=/api/unfurl
VITE_CDN_DOMAIN=quirc.sfo3.cdn.digitaloceanspaces.com

# Server-side (Netlify Functions only)
DO_SPACES_KEY=
DO_SPACES_SECRET=
DO_SPACES_REGION=sfo3
DO_SPACES_BUCKET=quirc
DO_SPACES_CDN_DOMAIN=quirc.sfo3.cdn.digitaloceanspaces.com
```

---

## Deployment

### Frontend: Netlify

- **Site:** quirc (quirc.netlify.app)
- **Custom domain:** quirc.chat
- **Auto-deploy:** linked to `virgilvox/quirc` main branch
- **Functions:** `/api/unfurl` and `/api/upload-url` (serverless)
- **Env vars:** all 12 variables set via Netlify dashboard/CLI

```bash
npm run build          # → dist/
netlify deploy --prod  # or git push (auto-deploy)
```

### IRC Server: DO App Platform (~$5/mo)

- **Ergo IRC server** in Docker container (`ghcr.io/ergochat/ergo:stable`)
- **WebSocket only** on port 8080, App Platform terminates TLS
- **Config:** `deploy/ircd.yaml` — bouncer mode, chat history (168h), account registration
- **Auto-deploy:** from `virgilvox/quirc` main branch via `deploy/app.yaml` spec
- **Health check:** TCP on port 8080 (not HTTP — Ergo returns 400 for non-WebSocket requests)

```bash
# Deploy or update
doctl apps create --spec deploy/app.yaml

# Check status
doctl apps list
```

### File Storage: DO Spaces (~$5/mo)

- **Bucket:** quirc (sfo3 region)
- **CDN:** quirc.sfo3.cdn.digitaloceanspaces.com
- **CORS:** configured for quirc.chat and quirc.netlify.app origins
- Presigned PUT URLs via `upload-url.js` function
- Path: `uploads/YYYY-MM/uuid.ext`

### DNS (managed by DigitalOcean)

```
quirc.chat         A     → 75.2.60.5 (Netlify load balancer)
irc.quirc.chat     CNAME → quirc-irc-r256h.ondigitalocean.app (App Platform)
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
9. **App Platform over Droplet** — Docker-based, auto-deploy, managed TLS, no server maintenance
10. **XHR for uploads** — XMLHttpRequest instead of fetch for upload progress events
11. **Reactivity-safe async** — link preview fetches look up messages through Pinia store proxy, not raw object references

---

## Known Gotchas

- **Echo-message cap**: When server supports `echo-message`, client must NOT add outgoing messages locally — they come back from the server. The guard in useIRC.js PRIVMSG handler checks `!client._capAcked.includes('echo-message')`.
- **Link preview reactivity**: Async unfurl results must be written to the message via the reactive Pinia store proxy (not the original object reference) or Vue won't detect the change.
- **TAGMSG cap guard**: `client.tagmsg()` silently no-ops if `message-tags` cap wasn't acknowledged. Check cap status when debugging missing reactions/typing.
- **Ergo health checks**: Must use TCP, not HTTP. Ergo returns 400 for plain HTTP requests to its WebSocket port.
- **DO Spaces CORS**: Must be configured in the DO console (API keys may lack bucket management permissions). Required for presigned PUT uploads from the browser.

---

## Dev Commands

```bash
npm install            # Install dependencies
npm run dev            # Vite dev server (localhost:5173)
npm run build          # Production build → dist/
npm run preview        # Preview production build locally
```
