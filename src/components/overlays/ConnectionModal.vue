<template>
  <div v-if="open" class="conn">
    <div class="conn__backdrop" @click="dismissable && $emit('close')" />
    <div class="conn__panel">
      <!-- Tabs -->
      <div class="conn__tabs">
        <button
          v-for="t in tabs"
          :key="t.id"
          class="conn__tab"
          :class="{ 'conn__tab--active': tab === t.id }"
          :disabled="tabsLocked"
          @click="switchTab(t.id)"
        >{{ t.label }}</button>
        <button v-if="dismissable" class="conn__x" @click="$emit('close')">
          <IconClose :size="14" color="var(--q-text-muted)" />
        </button>
      </div>

      <!-- Error banner -->
      <div v-if="error" class="conn__error">{{ error }}</div>

      <div class="conn__body">

        <!-- ═══ GUEST TAB ═══ -->
        <template v-if="tab === 'guest'">
          <p class="conn__desc">
            Pick a name and start chatting. No account needed.
            Your nickname isn't reserved — anyone can use an unclaimed name.
          </p>

          <label class="conn__label">NICKNAME</label>
          <input
            v-model="form.nick"
            class="conn__input"
            placeholder="your_nick"
            autocomplete="off"
            autocapitalize="off"
            spellcheck="false"
            @keydown.enter="onGuestConnect"
          />
        </template>

        <!-- ═══ REGISTER TAB ═══ -->
        <template v-else-if="tab === 'register'">

          <!-- Phase: form -->
          <template v-if="regPhase === 'form'">
            <p class="conn__desc">
              Reserve a nickname so only you can use it.
              You'll be signed in automatically on future visits.
            </p>

            <label class="conn__label">NICKNAME</label>
            <input
              v-model="form.nick"
              class="conn__input"
              placeholder="pick a nickname"
              autocomplete="off"
              autocapitalize="off"
              spellcheck="false"
              @keydown.enter="onRegisterConnect"
            />

            <label class="conn__label">PASSWORD</label>
            <input
              v-model="regPassword"
              class="conn__input"
              type="password"
              placeholder="choose a password"
              @keydown.enter="onRegisterConnect"
            />
            <p class="conn__field-hint">You'll use this to sign in next time.</p>

            <label class="conn__label">
              EMAIL <span class="conn__opt">(for recovery, optional)</span>
            </label>
            <input
              v-model="regEmail"
              class="conn__input"
              type="email"
              placeholder="you@example.com"
              @keydown.enter="onRegisterConnect"
            />
          </template>

          <!-- Phase: connecting -->
          <template v-else-if="regPhase === 'connecting'">
            <div class="conn__progress">
              <span class="conn__spinner" />
              <span>Connecting to server...</span>
            </div>
          </template>

          <!-- Phase: registering -->
          <template v-else-if="regPhase === 'registering'">
            <div class="conn__progress">
              <span class="conn__spinner" />
              <span>Registering "{{ form.nick }}" with NickServ...</span>
            </div>
          </template>

          <!-- Phase: success -->
          <template v-else-if="regPhase === 'success'">
            <div class="conn__result conn__result--ok">
              <div v-for="(line, i) in regResultLines" :key="i">{{ line }}</div>
            </div>
            <p class="conn__desc">
              Your nickname <strong>"{{ form.nick }}"</strong> is now reserved.
              Auto-login has been configured — you'll be signed in
              automatically next time you connect.
            </p>
          </template>

          <!-- Phase: error -->
          <template v-else-if="regPhase === 'error'">
            <div class="conn__result conn__result--fail">
              <div v-for="(line, i) in regResultLines" :key="i">{{ line }}</div>
              <div v-if="!regResultLines.length">Registration failed.</div>
            </div>
          </template>
        </template>

        <!-- ═══ SIGN IN TAB ═══ -->
        <template v-else-if="tab === 'signin'">
          <p class="conn__desc">
            Already registered? Sign in to claim your reserved nickname.
          </p>

          <label class="conn__label">NICKNAME</label>
          <input
            v-model="form.saslUsername"
            class="conn__input"
            placeholder="your registered nickname"
            autocomplete="off"
            autocapitalize="off"
            spellcheck="false"
            @keydown.enter="onSignInConnect"
          />

          <label class="conn__label">PASSWORD</label>
          <input
            v-model="form.saslPassword"
            class="conn__input"
            type="password"
            placeholder="your password"
            @keydown.enter="onSignInConnect"
          />
        </template>

        <!-- ═══ SERVER CONFIG (shared, collapsible) ═══ -->
        <template v-if="!tabsLocked">
          <button class="conn__server-toggle" @click="serverOpen = !serverOpen">
            <span class="conn__arrow">{{ serverOpen ? '▾' : '▸' }}</span>
            Server settings
          </button>

          <div v-if="serverOpen" class="conn__server">
            <label class="conn__label">SERVER HOST</label>
            <input v-model="form.serverHost" class="conn__input" placeholder="irc.example.org" />

            <label class="conn__label">WEBSOCKET URL</label>
            <input v-model="form.gatewayUrl" class="conn__input" placeholder="wss://irc.example.org" />

            <div class="conn__inline-row">
              <div class="conn__inline-field">
                <label class="conn__label">PORT</label>
                <input v-model.number="form.serverPort" class="conn__input conn__input--short" type="number" />
              </div>
            </div>

            <label class="conn__label">AUTO-JOIN CHANNELS</label>
            <input v-model="autoJoinStr" class="conn__input" placeholder="#general, #random" />

            <label class="conn__label">
              SERVER PASSWORD <span class="conn__opt">(optional)</span>
            </label>
            <input v-model="form.password" class="conn__input" type="password" placeholder="leave blank if none" />
          </div>
        </template>

        <!-- ═══ ACTIONS ═══ -->
        <div class="conn__actions">
          <!-- Guest actions -->
          <template v-if="tab === 'guest'">
            <button class="conn__btn conn__btn--primary" :disabled="!canConnect" @click="onGuestConnect">
              {{ connecting ? 'CONNECTING...' : 'CONNECT' }}
            </button>
          </template>

          <!-- Register actions -->
          <template v-else-if="tab === 'register'">
            <button
              v-if="regPhase === 'form'"
              class="conn__btn conn__btn--register"
              :disabled="!canRegister"
              @click="onRegisterConnect"
            >REGISTER & CONNECT</button>

            <button
              v-else-if="regPhase === 'success'"
              class="conn__btn conn__btn--primary"
              @click="$emit('close')"
            >DONE</button>

            <button
              v-else-if="regPhase === 'error'"
              class="conn__btn conn__btn--primary"
              @click="regPhase = 'form'"
            >TRY AGAIN</button>
          </template>

          <!-- Sign in actions -->
          <template v-else-if="tab === 'signin'">
            <button class="conn__btn conn__btn--primary" :disabled="!canSignIn" @click="onSignInConnect">
              {{ connecting ? 'CONNECTING...' : 'SIGN IN & CONNECT' }}
            </button>
          </template>

          <!-- Save profile (shown when not mid-registration) -->
          <button
            v-if="!tabsLocked"
            class="conn__btn conn__btn--secondary"
            :disabled="!form.gatewayUrl"
            @click="onSaveProfile"
          >SAVE SERVER</button>
        </div>
      </div>

      <!-- Saved servers -->
      <div v-if="savedServers.length && !tabsLocked" class="conn__saved">
        <div class="conn__saved-label">SAVED SERVERS</div>
        <button
          v-for="s in savedServers"
          :key="s.id"
          class="conn__saved-item"
          @click="loadProfile(s)"
        >
          <span class="conn__saved-host">{{ s.serverHost || s.gatewayUrl }}</span>
          <span class="conn__saved-nick">{{ s.nick }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { IconClose } from '@/components/icons'
import { useConnectionStore } from '@/stores/connection'
import { getClient } from '@/irc/client'

const props = defineProps({
  open: { type: Boolean, default: false },
  dismissable: { type: Boolean, default: true },
  initialTab: { type: String, default: '' },
})

const emit = defineEmits(['close', 'connect'])

const connection = useConnectionStore()
const client = getClient()

const tabs = [
  { id: 'guest', label: 'Guest' },
  { id: 'register', label: 'Register' },
  { id: 'signin', label: 'Sign In' },
]

const tab = ref('guest')

// Form state
const form = ref({
  nick: '',
  serverHost: '',
  serverPort: 6697,
  gatewayUrl: '',
  password: '',
  useSasl: false,
  saslUsername: '',
  saslPassword: '',
})

const autoJoinStr = ref('')
const error = ref('')
const serverOpen = ref(false)

// Registration state
const regPhase = ref('form') // form | connecting | registering | success | error
const regPassword = ref('')
const regEmail = ref('')
const regResultLines = ref([])
let regTimeout = null

// Computed
const connecting = computed(() => connection.status === 'connecting')
const tabsLocked = computed(() =>
  ['connecting', 'registering'].includes(regPhase.value)
)
const canConnect = computed(() =>
  !!(form.value.nick && form.value.gatewayUrl) && !connecting.value
)
const canRegister = computed(() =>
  !!(form.value.nick && regPassword.value && form.value.gatewayUrl)
)
const canSignIn = computed(() =>
  !!(form.value.saslUsername && form.value.saslPassword && form.value.gatewayUrl) && !connecting.value
)
const savedServers = computed(() => connection.savedServers)

// Initialize form from store when modal opens
watch(() => props.open, (val) => {
  if (val) {
    form.value = {
      nick: connection.nick,
      serverHost: connection.serverHost,
      serverPort: connection.serverPort,
      gatewayUrl: connection.gatewayUrl,
      password: connection.password,
      useSasl: connection.useSasl,
      saslUsername: connection.saslUsername,
      saslPassword: connection.saslPassword,
    }
    autoJoinStr.value = connection.autoJoinChannels.join(', ')
    error.value = ''
    regPhase.value = 'form'
    regPassword.value = ''
    regEmail.value = ''
    regResultLines.value = []
    serverOpen.value = !form.value.gatewayUrl

    // Pick initial tab
    if (props.initialTab && tabs.some(t => t.id === props.initialTab)) {
      tab.value = props.initialTab
    } else if (connection.useSasl) {
      tab.value = 'signin'
    } else {
      tab.value = 'guest'
    }
  }
})

watch(() => connection.errorMessage, (msg) => {
  if (msg) error.value = msg
})

// ─── Tab switching ───
function switchTab(id) {
  if (tabsLocked.value) return
  tab.value = id
  error.value = ''
  // Reset registration when leaving the register tab
  if (id !== 'register') {
    regPhase.value = 'form'
    regResultLines.value = []
  }
}

// ─── Helpers ───
function parseChannels(str) {
  return str
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => s.startsWith('#') ? s : `#${s}`)
}

function applyConfig(overrides = {}) {
  const channels = parseChannels(autoJoinStr.value)
  connection.configure({
    ...form.value,
    ...overrides,
    autoJoinChannels: channels,
  })
}

// ─── Guest connect ───
function onGuestConnect() {
  if (!canConnect.value) return
  error.value = ''
  applyConfig({ useSasl: false })
  emit('connect')
}

// ─── Sign in connect ───
function onSignInConnect() {
  if (!canSignIn.value) return
  error.value = ''
  // Set nick to the SASL account name
  form.value.nick = form.value.saslUsername
  applyConfig({ useSasl: true })
  emit('connect')
}

// ─── Register & connect ───
function onRegisterConnect() {
  if (!canRegister.value) return
  error.value = ''
  regPhase.value = 'connecting'
  regResultLines.value = []
  applyConfig({ useSasl: false })
  emit('connect', { keepOpen: true })
}

// Watch connection status during registration
watch(() => connection.status, (s) => {
  if (regPhase.value === 'connecting' && s === 'connected') {
    // Connected — now register with NickServ
    regPhase.value = 'registering'
    const emailPart = regEmail.value ? ` ${regEmail.value}` : ''
    client.sendRaw(`PRIVMSG NickServ :REGISTER ${regPassword.value}${emailPart}`)

    clearTimeout(regTimeout)
    regTimeout = setTimeout(() => {
      if (regPhase.value === 'registering') {
        if (!regResultLines.value.length) {
          regResultLines.value.push('No response from NickServ. Registration may not be available on this server.')
        }
        regPhase.value = 'error'
      }
    }, 10000)
  }

  if (regPhase.value === 'connecting' && (s === 'error' || s === 'disconnected')) {
    regResultLines.value.push(connection.errorMessage || 'Connection failed.')
    regPhase.value = 'error'
  }
})

// Listen for NickServ responses during registration
function onNotice(msg) {
  const nick = msg.source?.nick || ''
  if (!nick.toLowerCase().includes('nickserv')) return
  if (regPhase.value !== 'registering') return

  const text = msg.params[1] || ''
  regResultLines.value.push(text)

  const lower = text.toLowerCase()
  if (
    lower.includes('registered') ||
    lower.includes('account has been created') ||
    lower.includes('you are now logged in')
  ) {
    // Success — configure SASL for future logins
    connection.configure({
      useSasl: true,
      saslUsername: form.value.nick,
      saslPassword: regPassword.value,
    })
    regPhase.value = 'success'
    clearTimeout(regTimeout)
  } else if (
    lower.includes('already registered') ||
    lower.includes('invalid') ||
    lower.includes('could not') ||
    lower.includes('not available')
  ) {
    regPhase.value = 'error'
    clearTimeout(regTimeout)
  }
}

client.on('NOTICE', onNotice)

onUnmounted(() => {
  client.off('NOTICE', onNotice)
  clearTimeout(regTimeout)
})

// ─── Save profile ───
function onSaveProfile() {
  if (!form.value.gatewayUrl) return
  const channels = parseChannels(autoJoinStr.value)
  connection.addSavedServer({
    id: Date.now(),
    ...form.value,
    autoJoinChannels: channels,
  })
}

// ─── Load saved profile ───
function loadProfile(s) {
  connection.loadServerProfile(s.id)
  form.value = { ...form.value, ...s }
  autoJoinStr.value = (s.autoJoinChannels || []).join(', ')
  serverOpen.value = false
  if (s.useSasl && s.saslUsername) {
    tab.value = 'signin'
  } else {
    tab.value = 'guest'
  }
}
</script>

<style scoped>
.conn {
  position: fixed;
  inset: 0;
  z-index: 300;
  display: flex;
  align-items: center;
  justify-content: center;
}

.conn__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
}

.conn__panel {
  position: relative;
  background: var(--q-bg-primary);
  border: 2px solid var(--q-border-strong);
  max-width: 440px;
  width: 92%;
  max-height: 85dvh;
  overflow-y: auto;
}

/* ─── Tabs ─── */
.conn__tabs {
  display: flex;
  align-items: stretch;
  border-bottom: 2px solid var(--q-border-strong);
  position: sticky;
  top: 0;
  background: var(--q-bg-primary);
  z-index: 1;
}

.conn__tab {
  flex: 1;
  padding: 14px 4px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  color: var(--q-text-muted);
  font-family: var(--q-font-mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}

.conn__tab:hover:not(.conn__tab--active):not(:disabled) {
  color: var(--q-text-secondary);
}

.conn__tab--active {
  color: var(--q-accent-teal);
  border-bottom-color: var(--q-accent-teal);
}

.conn__tab:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.conn__x {
  background: none;
  border: none;
  cursor: pointer;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

/* ─── Body ─── */
.conn__body {
  padding: 20px;
}

.conn__desc {
  font-size: 12px;
  color: var(--q-text-dim);
  line-height: 1.6;
  margin-bottom: 20px;
}

.conn__desc strong {
  color: var(--q-text-secondary);
}

.conn__error {
  margin: 12px 20px 0;
  padding: 10px 12px;
  border: 1px solid var(--q-accent-pink);
  color: var(--q-accent-pink);
  font-size: 12px;
  line-height: 1.4;
}

/* ─── Form fields ─── */
.conn__label {
  display: block;
  font-size: 10px;
  letter-spacing: 2px;
  color: var(--q-text-dim);
  text-transform: uppercase;
  margin-bottom: 6px;
  margin-top: 16px;
}

.conn__label:first-child,
.conn__desc + .conn__label {
  margin-top: 0;
}

.conn__opt {
  color: var(--q-text-ghost);
  letter-spacing: 0.5px;
}

.conn__input {
  width: 100%;
  background: var(--q-bg-secondary);
  border: 1px solid var(--q-border-strong);
  color: var(--q-text-primary);
  font-family: var(--q-font-mono);
  font-size: 13px;
  padding: 10px 12px;
  transition: border-color 0.15s;
}

.conn__input:focus {
  border-color: var(--q-accent-teal);
}

.conn__input--short {
  width: 100px;
}

.conn__field-hint {
  font-size: 11px;
  color: var(--q-text-ghost);
  margin-top: 4px;
  line-height: 1.4;
}

.conn__inline-row {
  display: flex;
  gap: 16px;
  margin-top: 0;
}

.conn__inline-field {
  flex-shrink: 0;
}

/* ─── Server config toggle ─── */
.conn__server-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 12px 0;
  margin-top: 16px;
  background: none;
  border: none;
  border-top: 1px solid var(--q-border);
  color: var(--q-text-muted);
  font-family: var(--q-font-mono);
  font-size: 11px;
  letter-spacing: 1px;
  cursor: pointer;
  text-align: left;
  transition: color 0.15s;
}

.conn__server-toggle:hover {
  color: var(--q-text-secondary);
}

.conn__arrow {
  font-size: 10px;
  width: 12px;
}

.conn__server {
  padding-bottom: 4px;
}

/* ─── Registration progress ─── */
.conn__progress {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 24px 0;
  color: var(--q-text-secondary);
  font-size: 13px;
}

.conn__spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--q-border-strong);
  border-top-color: var(--q-accent-teal);
  animation: conn-spin 0.8s linear infinite;
  flex-shrink: 0;
}

@keyframes conn-spin {
  to { transform: rotate(360deg); }
}

.conn__result {
  padding: 12px 14px;
  border: 1px solid var(--q-border-strong);
  font-size: 12px;
  line-height: 1.6;
  margin-bottom: 16px;
}

.conn__result--ok {
  border-color: var(--q-accent-green);
  color: var(--q-accent-green);
}

.conn__result--fail {
  border-color: var(--q-accent-pink);
  color: var(--q-accent-pink);
}

/* ─── Actions ─── */
.conn__actions {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.conn__btn {
  width: 100%;
  padding: 12px;
  border: none;
  font-family: var(--q-font-mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 3px;
  text-transform: uppercase;
  cursor: pointer;
  transition: opacity 0.15s;
}

.conn__btn--primary {
  background: var(--q-accent-orange);
  color: #000;
}

.conn__btn--register {
  background: var(--q-accent-teal);
  color: #000;
}

.conn__btn--secondary {
  background: var(--q-bg-secondary);
  color: var(--q-text-muted);
  border: 1px solid var(--q-border-strong);
}

.conn__btn--secondary:hover:not(:disabled) {
  border-color: var(--q-text-muted);
  color: var(--q-text-secondary);
}

.conn__btn:disabled {
  background: var(--q-border-strong);
  color: var(--q-text-dim);
  cursor: not-allowed;
}

/* ─── Saved servers ─── */
.conn__saved {
  border-top: 1px solid var(--q-border);
  padding: 14px 20px 18px;
}

.conn__saved-label {
  font-size: 10px;
  letter-spacing: 2px;
  color: var(--q-text-dim);
  text-transform: uppercase;
  margin-bottom: 8px;
}

.conn__saved-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 8px 0;
  background: none;
  border: none;
  border-bottom: 1px solid var(--q-border);
  cursor: pointer;
  font-family: var(--q-font-mono);
  text-align: left;
  transition: color 0.15s;
}

.conn__saved-item:last-child {
  border-bottom: none;
}

.conn__saved-item:hover .conn__saved-host {
  color: var(--q-accent-teal);
}

.conn__saved-host {
  color: var(--q-text-secondary);
  font-size: 12px;
  transition: color 0.15s;
}

.conn__saved-nick {
  color: var(--q-text-dim);
  font-size: 11px;
}
</style>
