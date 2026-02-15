# QUIRC Architecture

Technical reference for contributors and developers working on QUIRC.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Vue 3.5 (Composition API) |
| State | Pinia 3 |
| Routing | Vue Router 4 (HTML5 history) |
| Build | Vite 6 |
| IRC Protocol | Custom WebSocket client (`src/irc/client.js`) |
| Storage | localStorage (settings, connection), IndexedDB via Dexie (future) |
| Deployment | Netlify (static + serverless functions) |
| IRC Server | Ergo IRCd (Docker) |
| File Uploads | DigitalOcean Spaces (S3-compatible) |

## Directory Structure

```
src/
  main.js                         Entry point
  App.vue                         Root component — wires stores, composables, overlays

  irc/                            IRC protocol layer
    client.js                     WebSocket IRC client (singleton via getClient())
    parser.js                     IRCv3 message parser
    commands.js                   Slash command parser + metadata
    format.js                     mIRC formatting strip
    caps.js                       Capability constants

  stores/                         Pinia stores (reactive state)
    connection.js                 Server config, nick, SASL, status, MOTD
    channels.js                   Channel list, active channel, unread, modes
    messages.js                   Messages per channel, reply targets
    users.js                      User lists per channel, presence, sorting
    settings.js                   User preferences (persisted to localStorage)
    ui.js                         Drawer/modal open states

  composables/                    Vue composables (side-effect logic)
    useIRC.js                     IRC events → store updates (core bridge)
    useNotifications.js           Web Notifications API
    useFileUpload.js              S3 presigned upload flow
    useSearch.js                  Message search with debounce

  components/
    layout/                       App shell components
      TopBar.vue                  Header: menu, channel name, search, user count
      InputBar.vue                Message input, tab completion, file attach
      ChannelDrawer.vue           Sidebar: channels, DMs, settings
      UsersDrawer.vue             User list panel
      TopicBanner.vue             Channel topic display

    messages/                     Chat message rendering
      MessageList.vue             Scrollable list with history loading
      MessageItem.vue             Individual message with hover actions
      SystemMessage.vue           Join/part/mode system messages
      RichText.vue                URL linking in message text
      LinkPreview.vue             OpenGraph card previews
      InlineImage.vue             Embedded image display
      Reactions.vue               Emoji reaction pills
      ReplyContext.vue             Quoted reply header
      CodeBlock.vue               Monospace code blocks

    overlays/                     Modals and panels
      ConnectionModal.vue         Guest/Register/Sign In tabbed flow
      RegisterNickModal.vue       NickServ registration dialog
      SettingsPanel.vue           Settings drawer (16 options, 4 sections)
      JoinChannelModal.vue        Channel join with password
      ChannelDiscoveryModal.vue   Channel browser (LIST)
      ChannelInfoPanel.vue        Channel details, modes, bans
      SearchOverlay.vue           Full-screen message search
      EmojiPicker.vue             Emoji picker for reactions
      FileUploadToast.vue         Upload progress indicator
      HelpPanel.vue               Command reference
      UserInfoCard.vue            WHOIS user details

    shared/                       Shared UI components
      NoiseOverlay.vue            CRT scanline texture
      SlashCommandPalette.vue     Command autocomplete popup
      TypingIndicator.vue         "X is typing..." indicator
      UnreadMarker.vue            Unread message separator

    icons/                        SVG icon components (stroke-based, configurable)
    logo/                         Logo components (pixel-art QUIRC mark)

  styles/
    variables.css                 CSS custom properties (dark + light themes)
    base.css                      Global reset, scrollbars, focus styles

  utils/
    logoPixels.js                 Pixel bitmap data for QUIRC logo
    nickColor.js                  Deterministic nick → color hash
    linkDetect.js                 URL detection in message text
    time.js                       Time formatting (12h/24h)

  db/
    index.js                      Dexie IndexedDB schema (future use)

  router/
    index.js                      HTML5 history routing (/channel/:name)

netlify/functions/                Serverless API endpoints
  upload-url.js                   S3 presigned URL generation
  unfurl.js                       Link preview / OpenGraph fetcher

deploy/                           Ergo IRC server config + Docker
public/                           Static assets (favicon, manifest, noise texture)
```

## Data Flow

```
User Input → InputBar → useIRC.sendInput() → IRC client → WebSocket → Ergo Server
                                                                          │
                                                                          ▼
App.vue ← Components ← Pinia Stores ← useIRC event handlers ← IRC client.on()
```

1. **App.vue** initializes all stores and calls `useIRC()` to register event handlers
2. **irc/client.js** manages the WebSocket connection and emits parsed IRC events
3. **useIRC.js** listens to IRC events and updates Pinia stores
4. Vue components reactively render from store state
5. User input flows through InputBar → slash command parsing → IRC client methods

## IRC Client Architecture

The IRC client (`src/irc/client.js`) is a singleton accessed via `getClient()`.

**Connection lifecycle:**
```
disconnected → connecting → connected → registered
                                            │
                                            ▼
                                    (CAP negotiation)
                                    (SASL auth if configured)
                                    (JOIN auto-join channels)
```

**IRCv3 capabilities negotiated:**
- `message-tags` — extended message metadata
- `echo-message` — server echoes sent messages back
- `chathistory` — scrollback on join
- `draft/react` — emoji reactions
- `draft/reply` — threaded replies
- `typing` — typing indicators
- `batch` — grouped message delivery

**Reconnection:** Exponential backoff (1s → 2s → 4s → 8s → 16s → 30s max).

## Theming

QUIRC uses CSS custom properties for theming. All colors are defined in `src/styles/variables.css`.

**Dark theme** (default): Deep black backgrounds with high-contrast text.
**Light theme**: Warm off-white backgrounds with dark text. Activated via `data-theme="light"` on `<html>`.

Theme is toggled in Settings and persisted to localStorage. The setting is applied immediately via `document.documentElement.setAttribute('data-theme', ...)`.

**Color hierarchy:**
- `--q-bg-primary` → main background
- `--q-bg-secondary` → panels, drawers, input areas
- `--q-bg-elevated` → hover cards, tooltips
- `--q-text-primary` → body text
- `--q-text-secondary` → labels, metadata
- `--q-text-muted/dim/ghost` → progressively less prominent text
- `--q-accent-*` → brand colors (teal, orange, pink, etc.)

**Design rules:**
- No border-radius anywhere (punk aesthetic)
- Space Mono monospace font throughout
- 2px solid borders for primary separators
- 1px borders for secondary separators
- CRT scanline noise overlay at 3.5% opacity

## State Management

Each Pinia store follows the same pattern:
1. Load saved state from localStorage on init
2. Expose reactive refs and computed properties
3. Auto-persist changes via `watch()` → `localStorage.setItem()`
4. Version key for migration (`STORE_VERSION` in connection store)

**Store dependencies:**
- `useIRC.js` writes to: connection, channels, messages, users
- `App.vue` reads from: all stores
- Components read from: relevant stores via props or direct import

## Slash Commands

Commands are parsed in `src/irc/commands.js` and dispatched in `useIRC.sendInput()`.

20+ commands across 4 categories:
- **channel**: join, part, topic, mode, kick, ban, unban, invite
- **chat**: me, msg, notice
- **utility**: nick, whois, list, away, back, clear, help
- **admin**: raw, connect, disconnect

Unknown `/commands` show an error message rather than being sent as raw IRC.

## File Upload Flow

1. User clicks attach → file picker opens
2. Client POSTs `{filename, contentType}` to `/api/upload-url`
3. Netlify Function generates presigned S3 PUT URL via `@aws-sdk/s3-request-presigner`
4. Client XHR PUTs file to presigned URL with `x-amz-acl: public-read`
5. On success, CDN URL is appended to input text
6. User sends message containing the URL → displayed as inline image
