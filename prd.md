# QUIRC — QUick IRC

**Product Requirements Document**
**Version:** 0.3.0
**Author:** devEco Consulting / quirc.chat
**Stack:** Vue 3 (Composition API) + Vite + Netlify (+ Functions) + DigitalOcean (Droplet + Spaces)
**License:** Open Source (MIT)

---

## Vision

QUIRC is a mobile-first, self-hosted IRC client that makes IRC feel modern without abandoning what makes it good. No Electron bloat, no SaaS lock-in, no corporate polish. 
It's a browser-native PWA that connects to your hackerspace's IRC server and gives you the features people defected to Slack/Discord for — link previews, reactions, file 
sharing, push notifications — while keeping everything on plain IRC under the hood.

The aesthetic is punk zine meets terminal. Monospace type, hard borders, noise textures, black backgrounds, red/yellow accents. If it looks like it was designed by a 
committee, it's wrong.

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────┐
│  Netlify                                             │
│                                                      │
│  quirc.yourspace.org                                 │
│  ┌─────────────────────────────────────────────────┐ │
│  │  Vue 3 PWA (static)                             │ │
│  │  Service worker, offline cache, manifest        │ │
│  └─────────────────────────────────────────────────┘ │
│                                                      │
│  Netlify Functions (serverless)                      │
│  ┌──────────────────────┐  ┌─────────────────────┐   │
│  │  /api/unfurl         │  │  /api/upload-url    │   │
│  │  Link preview proxy  │  │  Presigned PUT URL  │   │
│  │  (fetch OG metadata) │  │  for DO Spaces      │   │
│  └──────────────────────┘  └─────────────────────┘   │
└──────────────────────────────────────────────────────┘
          │                           │
          │ wss://                    │ HTTPS PUT (presigned)
          ▼                           ▼
┌─────────────────────┐    ┌─────────────────────────┐
│  DO Droplet ($6/mo) │    │  DO Spaces ($5/mo)      │
│  irc.yourspace.org  │    │  cdn.yourspace.org      │
│                     │    │                         │
│  nginx (TLS)        │    │  S3-compatible object   │
│  └─► Ergo WebSocket │    │  storage + built-in CDN │
│                     │    │                         │
│  Ergo IRC Server    │    │  Uploaded files served   │
│  ├─ TCP/TLS :6697   │    │  directly via CDN URL   │
│  ├─ WebSocket :8097 │    └─────────────────────────┘
│  ├─ Bouncer mode    │
│  ├─ chathistory     │
│  └─ IRCv3 caps      │
│                     │
│  Push Gateway       │
│  (optional, for     │
│   web push notifs)  │
└─────────────────────┘
```

**Three services, clean split:**

| Provider | Role | What runs there |
|----------|------|-----------------|
| **Netlify** (static) | Frontend | Vue 3 PWA, service worker, assets |
| **Netlify Functions** | Serverless API | Unfurl proxy, presigned upload URLs |
| **DO Droplet** | Persistent services | Ergo IRC server, push gateway |
| **DO Spaces** | File storage + CDN | Uploaded files (images, PDFs, etc.) |

Ergo has native WebSocket support, so no separate gateway binary is needed. The Droplet runs only things that need persistent connections. Everything stateless lives on 
Netlify.

---

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Vue 3 + Composition API | Lightweight, fast, great DX |
| Build | Vite | Instant HMR, fast builds |
| State | Pinia | Vue-native, simple, TypeScript-friendly |
| Routing | Vue Router | SPA with channel-as-route |
| Styling | CSS custom properties + scoped styles | No framework, full control over aesthetic |
| Font | Space Mono (Google Fonts) | Monospace with character |
| Storage | IndexedDB (via Dexie.js) | Scrollback, settings, local search |
| IRC | Custom WebSocket IRC client | IRCv3 message parser, CAP negotiation |
| IRC Server | Ergo | Native WebSocket, IRCv3, built-in bouncer, single binary |
| File Storage | DigitalOcean Spaces | S3-compatible, built-in CDN, $5/mo |
| Unfurl Proxy | Netlify Function | Serverless, no infra to manage |
| Upload Auth | Netlify Function | Generates presigned Spaces URLs |
| Deploy (frontend) | Netlify | Static PWA + Functions, zero config |
| Deploy (backend) | DigitalOcean Droplet | Ergo + push gateway, nginx, Let's Encrypt |
| PWA | vite-plugin-pwa | Service worker, offline, installable |

---

## Project Structure

```
quirc/
├── public/
│   ├── manifest.json
│   ├── favicon.svg
│   └── noise.svg
├── src/
│   ├── main.js
│   ├── App.vue
│   ├── router/
│   │   └── index.js
│   ├── stores/
│   │   ├── connection.js        # IRC connection state
│   │   ├── channels.js          # Channel list, topics, modes
│   │   ├── messages.js          # Message history per channel
│   │   ├── users.js             # Nick list, presence, whois cache
│   │   └── settings.js          # User preferences, server config
│   ├── irc/
│   │   ├── client.js            # WebSocket IRC client
│   │   ├── parser.js            # IRCv3 message parser
│   │   ├── caps.js              # CAP negotiation (IRCv3)
│   │   ├── commands.js          # IRC command handlers
│   │   └── format.js            # mIRC color / formatting parser
│   ├── composables/
│   │   ├── useIRC.js            # Main IRC composable
│   │   ├── useNotifications.js  # Push + in-app notifications
│   │   ├── useSearch.js         # Local message search
│   │   ├── useFileUpload.js     # File upload (presigned URL → Spaces)
│   │   └── useRichText.js       # Markdown-ish rendering
│   ├── components/
│   │   ├── layout/
│   │   │   ├── TopBar.vue
│   │   │   ├── ChannelDrawer.vue
│   │   │   ├── UsersDrawer.vue
│   │   │   └── InputBar.vue
│   │   ├── messages/
│   │   │   ├── MessageList.vue
│   │   │   ├── MessageItem.vue
│   │   │   ├── SystemMessage.vue
│   │   │   ├── LinkPreview.vue
│   │   │   ├── InlineImage.vue
│   │   │   ├── CodeBlock.vue
│   │   │   ├── ReplyContext.vue
│   │   │   └── Reactions.vue
│   │   ├── overlays/
│   │   │   ├── SearchOverlay.vue
│   │   │   ├── EmojiPicker.vue
│   │   │   ├── FileUploadToast.vue
│   │   │   └── ConnectionModal.vue
│   │   ├── shared/
│   │   │   ├── NoiseOverlay.vue
│   │   │   ├── TypingIndicator.vue
│   │   │   └── UnreadMarker.vue
│   │   └── SplashScreen.vue
│   ├── db/
│   │   └── index.js             # Dexie.js IndexedDB schema
│   ├── utils/
│   │   ├── nickColor.js         # Deterministic nick → color hash
│   │   ├── linkDetect.js        # URL detection + unfurling
│   │   ├── time.js              # Timestamp formatting
│   │   └── sanitize.js          # XSS prevention
│   └── styles/
│       ├── variables.css         # CSS custom properties (theme)
│       ├── base.css              # Reset + global styles
│       └── noise.css             # Noise texture overlay
├── netlify/
│   └── functions/
│       ├── unfurl.js             # Link preview metadata proxy
│       └── upload-url.js         # Presigned DO Spaces PUT URL
├── deploy/
│   ├── nginx.conf                # nginx reverse proxy config
│   ├── ergo.yaml                 # Ergo IRC server config
│   └── setup.sh                  # DO Droplet bootstrap script
├── netlify.toml
├── vite.config.js
├── package.json
└── README.md
```

---

## Feature Specifications

### P0 — Core (MVP)

These ship first. Without these, it's not usable.

#### F01: IRC Connection Engine
- WebSocket connection direct to Ergo's native WebSocket listener
- IRCv3 CAP negotiation: `message-tags`, `server-time`, `batch`, `echo-message`, `labeled-response`, `sasl`, `chathistory`, `away-notify`, `account-notify`
- SASL PLAIN authentication
- Auto-reconnect with exponential backoff (1s, 2s, 4s, 8s, max 30s)
- Connection status indicator in UI (connecting / connected / disconnected / error)
- Support for multiple server configurations stored in IndexedDB
- TLS required (wss:// only)

#### F02: Channel Management
- Join/part/list channels
- Channel topic display in top bar
- Channel list in left drawer with unread counts
- Unread message marker ("new messages" divider)
- Channel-as-route: `/channel/general` maps to `#general`
- Auto-join configured channels on connect
- `/join`, `/part`, `/topic` command support

#### F03: Message Display & Input
- Scrolling message list with virtual scrolling (vue-virtual-scroller) for performance
- Nick coloring via deterministic hash
- Timestamp display (HH:MM, configurable 12/24h)
- System messages (join/part/quit/mode) styled distinctly
- mIRC color code parsing and display
- Input bar with send button
- Input history (up arrow to cycle previous messages)
- Nick autocomplete with Tab key
- `/me` action support
- Max 10,000 messages per channel in memory, older in IndexedDB

#### F04: User List
- Right drawer showing users in current channel
- Sorted by: ops → voiced → regular, then alphabetical
- Online/away/offline status indicators
- Tap nick to insert @mention or open DM

#### F05: Mobile-First Layout
- Full viewport height, no browser chrome interference
- Safe area insets for notched devices
- Touch-friendly tap targets (min 44px)
- Swipe gestures: right-swipe from edge → channel drawer, left-swipe → user drawer
- Responsive: works on desktop but designed phone-first
- Virtual keyboard handling (input stays visible when keyboard opens)

#### F06: Splash Screen & Theming
- Animated splash on connect with QUIRC branding
- CSS custom properties for full theme control
- Default theme: "terminal" (black bg, red/yellow accents, noise overlay)
- Noise texture SVG overlay at low opacity
- Space Mono font throughout
- No rounded corners. Hard borders. Dashed where appropriate.

---

### P1 — Modern Features

These are what make QUIRC worth using over a basic IRC client.

#### F07: Rich Text Rendering
- Detect and render inline code with backticks: `` `code` ``
- Detect and render fenced code blocks with triple backticks
- Syntax highlighting in code blocks (highlight.js, lazy-loaded)
- Bold with `*asterisks*`
- Italic with `_underscores_`
- Strikethrough with `~tildes~`
- All rendering is client-side — raw text sent over IRC
- Fallback: other IRC clients see the raw markdown characters

#### F08: Link Previews
- Detect URLs in messages using regex
- Unfurl via Netlify Function (`/api/unfurl`)
- Display: domain, title, description, optional thumbnail
- Styled as bordered card below message with colored left border
- Lazy-load previews (don't block message rendering)
- Configurable: can disable per-channel or globally
- Cache unfurl results in IndexedDB

#### F09: Inline Media
- Detect image URLs (.jpg, .png, .gif, .webp) → render inline with lazy loading
- Detect video URLs (.mp4, .webm) → render inline player
- Thumbnail with click-to-expand for bandwidth control
- Configurable: auto-expand, thumbnail-only, or links-only
- NSFW/large file warning gate (optional)

#### F10: Message Reactions
- Long-press (mobile) or hover (desktop) to show reaction picker
- Emoji picker with 10 quick-access emojis + full picker
- Reactions encoded as CTCP or IRCv3 client tags
- Wire format: `TAGMSG #channel :+react msgid emoji`
- Other QUIRC clients render as reaction badges below message
- Non-QUIRC clients: reactions are invisible (TAGMSG is silently ignored)
- Toggle own reaction on/off by tapping existing reaction badge

#### F11: Reply Threading
- Long-press → "Reply" action on any message
- Reply bar appears above input showing quoted message
- Wire format: uses IRCv3 `+draft/reply` tag with parent `msgid`
- Display: reply context rendered above message with colored left border
- Non-QUIRC clients see: `@nick re: [truncated quote] — reply text`
- Fallback gracefully detected and parsed

#### F12: Message Search
- Full-text search across local IndexedDB scrollback
- Search overlay (full-screen on mobile)
- Results show timestamp, nick, preview, channel
- Tap result to jump to message in context
- Debounced search input (300ms)

#### F13: File Upload & Sharing
- Paperclip button in input bar
- Upload flow:
  1. Client requests presigned PUT URL from Netlify Function (`/api/upload-url`)
  2. Function generates presigned URL using DO Spaces API (`@aws-sdk/s3-request-presigner`)
  3. Client uploads file directly to DO Spaces via presigned URL
  4. On completion: CDN URL inserted into message, sent as regular IRC message
- Supported: images, PDFs, text files, archives
- Upload progress indicator (toast)
- QUIRC renders uploaded files with link preview card
- Files served via DO Spaces CDN (`cdn.yourspace.org`)
- Max file size configurable (default 10MB)
- Presigned URLs expire after 5 minutes

#### F14: Typing Indicators
- IRCv3 `+typing` client tag support
- Show animated dots + nick below message list
- Configurable: send typing status on/off
- Auto-clear after 6 seconds of inactivity
- Only display for active channel

---

### P2 — Infrastructure & Polish

#### F15: Push Notifications
- Service Worker-based web push
- Push gateway running on DigitalOcean Droplet (needs persistent Ergo connection)
- Notify on: DMs, @mentions, configurable keywords
- Notification actions: reply inline, mark read
- Respect Do Not Disturb / mute settings per channel
- Architecture: Ergo's built-in bouncer mode holds connection, push gateway watches for mentions and sends web push

#### F16: Server-Side History (IRCv3 chathistory)
- On channel join, request history via `CHATHISTORY LATEST #channel * 100`
- Render fetched history above "new messages" marker
- Infinite scroll up to load more history
- Merge with local IndexedDB cache (dedup by msgid)
- Graceful fallback if server doesn't support chathistory

#### F17: Read Markers
- Track last-read position per channel (IRCv3 `read-marker` or client-side)
- "New messages" divider positioned at last-read
- Sync across devices if server supports read-marker cap
- Update marker on scroll (debounced)

#### F18: Multi-Server Support
- Connect to multiple IRC networks simultaneously
- Server selector in channel drawer (above channel list)
- Per-server nick, auth, channel config
- Unified notification stream

#### F19: PWA / Installable
- `manifest.json` with QUIRC branding
- Service worker caches shell + assets for offline access
- "Add to Home Screen" prompt on mobile
- Standalone display mode (no browser chrome)
- App icon: Red "Q" on black background, hard edges

#### F20: Settings & Configuration
- Connection settings: server, port, nick, SASL credentials, auto-join channels
- Display settings: 12/24h time, font size, theme, media auto-expand
- Notification settings: per-channel mute, keyword alerts, DM notifications
- Privacy: typing indicator send on/off, away status auto-set
- Export/import config as JSON

---

### P3 — Nice to Have

#### F21: End-to-End Encryption
- OTR-style or custom encryption layer
- Key exchange via DCC or out-of-band
- Encrypted messages sent as base64 with QUIRC-specific CTCP prefix
- Non-QUIRC clients see: `[encrypted message — use QUIRC to view]`
- Per-conversation toggle

#### F22: Custom Themes
- Theme editor in settings
- Export/share themes as JSON
- Community theme gallery (static JSON hosted on repo)
- Preset themes: terminal (default), paper, solarized-dark, vapor

#### F23: Desktop Enhancements
- Keyboard shortcuts (Ctrl+K channel switcher, Ctrl+F search, etc.)
- Split-pane view on wide screens (channel list always visible)
- Desktop notifications via Notification API
- Drag-and-drop file upload

---

## Design System

### Colors (CSS Custom Properties)

```css
:root {
  --q-bg-primary: #0d0d0d;
  --q-bg-secondary: #0a0a0a;
  --q-bg-elevated: #111111;
  --q-bg-hover: #0f0f0f;

  --q-border: #222222;
  --q-border-strong: #333333;
  --q-border-dashed: #333333;

  --q-text-primary: #cccccc;
  --q-text-secondary: #999999;
  --q-text-muted: #555555;
  --q-text-dim: #444444;
  --q-text-ghost: #333333;

  --q-accent-red: #ff6b6b;
  --q-accent-yellow: #ffd93d;
  --q-accent-green: #6bcb77;
  --q-accent-blue: #4d96ff;
  --q-accent-orange: #ff922b;
  --q-accent-purple: #cc5de8;

  --q-font-mono: 'Space Mono', 'Courier New', monospace;
  --q-font-size-xs: 10px;
  --q-font-size-sm: 11px;
  --q-font-size-base: 13px;
  --q-font-size-md: 14px;
  --q-font-size-lg: 16px;

  --q-spacing-xs: 4px;
  --q-spacing-sm: 8px;
  --q-spacing-md: 12px;
  --q-spacing-lg: 16px;
  --q-spacing-xl: 20px;
}
```

### Typography Rules
- Everything is `var(--q-font-mono)`
- No serif or sans-serif fonts anywhere
- Uppercase + letter-spacing for labels and section headers
- Normal case for messages and body text
- Bold for nicks, section titles

### Spacing & Layout Rules
- No `border-radius` anywhere. Everything is square/sharp.
- Borders are `1px solid` or `2px solid`, never `0.5px`
- Dashed borders (`1px dashed`) for informational containers (MOTD, alerts)
- Touch targets minimum 44px
- Padding is `var(--q-spacing-md)` (12px) default

### Iconography
- No icon library. Use Unicode/emoji where needed.
- Hamburger: three `<div>` bars (18px, 14px, 18px)
- Status dots: colored circles with glow (`box-shadow`)
- File upload: 📎
- Search: ⌕

---

## IRC Server: Ergo

**Ergo (formerly Oragono)** is the required IRC server for QUIRC deployments.

Why Ergo:
- Written in Go, single binary, trivial to deploy on a DO Droplet
- Native IRCv3 support including: chathistory, read-marker, typing, message-tags, reply, react
- **Native WebSocket support** — no separate gateway binary needed
- Built-in bouncer mode (always-on accounts, history playback)
- Account registration with NickServ compatibility
- Active development, modern defaults
- Perfect for hackerspaces: one binary, one config file, done

---

## Deployment

### Infrastructure Layout

```
┌──────────────────────────────────────────────────┐
│ Netlify (free tier)                              │
│                                                  │
│  quirc.yourspace.org                             │
│  ├── Static PWA (Vue 3 build output)             │
│  │   └── Service worker, manifest, assets        │
│  └── Functions                                   │
│      ├── /api/unfurl      (link preview proxy)   │
│      └── /api/upload-url  (presigned Spaces URL) │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│ DigitalOcean Droplet ($6/mo)                     │
│ Ubuntu 24.04 LTS                                 │
│                                                  │
│  nginx (reverse proxy, TLS via Let's Encrypt)    │
│  └── irc.yourspace.org                           │
│      └── wss:// → Ergo WebSocket listener        │
│                                                  │
│  Ergo IRC Server                                 │
│  ├── TCP/TLS :6697 (native IRC clients)          │
│  ├── WebSocket :8097 (QUIRC via nginx)           │
│  ├── Bouncer mode enabled                        │
│  └── chathistory enabled                         │
│                                                  │
│  (Optional) Push gateway for web push notifs     │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│ DigitalOcean Spaces ($5/mo)                      │
│                                                  │
│  cdn.yourspace.org (Spaces CDN)                  │
│  └── /uploads/                                   │
│      ├── 2025/02/abc123-photo.jpg                │
│      ├── 2025/02/def456-schematic.pdf            │
│      └── ...                                     │
│                                                  │
│  250GB storage, 1TB outbound transfer            │
│  S3-compatible API                               │
└──────────────────────────────────────────────────┘
```

**Monthly cost: ~$11/mo** ($6 Droplet + $5 Spaces) plus Netlify free tier.

### File Upload Flow

```
┌──────────┐    1. POST /api/upload-url     ┌─────────────────┐
│  QUIRC   │ ──────────────────────────────► │ Netlify Function │
│  Client  │ ◄────────────────────────────── │ (upload-url.js)  │
│          │    2. { url, cdnUrl }           │ generates        │
│          │                                 │ presigned PUT    │
│          │    3. PUT file (presigned)      └─────────────────┘
│          │ ──────────────────────────────►┌─────────────────┐
│          │                               │  DO Spaces      │
│          │    4. 200 OK                  │  cdn.yourspace   │
│          │ ◄──────────────────────────── │  .org            │
│          │                               └─────────────────┘
│          │    5. Send IRC message:
│          │       "check this out https://cdn.yourspace.org/uploads/abc123.jpg"
└──────────┘
```

### Netlify Configuration

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"
  functions = "netlify/functions"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/manifest.json"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"
```

### Netlify Functions

```javascript
// netlify/functions/upload-url.js
// Generates presigned PUT URL for direct upload to DO Spaces

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

const s3 = new S3Client({
  endpoint: `https://${process.env.DO_SPACES_REGION}.digitaloceanspaces.com`,
  region: process.env.DO_SPACES_REGION,
  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY,
    secretAccessKey: process.env.DO_SPACES_SECRET,
  },
});

export async function handler(event) {
  if (event.httpMethod !== "POST") return { statusCode: 405 };

  const { filename, contentType } = JSON.parse(event.body);
  const ext = filename.split(".").pop();
  const key = `uploads/${new Date().toISOString().slice(0, 7)}/${randomUUID()}.${ext}`;

  const url = await getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: process.env.DO_SPACES_BUCKET,
      Key: key,
      ContentType: contentType,
      ACL: "public-read",
    }),
    { expiresIn: 300 } // 5 minutes
  );

  const cdnUrl = `https://${process.env.DO_SPACES_CDN_DOMAIN}/${key}`;

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, cdnUrl }),
  };
}
```

```javascript
// netlify/functions/unfurl.js
// Fetches OpenGraph metadata for link previews

export async function handler(event) {
  if (event.httpMethod !== "GET") return { statusCode: 405 };

  const targetUrl = event.queryStringParameters?.url;
  if (!targetUrl) return { statusCode: 400, body: "Missing url param" };

  try {
    const res = await fetch(targetUrl, {
      headers: { "User-Agent": "QUIRC-Unfurl/1.0" },
      signal: AbortSignal.timeout(5000),
    });
    const html = await res.text();

    const og = (prop) => {
      const match = html.match(
        new RegExp(`<meta[^>]*property=["']og:${prop}["'][^>]*content=["']([^"']*)["']`, "i")
      );
      return match?.[1] || null;
    };

    const title =
      og("title") ||
      html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ||
      null;

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=86400", // 24h CDN cache
      },
      body: JSON.stringify({
        title,
        description: og("description"),
        image: og("image"),
        site_name: og("site_name"),
        url: og("url") || targetUrl,
      }),
    };
  } catch {
    return { statusCode: 502, body: "Failed to fetch URL" };
  }
}
```

### DigitalOcean Droplet Setup

```bash
#!/bin/bash
# deploy/setup.sh — Bootstrap a fresh Ubuntu 24.04 Droplet
# This Droplet only runs Ergo + nginx. Much simpler than before.

set -e

# --- System ---
apt update && apt upgrade -y
apt install -y nginx certbot python3-certbot-nginx ufw

# --- Firewall ---
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw allow 6697/tcp    # IRC TLS (optional, for native IRC clients)
ufw --force enable

# --- Ergo IRC Server ---
ERGO_VERSION="2.14.0"  # check github.com/ergochat/ergo/releases
wget "https://github.com/ergochat/ergo/releases/download/v${ERGO_VERSION}/ergo-${ERGO_VERSION}-linux-x64.tar.gz"
tar xzf "ergo-${ERGO_VERSION}-linux-x64.tar.gz"
mv ergo-${ERGO_VERSION}-linux-x64 /opt/ergo
cp /opt/ergo/default.yaml /opt/ergo/ircd.yaml

# Create ergo user
useradd --system --home /opt/ergo --shell /usr/sbin/nologin ergo
chown -R ergo:ergo /opt/ergo

# --- Ergo systemd service ---
cat > /etc/systemd/system/ergo.service << 'EOF'
[Unit]
Description=Ergo IRC Server
After=network.target

[Service]
Type=simple
User=ergo
WorkingDirectory=/opt/ergo
ExecStart=/opt/ergo/ergo run --conf /opt/ergo/ircd.yaml
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable ergo

# --- TLS (run after DNS is pointed) ---
# certbot --nginx -d irc.yourspace.org

echo "Done. Edit /opt/ergo/ircd.yaml, then: systemctl start ergo"
```

### Ergo Configuration Highlights

```yaml
# deploy/ergo.yaml (key sections, not full config)

network:
  name: QuircIRC

server:
  name: irc.quirc.chat
  listeners:
    ":6667": {}                          # plaintext (local only / LAN)
    ":6697":
      tls:
        cert: /etc/letsencrypt/live/irc.quirc.chat/fullchain.pem
        key: /etc/letsencrypt/live/irc.quirc.chat/privkey.pem
    ":8097":                              # WebSocket listener for QUIRC
      websocket: true

  websocket-origins:
    - "https://quirc.quirc.chat"

accounts:
  registration:
    enabled: true
  authentication-enabled: true
  bouncer:
    enabled: true                         # always-on, multi-device

history:
  enabled: true
  channel-length: 10000
  client-length: 1000
  chathistory-maxmessages: 1000
  retention:
    allow-individual-delete: false
    cutoff: 168h                          # 7 days server-side

channels:
  default-modes: "+nt"
  registration:
    enabled: true
```

### nginx Configuration

```nginx
# deploy/nginx.conf
# Minimal — only proxying WebSocket to Ergo

server {
    server_name irc.quirc.chat;

    location / {
        proxy_pass http://127.0.0.1:8097;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # TLS managed by certbot
}
```

### Environment Variables

**Netlify (Settings → Environment Variables):**
```
VITE_DEFAULT_SERVER=irc.quirc.chat
VITE_DEFAULT_PORT=6697
VITE_GATEWAY_URL=wss://irc.quirc.chat
VITE_UPLOAD_API=/api/upload-url
VITE_UNFURL_API=/api/unfurl
VITE_CDN_DOMAIN=cdn.quirc.chat

# For Netlify Functions (server-side only, not exposed to client)
DO_SPACES_KEY=your-spaces-access-key
DO_SPACES_SECRET=your-spaces-secret-key
DO_SPACES_REGION=nyc3
DO_SPACES_BUCKET=quirc-files
DO_SPACES_CDN_DOMAIN=cdn.quirc.chat
```

### DNS Records

```
quirc.quirc.chat    CNAME  → Netlify (custom domain setup)
irc.quirc.chat      A      → DO Droplet IP
cdn.quirc.chat      CNAME  → quirc-files.nyc3.cdn.digitaloceanspaces.com
```

### Build & Deploy

```bash
# Frontend + Functions — develop locally
npm create vite@latest quirc -- --template vue
cd quirc
npm install
npm install pinia vue-router dexie
npm install -D @netlify/functions @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

npm run dev              # local dev (Vite)
netlify dev              # local dev with Functions
npm run build            # production build
netlify deploy --prod    # ship it

# Backend — on DigitalOcean Droplet
scp deploy/setup.sh root@YOUR_DROPLET_IP:/root/
ssh root@YOUR_DROPLET_IP "bash /root/setup.sh"
# Edit /opt/ergo/ircd.yaml, then:
systemctl start ergo
```

---

## DigitalOcean Spaces Setup

```bash
# Create via doctl CLI
doctl compute space create quirc-files --region nyc3

# Enable CDN
doctl compute cdn create \
  --origin quirc-files.nyc3.digitaloceanspaces.com \
  --domain cdn.quirc.chat \
  --certificate-id YOUR_CERT_ID

# Or just do it in the DO console:
# 1. Create Space "quirc-files" in nyc3
# 2. Settings → Enable CDN
# 3. Add custom subdomain cdn.quirc.chat
# 4. Create Spaces access key in API settings
# 5. Add key/secret to Netlify env vars
```

### CORS Configuration (DO Spaces)

Set CORS on the Space to allow uploads from your QUIRC domain:

```xml
<CORSConfiguration>
  <CORSRule>
    <AllowedOrigin>https://quirc.quirc.chat</AllowedOrigin>
    <AllowedMethod>PUT</AllowedMethod>
    <AllowedMethod>GET</AllowedMethod>
    <AllowedHeader>*</AllowedHeader>
    <MaxAgeSeconds>3600</MaxAgeSeconds>
  </CORSRule>
</CORSConfiguration>
```

---

## Milestones

### M1: Walking Skeleton (2 weeks)
- Vue 3 + Vite project scaffolded with Pinia + Vue Router
- Ergo running on DO Droplet with WebSocket enabled
- IRC WebSocket client connects to Ergo
- Can join a channel, see messages, send messages
- Mobile layout with channel/user drawers
- Splash screen
- Deploy frontend to Netlify

### M2: Usable Client (2 weeks)
- Nick coloring, timestamps, system messages
- Channel switching, unread counts
- Nick autocomplete, input history
- mIRC formatting, basic /commands
- IndexedDB scrollback storage
- PWA manifest + service worker

### M3: Modern Features (3 weeks)
- Rich text rendering (code blocks, inline code, bold)
- Link previews via Netlify Function unfurl proxy
- Inline image rendering
- Reactions (QUIRC-to-QUIRC via TAGMSG)
- Reply threading
- Message search
- File upload via presigned URLs → DO Spaces

### M4: Always-On (2 weeks)
- Server-side history (chathistory via Ergo)
- Push notifications via gateway on DO Droplet
- Typing indicators
- Read markers
- Connection resilience (auto-reconnect, queue outgoing)

### M5: Polish & Ship (1 week)
- Settings UI
- Theme system with CSS custom properties
- Performance audit (virtual scrolling, lazy loading)
- Accessibility pass
- README + setup docs for self-hosters
- v1.0.0 release

---

## Open Questions

1. **Bouncer sufficiency** — Ergo's built-in always-on mode should be enough for the hackerspace use case. No need for ZNC as a separate layer unless someone needs advanced 
playback features Ergo doesn't cover.

2. **Reaction/reply wire format** — IRCv3 draft specs are not universally finalized. Do we commit to `+draft/reply` and `+draft/react`, or define QUIRC-specific CTCP 
messages that we control?

3. **Spaces upload auth** — The presigned URL function currently has no auth gate. Options: (a) require a valid IRC session token header, (b) rate-limit by IP in the 
Netlify Function, (c) accept the risk for a hackerspace deployment. For public-facing deployments, (a) is recommended.

4. **Unfurl proxy abuse** — The unfurl function is an open proxy for fetching arbitrary URLs. Should rate-limit and/or restrict to known domains. Netlify's built-in rate 
limiting or a simple in-function check may suffice.

5. **Spaces cleanup** — Old uploaded files accumulate. Options: DO Spaces lifecycle rules to auto-delete after N days, or accept unlimited growth at $0.02/GB/mo.

---

## Appendix: Wire Format Examples

### Standard message
```
@msgid=abc123;time=2025-02-13T21:03:00Z :solderblob!user@host PRIVMSG #general :anyone got a spare FTDI adapter?
```

### Reply
```
@msgid=def456;+draft/reply=abc123 :capacitor_kid!user@host PRIVMSG #general :nice, does GPIO 18 need a flyback diode?
```

### Reaction
```
@msgid=ghi789;+draft/react=abc123 :moheeb!user@host TAGMSG #general :💀
```

### Typing indicator
```
@+typing=active :solderblob!user@host TAGMSG #general
```

### Chat history request
```
CHATHISTORY LATEST #general * 100
```
