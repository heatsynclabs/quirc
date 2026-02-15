<p align="center">
  <img src="public/logo.svg" alt="QUIRC" width="280" />
</p>

<h3 align="center">QUick IRC</h3>

<p align="center">
  A mobile-first, self-hosted IRC client that makes IRC feel modern.<br/>
  Built with Vue 3 + Vite for <a href="https://quirc.chat">quirc.chat</a>
</p>

<p align="center">
  <a href="https://github.com/virgilvox/quirc">GitHub</a> &middot;
  <a href="https://quirc.chat">Live Demo</a> &middot;
  <a href="docs/SELF-HOSTING.md">Self-Host</a> &middot;
  <a href="docs/ARCHITECTURE.md">Architecture</a>
</p>

---

## Features

- **Mobile-first** — designed for phones, works great on desktop
- **Real-time** — WebSocket connection to any IRC server via Ergo or other WS-capable IRCd
- **Registration & auth** — guest connect, NickServ registration, SASL auto-login
- **Dark & light themes** — toggle between dark punk aesthetic and clean light mode
- **DM support** — private messages organized in a separate sidebar section
- **Slash command palette** — type `/` to browse and filter available commands
- **File uploads** — attach images/files via S3-compatible storage (DigitalOcean Spaces)
- **Link previews & inline images** — automatic URL unfurling and image embedding
- **Typing indicators** — IRCv3 `+typing` support
- **Message reactions** — IRCv3 `+draft/react` support
- **Chat history** — IRCv3 CHATHISTORY for scrollback on join
- **Nick completion** — Tab to autocomplete nicknames
- **Desktop notifications** — configurable alerts for DMs, mentions, and keywords
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
| `VITE_DEFAULT_SERVER` | IRC server hostname | `irc.quirc.chat` |
| `VITE_DEFAULT_PORT` | IRC server port | `6697` |
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
| `CORS_ORIGIN` | Allowed origins for CORS (comma-separated) |

Copy `.env.example` to `.env` and fill in your values.

## URL Auto-Config

QUIRC supports query parameters for auto-configuration:

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

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for a full technical reference.

### Data Flow

1. `App.vue` initializes stores and calls `useIRC()` to set up event handlers
2. `irc/client.js` manages the WebSocket connection and emits IRC events
3. `useIRC.js` listens to events and updates Pinia stores
4. Vue components reactively render from store state
5. User input flows through `InputBar` → `useIRC.sendInput()` → IRC client

### Design System

QUIRC uses CSS custom properties defined in `src/styles/variables.css`:

- `--q-bg-primary`, `--q-bg-secondary` — background colors
- `--q-text-primary` through `--q-text-ghost` — text hierarchy (5 levels)
- `--q-accent-teal`, `--q-accent-orange`, `--q-accent-pink`, etc. — accent colors
- `--q-border`, `--q-border-strong` — border colors
- `--q-font-mono` — monospace font stack (Space Mono)
- No border-radius anywhere — punk aesthetic

Both dark and light themes are supported. The light theme overrides all color variables via `[data-theme="light"]`.

## Self-Hosting

See [docs/SELF-HOSTING.md](docs/SELF-HOSTING.md) for step-by-step deployment instructions.

See [deploy/README.md](deploy/README.md) for Ergo IRC server configuration.

## Contributing

See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for development setup and guidelines.

## License

MIT - [quirc.chat](https://quirc.chat)
