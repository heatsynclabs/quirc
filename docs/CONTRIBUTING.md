# Contributing to QUIRC

## Getting Started

```bash
git clone https://github.com/virgilvox/quirc.git
cd quirc
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:5173 in your browser.

## Development

### Project Structure

See [ARCHITECTURE.md](ARCHITECTURE.md) for a full technical reference.

### Key Entry Points

- **App.vue** — root component, initializes everything
- **useIRC.js** — IRC event handlers (where most logic lives)
- **irc/client.js** — WebSocket IRC client
- **styles/variables.css** — all CSS custom properties

### Adding a New Slash Command

1. Add the command case in `src/irc/commands.js` → `parseSlashCommand()`
2. Add the handler in `src/composables/useIRC.js` → `sendInput()`
3. Add help text to `COMMAND_HELP` array
4. Add metadata to `COMMANDS` array for the command palette

### Adding a New Setting

1. Add a `ref()` in `src/stores/settings.js`
2. Add it to the `persist()` JSON object
3. Add it to the `allRefs` array for auto-persist
4. Add the return export
5. Add UI in `src/components/overlays/SettingsPanel.vue`

### Adding a New Icon

1. Create `src/components/icons/IconName.vue` with SVG template
2. Follow conventions: `size` and `color` props, stroke-based, `stroke-width="2"`, `stroke-linecap="square"`
3. Export from `src/components/icons/index.js`

### Theming

All colors must use CSS custom properties from `variables.css`. Never use hardcoded hex colors in component styles. Use semantic variables:
- `--q-text-bright` instead of `#fff`
- `--q-text-on-accent` instead of `#000` (for text on accent-colored backgrounds)
- `--q-backdrop` instead of `rgba(0, 0, 0, 0.85)`

## Code Style

- **Vue 3 Composition API** with `<script setup>`
- **BEM-style CSS** with scoped styles and `--q-*` variables
- **No border-radius** — enforced globally
- **Space Mono** monospace font everywhere
- Keep components focused — one responsibility per component
- Prefer CSS custom properties over inline styles

## Building

```bash
npm run build    # Production build → dist/
npm run preview  # Preview production build locally
```

## Deployment

QUIRC deploys to Netlify. See [SELF-HOSTING.md](SELF-HOSTING.md) for full deployment instructions.
