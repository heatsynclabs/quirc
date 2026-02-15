# QUIRC Handoff Document

**QUIRC** (QUick IRC) — mobile-first, self-hosted IRC client.
Vue 3 + Vite + Pinia. Punk-zine aesthetic. Zero dependencies beyond Vue ecosystem.

**Status:** Deployed to production. v0.4.0 — Deploy hardening, DB persistence, multi-origin CORS, image loading fix.
**Version:** 0.4.0 | **License:** MIT (quirc.chat)

**Production URLs:**
- Frontend: https://quirc.chat (Netlify)
- IRC Server: wss://irc.quirc.chat (DO App Platform, Ergo IRC)
- CDN: quirc.sfo3.cdn.digitaloceanspaces.com (DO Spaces)

---

## File Tree

```
quirc/
├── package.json              # vue 3.5, vue-router 4, pinia 3, dexie 4, @aws-sdk/client-s3, vite 6
├── vite.config.js            # Vue plugin, @ → src/ alias
├── index.html                # Entry HTML, Space Mono font, viewport-fit=cover, zoom locked
├── netlify.toml              # Build config, /api/* → functions, SPA fallback
├── .env.example              # All VITE_ + DO_SPACES_ env vars documented
├── .gitignore                # node_modules, dist, .env*, !.env.example
├── LICENSE                   # MIT
├── README.md                 # Setup instructions
├── prd.md                    # Full PRD v0.3.0 (reference only)
├── quirc_app.jsx             # React mockup (design reference only, not used)
│
├── public/
│   ├── favicon.svg           # Pink "Q" pixel favicon (from logo pixel art)
│   ├── manifest.json         # PWA manifest
│   └── noise.svg             # feTurbulence noise texture
│
├── deploy/
│   ├── Dockerfile            # Ergo IRC + mc backup client, custom entrypoint for DB persistence
│   ├── entrypoint.sh         # DB backup/restore to DO Spaces, periodic backup, graceful shutdown
│   ├── ircd.yaml             # Ergo config: WebSocket :8080, enforce-utf8, in-memory history
│   └── app.yaml              # DO App Platform spec: basic-xxs, auto-deploy, Spaces backup envs
│
├── netlify/functions/
│   ├── unfurl.js             # OpenGraph metadata proxy — SSRF-protected, dynamic CORS
│   └── upload-url.js         # Presigned S3 upload URL — type allowlist, size limit, dynamic CORS
│
└── src/
    ├── main.js               # Creates app, installs Pinia + Router, imports CSS
    ├── App.vue               # Root shell: splash → main layout + all overlays + viewport tracking
    │
    ├── router/
    │   └── index.js          # / → /channel/general, /channel/:name
    │
    ├── styles/
    │   ├── variables.css     # Full --q-* design system (palette, type, spacing)
    │   └── base.css          # Reset, border-radius:0 !important, position:fixed body, scrollbars
    │
    ├── stores/               # Pinia composition-style (setup function syntax)
    │   ├── connection.js     # Nick, server, SASL, MOTD, saved profiles. localStorage.
    │   ├── channels.js       # Channel list, active, topics, unread, mute, saved DMs. localStorage.
    │   ├── messages.js       # Per-channel message maps, reply target, reactions, auto-trim. Subtype support.
    │   ├── users.js          # Per-channel user tracking with op/voice/status, sorted computed
    │   ├── settings.js       # 16 settings across 4 categories, auto-persist via watch
    │   └── ui.js             # All overlay/drawer open states + toggle methods + WHOIS card state
    │
    ├── irc/                  # Core IRC protocol
    │   ├── client.js         # WebSocket client: CAP LS 302, SASL PLAIN, BATCH, chathistory, reconnect
    │   ├── parser.js         # IRCv3 message parser (tags, source, command, params)
    │   ├── commands.js       # Slash command parser (20+ commands) + COMMAND_HELP
    │   ├── format.js         # mIRC color/bold/italic stripper (wired into PRIVMSG handler)
    │   └── caps.js           # CAP constants (mostly handled in client.js now)
    │
    ├── composables/
    │   ├── useIRC.js         # Main bridge: IRC events → stores. 20+ handlers. BATCH replay. System subtypes.
    │   ├── useSearch.js      # Debounced message search (300ms)
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
        │   ├── IconChevron.vue       # Chevron arrow
        │   ├── IconInfo.vue          # Info circle
        │   ├── IconUsers.vue         # People group
        │   ├── IconList.vue          # List lines
        │   ├── IconGithub.vue        # GitHub logo
        │   ├── IconSun.vue           # Sun (light theme)
        │   ├── IconMoon.vue          # Moon (dark theme)
        │   └── index.js              # Barrel export
        │
        ├── logo/
        │   ├── QuircMark.vue         # Static SVG pixel logo (uses logoPixels)
        │   └── SplashLogo.vue        # Canvas animation: pixel rain, scanline, CRT
        │
        ├── shared/
        │   ├── NoiseOverlay.vue      # Fixed noise texture at 3.5% opacity
        │   ├── SlashCommandPalette.vue # Scrollable command autocomplete, shows on `/`
        │   └── TypingIndicator.vue   # Animated dots + nick list
        │
        ├── layout/
        │   ├── TopBar.vue            # Logo + channel + mode badges + search + user count
        │   ├── TopicBanner.vue       # Full-width topic bar below topbar, click opens ChannelInfo
        │   ├── InputBar.vue          # Reply bar + nick display + input + send. History + tab complete + typing + upload.
        │   ├── ChannelDrawer.vue     # Left slide: collapsible sections, close buttons, join (+), leave (ctx), settings
        │   └── UsersDrawer.vue       # Right slide: users, click → WHOIS/DM/Kick actions
        │
        ├── messages/
        │   ├── MessageList.vue       # Scroll container, MOTD, empty state, smart auto-scroll, viewport-aware
        │   ├── MessageItem.vue       # Nick + time + body + reactions + hover actions + inline image + /me actions
        │   ├── SystemMessage.vue     # Icon + color per subtype (join/part/kick/mode/error/whois/etc.)
        │   ├── RichText.vue          # Fenced code blocks + inline code + clickable URLs
        │   ├── CodeBlock.vue         # Green text, dark bg, left accent border
        │   ├── ReplyContext.vue      # Nick-colored left border + quoted text
        │   ├── LinkPreview.vue       # Teal left border card (domain, title, desc)
        │   ├── InlineImage.vue       # Image display with loading placeholder, 340×300px max
        │   └── Reactions.vue         # Emoji badges with counts
        │
        └── overlays/
            ├── ConnectionModal.vue   # Tabbed: Guest / Register / Sign In + server config + saved servers
            ├── RegisterNickModal.vue # Post-connect NickServ registration (from settings)
            ├── SettingsPanel.vue     # All 16 settings: display, media, behavior, advanced, connection
            ├── JoinChannelModal.vue  # Channel name + key, server LIST browser, click-to-join
            ├── ChannelInfoPanel.vue  # Channel info: topic, modes, ban list
            ├── ChannelDiscoveryModal.vue # Browse server channel list
            ├── HelpPanel.vue         # Keyboard shortcuts and help info
            ├── UserInfoCard.vue      # WHOIS card: avatar, nick, hostmask, channels, badges, DM button
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
- **BATCH protocol**: Collects messages tagged with `batch=<id>` into batch objects, emits `batch:end` when complete. Used for chathistory replay.
- **Chat history**: `chathistory(target, limit)` sends `CHATHISTORY LATEST` if cap is available
- **Reconnect**: Exponential backoff `[1, 2, 4, 8, 16, 30]` seconds
- **Commands**: `join part privmsg notice action topic changeNick who whois kick ban unban mode invite list away chathistory sendRaw tagmsg privmsgWithTags`
- **Events**: `status registered serverinfo motd nick:error channel:error error sasl:success sasl:fail reconnecting batch:end` + all IRC commands (`PRIVMSG JOIN PART KICK QUIT NICK TOPIC MODE NOTICE INVITE TAGMSG AWAY` + numerics)

#### tagmsg / privmsgWithTags

```js
// Send TAGMSG (requires message-tags cap, used by reactions + typing)
client.tagmsg(target, { '+draft/react': '👍', '+draft/reply': msgId })

// Send PRIVMSG with IRCv3 tags (used by reply threading)
client.privmsgWithTags(target, text, { '+draft/reply': msgId })

// Request chat history after joining a channel
client.chathistory('#general', 100)
```

### useIRC Composable (`src/composables/useIRC.js`)

Bridges IRC events to Pinia stores. Registers 20+ event handlers on mount, cleans up on unmount.

Key behaviors:
- `PRIVMSG` → `messages.addMessage()`, DM channel auto-creation, unread increment (muted channels skipped), URL detection → inline image or async link preview fetch (gated on settings), mIRC format stripping via `stripFormatting()`, reply reference resolution
- `JOIN/PART/KICK/QUIT` → `channels.addChannel/removeChannel`, `usersStore.addUser/removeUser` (per-channel). QUIT broadcast scoped to channels where user was present.
- `353 (NAMES)` / `352 (WHO)` → populate per-channel user list with op/voice/status
- `WHOIS` → buffer across 311-318 numerics, opens UserInfoCard overlay on 318 (end)
- `433 (nick in use)` → auto-retry with `nick_1`, `nick_2`, etc. during registration
- `MODE` → parse +o/-o/+v/-v, update user modes per-channel
- `NOTICE` → suppresses service notices (NickServ etc.) and server `***` connection notices
- `TAGMSG` → reactions (`+draft/react`) and typing indicators (`+typing`)
- `batch:end` → replays chathistory PRIVMSG messages into the message store
- Slash commands → `handleCommand()` dispatches to IRC client methods
- `sendInput()` → uses `privmsgWithTags()` with `+draft/reply` tag when replying
- All `addSystemMessage()` calls include a `subtype` for typed rendering (join/part/kick/mode/error/etc.)
- On connect without SASL: shows registration tip for history persistence

### System Message Subtypes

System messages carry a `subtype` field for distinct icon + color rendering:

| Subtype | Events | Icon | Color |
|---------|--------|------|-------|
| `join` | JOIN | → | green |
| `part` | PART | ← | dim |
| `quit` | QUIT | ← | dim |
| `kick` | KICK | ✘ | pink |
| `mode` | MODE | ⚙ | teal |
| `topic` | TOPIC | ✎ | teal |
| `nick` | NICK | ↔ | gold |
| `error` | errors, channel errors, nick errors | ⚠ | pink |
| `whois` | WHOIS lines | ℹ | blue |
| `info` | NOTICE, SASL, help, default | — | dim italic |

### Stores

All use Pinia composition API (setup function syntax).

| Store | Persists | Key State |
|-------|----------|-----------|
| `connection` | localStorage | nick, serverHost, gatewayUrl, SASL config, savedServers[], motd[], status |
| `channels` | localStorage (lastActive, muted, savedDMs) | channels[], activeChannel, currentChannel computed, getSavedDMs() |
| `messages` | memory only | messagesByChannel Map, replyTarget, auto-trim to maxMessagesPerChannel |
| `users` | memory only | usersByChannel Map, currentUsers/sortedUsers computed (ops→voiced→status→alpha) |
| `settings` | localStorage (auto-watch) | 16 refs across display/media/behavior/advanced |
| `ui` | none | channelDrawerOpen, usersDrawerOpen, searchOpen, connectionModalOpen, settingsOpen, joinChannelOpen, registerNickOpen, whoisCardOpen, whoisData |

### Users Store (Per-Channel)

The users store tracks users per-channel via `usersByChannel` (a Map of channel → user array). Key methods:

```js
usersStore.addUser(channel, nick, { op, voiced, status })
usersStore.removeUser(channel, nick)
usersStore.removeUserFromAll(nick)  // QUIT handling
usersStore.hasUser(channel, nick)   // Check presence before broadcasting QUIT/NICK messages
usersStore.clearChannel(channel)    // On self-PART/KICK
usersStore.clearAll()               // On disconnect
```

`currentUsers` and `sortedUsers` are computed from the active channel.

### Routing

```
/                  → redirect to /channel/general
/channel/:name     → sets active channel to #name
```

Route ↔ channel sync is bidirectional:
- Changing the active channel updates the route
- Route params on load set the active channel

### URL Auto-Config

Query parameters auto-configure and connect:
```
https://quirc.chat/?ws=wss://myserver.com&server=myserver.com&nick=guest&channels=general,random&port=6697
```
Communities can share pre-configured links. Params are cleaned from the URL after applying.

---

## Feature Status

### Working

- Real WebSocket IRC connection with CAP + SASL
- Auto-reconnect with exponential backoff
- Channel join/part/list with unread badges (muted channels excluded)
- Message display with timestamps + deterministic nick colors (both gated on settings)
- `/me` action rendering (italic `* nick text` format)
- **System message types** — join/part/quit/kick/mode/topic/nick/error/whois each with distinct icon + color
- mIRC color/bold/italic stripping on incoming messages
- Per-channel user tracking with op > voiced > status > alphabetical sorting
- 20+ slash commands (/join /part /me /topic /nick /msg /notice /kick /ban /mode /invite /whois /list /away /back /clear /connect /help /raw /quit)
- **Slash command palette** — shows all commands on `/`, scrollable, keyboard-navigable
- MOTD display from server
- **Connection modal** — tabbed interface with Guest/Register/Sign In flows
- **NickServ registration** — inline flow in ConnectionModal (connect → register → auto-configure SASL), plus standalone RegisterNickModal from settings for already-connected users
- Saved server profiles (add/load/switch)
- Settings panel (16 persistent settings — all wired to actual functionality)
- Join channel modal with server LIST browser
- Input history (up/down arrow, 100 entries)
- Tab nick completion
- **Topic banner** — full-width topic display below topbar, click opens ChannelInfoPanel
- **Nick in input bar** — teal nick display replaces `>` prompt, max-width truncation
- **Sidebar close buttons** — `×` on hover per channel/DM row, part or close on click
- **Collapsible sidebar sections** — disclosure arrows on CHANNELS and DMs headers
- **User info card** — WHOIS data opens a structured overlay card with avatar, nick, hostmask, channels, badges, DM button
- Channel context menu (leave, mute)
- User actions (click → WHOIS/DM/Kick)
- Connection status indicator (top bar + channel drawer footer)
- First-run flow (show ConnectionModal if not configured)
- **Registration tip** — non-SASL users see a tip about registering for persistent history
- **DM persistence** — DM channel names saved to localStorage, restored on reconnect with chathistory fetch
- **URL auto-config** — query params (?ws=&server=&nick=&channels=) for community deploy links
- **Chat history** — IRCv3 BATCH + chathistory cap loads 100 recent messages on channel join
- **Smart auto-scroll** — scrolls to bottom for new messages only when near bottom; maintains position when scrolled up (reading history)
- Splash screen with dynamic server name
- **Mobile viewport handling** — visualViewport listener tracks keyboard resize, no content jumping
- Safe-area insets for notched devices
- Animated splash (pixel logo → wordmark → fade)
- Noise texture overlay
- Scoped CSS with full `--q-*` design system
- **Clickable URLs** in messages via `RichText.vue`
- **Link previews** — URLs in messages async-fetched via unfurl API (gated on settings)
- **Inline images** — image URLs render inline with loading placeholder (gated on settings)
- **Reactions** — send via TAGMSG `+draft/react`, receive + display with emoji badges
- **Typing indicators** — send throttled (3s) TAGMSG `+typing=active`, display with 7s auto-expire (both directions gated on settings)
- **Reply threading** — send with `+draft/reply` tag, receive + resolve parent message context
- **File upload** — presigned PUT to DO Spaces via XHR (progress events), CDN URL inserted into input
- **Emoji picker** — 10 quick-access emojis wired to reaction sending
- **Desktop notifications** — Web Notifications API, fires on DMs/mentions/keywords (gated on settings)
- **Keyboard shortcuts** — Escape closes overlays (priority order), Cmd/Ctrl+K toggles search
- **Message limit** — auto-trims oldest messages per channel (configurable in settings)
- **SSRF protection** on unfurl proxy — rejects private IPs, auth URLs, enforces size limits
- **Upload hardening** — content-type allowlist, filename validation, 25MB size limit
- **CORS headers** on both Netlify functions — dynamic origin matching against comma-separated `CORS_ORIGIN` env var (defaults to quirc.chat)
- **Server notice filtering** — `***` server connection notices suppressed from chat
- **Event handler cleanup** — all IRC client listeners properly cleaned up in onUnmounted

### Not Started

- Service worker / PWA offline
- Web push notifications (service worker push, not desktop notifications)
- Full chat history browsing (load older messages beyond initial 100)
- Read markers / last-read tracking
- Virtual scrolling for large message lists
- IndexedDB message persistence (schema ready in Dexie)
- mIRC color rendering (parser strips them, doesn't render)
- Multi-server simultaneous connections
- End-to-end encryption
- Custom themes
- Syntax highlighting in code blocks

### Known Limitations

- **Chat history requires registered account** — Ergo stores history per-account. Guest users get no server-side history. A tip is shown on connect for unregistered users.
- **NAMES prefix parsing** — only `@` (op) and `+` (voice) are handled. Multi-prefix modes (`~` owner, `&` admin, `%` halfop) are not stripped, which could store nicks with prefix characters.
- **Touch hover on messages** — long-press sets hover state for action buttons but there's no mechanism to clear it on touch devices (mouseleave doesn't fire).

---

## v0.4.0 Changelog

### Deploy Hardening

1. **Database persistence** — New `deploy/entrypoint.sh` backs up `ircd.db` to DO Spaces via MinIO client (`mc`). Restores on startup, backs up every 5 min, saves on SIGTERM. Solves App Platform's ephemeral filesystem wiping accounts/channels/history on redeploy.

2. **Dockerfile overhaul** — Installs `mc` binary, ensures `ergo` user exists, uses custom entrypoint instead of running Ergo directly. Proper signal handling with trap/cleanup.

3. **app.yaml env vars** — Added `DO_SPACES_KEY`, `DO_SPACES_SECRET`, `DO_SPACES_REGION`, `DO_SPACES_BUCKET`, `BACKUP_INTERVAL` for the ergo service.

4. **ircd.yaml audit fixes** — Fixed `websocket-origins` → correct `websockets.allowed-origins` key (was silently ignored). Removed dead `bouncer` section and invalid `retention.cutoff`. Bumped `bcrypt-cost` 4→10. Tightened registration throttling 30→5 attempts. Added `max-channels-per-client`, `operator-only-creation`, channel registration limits. Added localhost to WebSocket origins. Note: `history.persistent` is disabled — current Ergo stable requires MySQL for persistent history. In-memory history (10k msgs/channel, 168h expiry) works fine and the DB backup preserves accounts/channels.

### Client Fixes

5. **Image loading fix** — Removed `crossorigin="anonymous"` from InlineImage `<img>` tag. Was forcing CORS preflight on CDN image GETs, causing "LOADING" stuck state when CDN doesn't return CORS headers.

6. **Connection defaults from env** — ConnectionModal now pre-fills server fields from `import.meta.env.VITE_*` with hardcoded fallbacks. Users can type a nick and connect immediately without touching server settings.

7. **Password form warning** — Wrapped ConnectionModal body in `<form @submit.prevent>` to suppress Chrome "password field not in form" DOM warning.

8. **Logo fix** — Removed Node.js error output appended to `public/logo.svg`.

9. **Favicon from logo** — Replaced generic favicon with pixel-art Q extracted from the logo (same #FF2E63 on #0a0a0a).

### Multi-Deployment CORS

10. **Dynamic origin matching** — Both `upload-url.js` and `unfurl.js` now support comma-separated `CORS_ORIGIN` env var. Dynamically matches request `Origin` header against the allowed list. Enables forks (e.g. heatsynclabs.chat) to set their own origin without code changes.

---

## v0.3.0 Changelog

### UX Improvements (Libera Chat patterns)

1. **System Message Types** — all system messages now carry a `subtype` (join/part/quit/kick/mode/topic/nick/error/whois/info) with distinct icons and colors. Backward compatible — default is `'info'`.

2. **Topic Banner** — new `TopicBanner.vue` between TopBar and MessageList. Shows full channel topic with teal info icon. Click opens ChannelInfoPanel. Topic removed from topbar.

3. **Nick in Input Bar** — replaces `>` prompt with current nick in teal, separated by vertical border. Shows nick collision results (e.g. `Guest38_1`).

4. **Sidebar Close Buttons** — `×` on each channel/DM row in ChannelDrawer. Hidden by default, visible on hover (always visible on touch). Part channels, remove DMs.

5. **Collapsible Sidebar Sections** — disclosure triangles on CHANNELS and DIRECT MESSAGES headers. Ephemeral state.

6. **User Info Card** — WHOIS data now opens `UserInfoCard.vue` overlay instead of dumping text lines. Shows avatar initial, nick, hostmask, real name, account, server, channels, TLS/OPER badges, idle time, DM button.

### Other Changes

7. **DM Persistence** — DM channel names saved to localStorage and restored on reconnect with chathistory fetch.
8. **Registration Tip** — non-SASL users see info message about registering for persistent history.
9. **Server Notice Filtering** — `***` connection notices (hostname lookup etc.) suppressed from chat.
10. **Slash Command Palette** — shows all commands on bare `/` (was requiring first letter), all commands listed (was capped at 8), scrollable with keyboard tracking.
11. **Smart Auto-Scroll** — MessageList now checks if user is near bottom before auto-scrolling. Maintains position when scrolled up reading history.

### Audit Fixes

- Deferred messages (nick collision) now preserve `'error'` subtype
- All `addSystemMessage` calls explicitly pass subtype parameter
- ChannelDrawer: replaced `v-show`+`v-if` and `v-show`+`v-for` anti-patterns with proper `<template v-if>` wrappers
- TopBar: merged duplicate `.topbar__center` CSS rule
- MessageList: removed dead `parseTimeToDate` function and unused `.msg-list__empty-hint` CSS

---

## Environment Variables

```env
# Client-side (VITE_ prefix, baked into build)
VITE_DEFAULT_SERVER=irc.quirc.chat
VITE_DEFAULT_PORT=6697
VITE_GATEWAY_URL=wss://irc.quirc.chat
VITE_AUTO_JOIN=#general,#random
VITE_UPLOAD_API=/api/upload-url
VITE_UNFURL_API=/api/unfurl

# Server-side (Netlify Functions)
DO_SPACES_KEY=
DO_SPACES_SECRET=
DO_SPACES_REGION=sfo3
DO_SPACES_BUCKET=quirc
DO_SPACES_CDN_DOMAIN=quirc.sfo3.cdn.digitaloceanspaces.com
CORS_ORIGIN=https://quirc.chat  # Comma-separated for multiple origins (e.g. https://quirc.chat,https://fork.example.com)
```

**Ergo service env vars** (set in DO App Platform dashboard, NOT in `.env`):

```env
DO_SPACES_KEY=           # Same Spaces key — used by entrypoint.sh for DB backup
DO_SPACES_SECRET=        # Same Spaces secret
DO_SPACES_REGION=sfo3
DO_SPACES_BUCKET=quirc
BACKUP_INTERVAL=300      # Seconds between periodic DB backups (default 300)
```

---

## Deployment

### Frontend: Netlify

- **Site:** quirc (quirc.netlify.app)
- **Custom domain:** quirc.chat
- **Auto-deploy:** linked to `virgilvox/quirc` main branch
- **Functions:** `/api/unfurl` and `/api/upload-url` (serverless, CORS-protected)
- **Env vars:** all variables set via Netlify dashboard/CLI

```bash
npm run build          # → dist/
netlify deploy --prod  # or git push (auto-deploy)
```

### IRC Server: DO App Platform (~$5/mo)

- **Ergo IRC server** in Docker container (`ghcr.io/ergochat/ergo:stable` + MinIO `mc` client)
- **WebSocket only** on port 8080, App Platform terminates TLS
- **Config:** `deploy/ircd.yaml` — multiclient, in-memory chat history (10k msgs, 168h expiry), account registration
- **Database persistence:** `deploy/entrypoint.sh` backs up `ircd.db` to DO Spaces on startup/shutdown/every 5 min. Survives App Platform redeployments.
- **Auto-deploy:** from `virgilvox/quirc` main branch via `deploy/app.yaml` spec
- **Health check:** TCP on port 8080 (not HTTP — Ergo returns 400 for non-WebSocket requests)
- **Env vars (set in dashboard):** `DO_SPACES_KEY`, `DO_SPACES_SECRET`, `DO_SPACES_REGION`, `DO_SPACES_BUCKET`, `BACKUP_INTERVAL`

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
- Presigned PUT URLs via `upload-url.js` function (content-type allowlist, 25MB limit)
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
| `--q-accent-teal` | `#08D9D6` | Active states, links, focus borders, register actions, mode/topic messages |
| `--q-accent-orange` | `#e85d3b` | Primary actions, CONNECT button, unread badges |
| `--q-accent-pink` | `#FF2E63` | Errors, danger actions, kick/error messages, close buttons |
| `--q-accent-acid` | `#EAFF00` | Scanline effects, highlights |
| `--q-accent-gold` | `#f0c040` | Warnings, away status, nick change messages |
| `--q-accent-green` | `#6bcb77` | Online status, success, join messages |
| `--q-accent-blue` | `#4d96ff` | WHOIS messages |

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
3. **localStorage for config** — connection, settings, channel state, saved DMs survive refresh
4. **Memory-only messages** — IndexedDB schema ready but not active (performance tradeoff)
5. **No component library** — all UI hand-built for precise control over punk aesthetic
6. **Shared logo data** — `logoPixels.js` feeds both static SVG and canvas animation
7. **Env var defaults** — deployers configure via `.env`, users override in ConnectionModal
8. **Saved server profiles** — multi-deployment support without multi-connection complexity
9. **App Platform over Droplet** — Docker-based, auto-deploy, managed TLS, no server maintenance
10. **XHR for uploads** — XMLHttpRequest instead of fetch for upload progress events
11. **Reactivity-safe async** — link preview fetches look up messages through Pinia store proxy, not raw object references
12. **Per-channel user tracking** — `usersByChannel` map prevents user lists leaking across channels; QUIT messages scoped to channels where user was present
13. **Tabbed connection UX** — Guest/Register/Sign In tabs educate IRC newcomers about nickname ownership without requiring registration upfront
14. **Inline NickServ registration** — ConnectionModal stays open during register flow (connect → NickServ REGISTER → auto-SASL setup) for seamless onboarding
15. **Mobile viewport tracking** — `visualViewport` API resize listener sets `--app-height` CSS variable to prevent keyboard-induced layout jumping
16. **WHOIS as card, not text** — structured data rendered in UserInfoCard overlay instead of text dump into chat
17. **System message subtypes** — typed system messages enable per-event styling without parsing text content

---

## Known Gotchas

- **Echo-message cap**: When server supports `echo-message`, client must NOT add outgoing messages locally — they come back from the server. The guard in useIRC.js PRIVMSG handler checks `!client._capAcked.includes('echo-message')`.
- **Link preview reactivity**: Async unfurl results must be written to the message via the reactive Pinia store proxy (not the original object reference) or Vue won't detect the change.
- **TAGMSG cap guard**: `client.tagmsg()` silently no-ops if `message-tags` cap wasn't acknowledged. Check cap status when debugging missing reactions/typing.
- **Ergo health checks**: Must use TCP, not HTTP. Ergo returns 400 for plain HTTP requests to its WebSocket port.
- **DO Spaces CORS**: Must be configured in the DO console (API keys may lack bucket management permissions). Required for presigned PUT uploads from the browser.
- **Registration flow timing**: The ConnectionModal register tab watches `connection.status` to transition from "connecting" to "registering" phase. If the connection fails silently, a 10s timeout catches the stall.
- **BATCH message collection**: Messages with a `batch` tag are silently collected during the batch and NOT emitted individually. They only surface via `batch:end`. If chathistory messages aren't appearing, check that the batch handler is wired.
- **Mobile keyboard**: `html, body` are `position: fixed` to prevent iOS rubber-banding. The `--app-height` variable is set by the `visualViewport` resize listener. Without it, the fallback is `100dvh` which doesn't account for keyboard.
- **Chat history requires registration**: Ergo stores history per-account. Guest nicks get no server-side history. DM channel names are persisted client-side, but actual message content requires a registered account.
- **getSavedDMs() reads initial state**: The `channels.getSavedDMs()` method reads from the `saved` object captured at store creation time. This is correct for its use case (called once on connect) but would return stale data if called mid-session.

---

## Dev Commands

```bash
npm install            # Install dependencies
npm run dev            # Vite dev server (localhost:5173)
npm run build          # Production build → dist/
npm run preview        # Preview production build locally
```
