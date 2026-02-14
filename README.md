# QUIRC — QUick IRC

A mobile-first, self-hosted IRC client that makes IRC feel modern. Built with Vue 3 + Vite for [quirc.chat](https://quirc.chat).

## Features

- **Mobile-first** — designed for phones, works great on desktop
- **Real-time** — WebSocket connection to any IRC server via Ergo or other WS-capable IRCd
- **Registration & auth** — guest connect, NickServ registration, SASL auto-login
- **DM support** — private messages organized in a separate sidebar section
- **Slash command palette** — type `/` to browse and filter available commands
- **File uploads** — attach images/files via S3-compatible storage (DigitalOcean Spaces)
- **Link previews & inline images** — automatic URL unfurling and image embedding
- **Typing indicators** — IRCv3 `+typing` support
- **Message reactions** — IRCv3 `+draft/react` support
- **Chat history** — IRCv3 CHATHISTORY for scrollback on join
- **Nick completion** — Tab to autocomplete nicknames
- **Desktop notifications** — configurable alerts for DMs, mentions, and keywords
- **Theming** — dark punk aesthetic with CSS custom properties
- **Self-hostable** — deploy your own instance with any static host + Ergo IRC server

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Build

```bash
npm run build
```

Output goes to `dist/`. Deploy to any static hosting (Netlify, Vercel, Cloudflare Pages, nginx, etc.).

## Environment Variables

All client-side variables use the `VITE_` prefix and are embedded at build time.

| Variable | Description | Example |
|---|---|---|
| `VITE_DEFAULT_SERVER` | IRC server hostname (shown in UI) | `irc.quirc.chat` |
| `VITE_DEFAULT_PORT` | IRC server port (shown in UI) | `6697` |
| `VITE_GATEWAY_URL` | WebSocket URL the client connects to | `wss://irc.quirc.chat` |
| `VITE_AUTO_JOIN` | Comma-separated channels to auto-join | `#general,#projects` |
| `VITE_UPLOAD_API` | File upload presign endpoint | `/api/upload-url` |
| `VITE_UNFURL_API` | Link unfurl endpoint | `/api/unfurl` |
| `VITE_CDN_DOMAIN` | CDN domain for uploaded files | `quirc.sfo3.cdn.digitaloceanspaces.com` |

Server-side only (Netlify Functions):

| Variable | Description |
|---|---|
| `DO_SPACES_KEY` | DigitalOcean Spaces access key |
| `DO_SPACES_SECRET` | DigitalOcean Spaces secret key |
| `DO_SPACES_REGION` | Spaces region (e.g., `sfo3`) |
| `DO_SPACES_BUCKET` | Spaces bucket name |
| `DO_SPACES_CDN_DOMAIN` | Spaces CDN domain |

Copy `.env.example` to `.env` and fill in your values.

## URL Auto-Config

QUIRC supports query parameters for auto-configuration. This lets you create invite links:

```
https://quirc.chat/?server=irc.example.org&ws=wss://irc.example.org&nick=guest&channels=general,random&port=6697
```

| Param | Description |
|---|---|
| `server` | IRC server hostname |
| `ws` | WebSocket gateway URL |
| `port` | Server port |
| `nick` | Default nickname |
| `channels` | Comma-separated channels (with or without `#`) |

Parameters are applied on load and cleaned from the URL.

## Architecture

```
src/
  App.vue                    # Root component, wires everything together
  irc/
    client.js                # WebSocket IRC client (singleton)
    commands.js              # Slash command parser + command palette data
    format.js                # IRC formatting strip/parse
  composables/
    useIRC.js                # IRC event handlers → store updates
    useNotifications.js      # Desktop notification logic
    useFileUpload.js         # S3 presigned upload flow
    useSearch.js             # Message search
  stores/                    # Pinia stores
    connection.js            # Server config, nick, SASL, MOTD
    channels.js              # Channel list, active channel, unread counts
    messages.js              # Messages by channel, reply targets
    users.js                 # User lists per channel, presence
    settings.js              # User preferences (persisted to localStorage)
    ui.js                    # Drawer/modal open states
  components/
    layout/
      TopBar.vue             # Channel name, topic, user count
      InputBar.vue           # Message input, tab completion, file attach
      ChannelDrawer.vue      # Sidebar: channels + DMs
      UsersDrawer.vue        # User list panel
    messages/
      MessageList.vue        # Scrollable message list
      MessageItem.vue        # Individual message rendering
    overlays/
      ConnectionModal.vue    # Guest/Register/Sign-in flow
      RegisterNickModal.vue  # In-app NickServ registration
      SettingsPanel.vue      # Settings drawer
      JoinChannelModal.vue   # Channel join dialog
      SearchOverlay.vue      # Message search
    shared/
      SlashCommandPalette.vue # Command autocomplete popup
      TypingIndicator.vue     # "user is typing..." indicator
  db/
    index.js                 # Dexie (IndexedDB) schema (future use)
  utils/
    nickColor.js             # Deterministic nick coloring
    linkDetect.js            # URL detection in message text
    time.js                  # Time formatting
```

### Data Flow

1. `App.vue` initializes stores and calls `useIRC()` to set up event handlers
2. `irc/client.js` manages the WebSocket connection and emits IRC events
3. `useIRC.js` listens to events and updates Pinia stores
4. Vue components reactively render from store state
5. User input flows through `InputBar` → `useIRC.sendInput()` → IRC client

### Design System

QUIRC uses CSS custom properties defined in `src/assets/main.css`:

- `--q-bg-primary`, `--q-bg-secondary` — background colors
- `--q-text-primary`, `--q-text-secondary`, `--q-text-muted`, `--q-text-dim`, `--q-text-ghost` — text hierarchy
- `--q-accent-teal`, `--q-accent-orange`, `--q-accent-pink`, `--q-accent-green`, `--q-accent-gold` — accent colors
- `--q-border`, `--q-border-strong` — border colors
- `--q-font-mono` — monospace font stack
- No border-radius anywhere — punk aesthetic

## Self-Hosting

See the [Self-Hosting Guide](docs/SELF-HOSTING.md) for step-by-step deployment instructions.

See [deploy/README.md](deploy/README.md) for Ergo IRC server configuration.

## License

MIT - quirc.chat
