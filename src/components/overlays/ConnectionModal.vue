<template>
  <div v-if="open" class="conn">
    <div class="conn__backdrop" @click="dismissable && $emit('close')" />
    <div class="conn__panel">
      <div class="conn__header">
        <span class="conn__title">CONNECT</span>
        <button v-if="dismissable" class="conn__x" @click="$emit('close')">
          <IconClose :size="16" color="var(--q-text-muted)" />
        </button>
      </div>

      <div v-if="error" class="conn__error">{{ error }}</div>

      <div class="conn__form">
        <label class="conn__label">NICKNAME</label>
        <input v-model="form.nick" class="conn__input" placeholder="your_nick" @keydown.enter="onConnect" />

        <label class="conn__label">SERVER</label>
        <input v-model="form.serverHost" class="conn__input" placeholder="irc.example.org" />

        <label class="conn__label">WEBSOCKET URL</label>
        <input v-model="form.gatewayUrl" class="conn__input" placeholder="wss://irc.example.org" />

        <label class="conn__label">PORT</label>
        <input v-model.number="form.serverPort" class="conn__input conn__input--short" type="number" />

        <label class="conn__label">AUTO-JOIN CHANNELS</label>
        <input v-model="autoJoinStr" class="conn__input" placeholder="#general, #random" />

        <label class="conn__label">SERVER PASSWORD <span class="conn__opt">(optional)</span></label>
        <input v-model="form.password" class="conn__input" type="password" placeholder="leave blank if none" />

        <div class="conn__toggle-row">
          <label class="conn__toggle">
            <input type="checkbox" v-model="form.useSasl" />
            <span>SASL AUTHENTICATION</span>
          </label>
        </div>

        <template v-if="form.useSasl">
          <label class="conn__label">SASL USERNAME</label>
          <input v-model="form.saslUsername" class="conn__input" placeholder="account name" />

          <label class="conn__label">SASL PASSWORD</label>
          <input v-model="form.saslPassword" class="conn__input" type="password" />
        </template>
      </div>

      <div class="conn__actions">
        <button class="conn__btn conn__btn--connect" :disabled="!canConnect" @click="onConnect">
          {{ connecting ? 'CONNECTING...' : 'CONNECT' }}
        </button>
        <button class="conn__btn conn__btn--save" :disabled="!canConnect" @click="onSaveProfile">
          SAVE PROFILE
        </button>
      </div>

      <div v-if="savedServers.length" class="conn__saved">
        <div class="conn__saved-label">SAVED SERVERS</div>
        <div
          v-for="s in savedServers"
          :key="s.id"
          class="conn__saved-item"
          @click="loadProfile(s)"
        >
          <span class="conn__saved-name">{{ s.serverHost }}</span>
          <span class="conn__saved-nick">{{ s.nick }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { IconClose } from '@/components/icons'
import { useConnectionStore } from '@/stores/connection'

const props = defineProps({
  open: { type: Boolean, default: false },
  dismissable: { type: Boolean, default: true },
})

const emit = defineEmits(['close', 'connect'])

const connection = useConnectionStore()

const form = ref({
  nick: connection.nick,
  serverHost: connection.serverHost,
  serverPort: connection.serverPort,
  gatewayUrl: connection.gatewayUrl,
  password: connection.password,
  useSasl: connection.useSasl,
  saslUsername: connection.saslUsername,
  saslPassword: connection.saslPassword,
})

const autoJoinStr = ref(connection.autoJoinChannels.join(', '))

const error = ref('')
const connecting = computed(() => connection.status === 'connecting')
const savedServers = computed(() => connection.savedServers)
const canConnect = computed(() => !!(form.value.nick && form.value.gatewayUrl) && !connecting.value)

watch(() => props.open, (val) => {
  if (val) {
    form.value.nick = connection.nick
    form.value.serverHost = connection.serverHost
    form.value.serverPort = connection.serverPort
    form.value.gatewayUrl = connection.gatewayUrl
    form.value.password = connection.password
    form.value.useSasl = connection.useSasl
    form.value.saslUsername = connection.saslUsername
    form.value.saslPassword = connection.saslPassword
    autoJoinStr.value = connection.autoJoinChannels.join(', ')
    error.value = ''
  }
})

watch(() => connection.errorMessage, (msg) => {
  if (msg) error.value = msg
})

function onConnect() {
  if (!canConnect.value) return
  error.value = ''

  const channels = autoJoinStr.value
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => s.startsWith('#') ? s : `#${s}`)

  connection.configure({
    ...form.value,
    autoJoinChannels: channels,
  })

  emit('connect')
}

function onSaveProfile() {
  if (!canConnect.value) return
  const channels = autoJoinStr.value
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => s.startsWith('#') ? s : `#${s}`)

  connection.addSavedServer({
    id: Date.now(),
    ...form.value,
    autoJoinChannels: channels,
  })
}

function loadProfile(s) {
  connection.loadServerProfile(s.id)
  form.value = { ...form.value, ...s }
  autoJoinStr.value = (s.autoJoinChannels || []).join(', ')
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
  padding: 0;
  max-width: 420px;
  width: 92%;
  max-height: 90dvh;
  overflow-y: auto;
}

.conn__header {
  padding: 16px 20px;
  border-bottom: 2px solid var(--q-border-strong);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.conn__title {
  font-size: var(--q-font-size-sm);
  color: var(--q-accent-orange);
  letter-spacing: 4px;
  font-weight: 700;
}

.conn__x {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
}

.conn__error {
  margin: 12px 20px 0;
  padding: 8px 10px;
  border: 1px solid var(--q-accent-pink);
  color: var(--q-accent-pink);
  font-size: var(--q-font-size-sm);
}

.conn__form {
  padding: 16px 20px;
}

.conn__label {
  display: block;
  font-size: 9px;
  letter-spacing: 2px;
  color: var(--q-text-dim);
  text-transform: uppercase;
  margin-bottom: 4px;
  margin-top: 12px;
}

.conn__label:first-child {
  margin-top: 0;
}

.conn__opt {
  color: var(--q-text-ghost);
}

.conn__input {
  width: 100%;
  background: var(--q-bg-secondary);
  border: 1px solid var(--q-border-strong);
  color: var(--q-text-primary);
  font-family: var(--q-font-mono);
  font-size: var(--q-font-size-base);
  padding: 8px 10px;
}

.conn__input--short {
  width: 100px;
}

.conn__input:focus {
  border-color: var(--q-accent-teal);
}

.conn__toggle-row {
  margin-top: 14px;
}

.conn__toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 9px;
  letter-spacing: 2px;
  color: var(--q-text-secondary);
  text-transform: uppercase;
}

.conn__toggle input {
  accent-color: var(--q-accent-teal);
}

.conn__actions {
  padding: 0 20px 20px;
}

.conn__btn {
  width: 100%;
  padding: 12px;
  border: none;
  font-family: var(--q-font-mono);
  font-size: var(--q-font-size-sm);
  font-weight: 700;
  letter-spacing: 3px;
  text-transform: uppercase;
  cursor: pointer;
}

.conn__btn--connect {
  background: var(--q-accent-orange);
  color: #000;
}

.conn__btn--connect:disabled,
.conn__btn--save:disabled {
  background: var(--q-border-strong);
  color: var(--q-text-dim);
  cursor: not-allowed;
}

.conn__btn--save {
  background: var(--q-bg-secondary);
  color: var(--q-text-secondary);
  border: 1px solid var(--q-border-strong);
  margin-top: 8px;
}

.conn__btn--save:hover:not(:disabled) {
  border-color: var(--q-accent-teal);
  color: var(--q-accent-teal);
}

.conn__saved {
  border-top: 1px solid var(--q-border);
  padding: 12px 20px 16px;
}

.conn__saved-label {
  font-size: 9px;
  letter-spacing: 2px;
  color: var(--q-text-dim);
  text-transform: uppercase;
  margin-bottom: 8px;
}

.conn__saved-item {
  padding: 6px 0;
  display: flex;
  justify-content: space-between;
  cursor: pointer;
}

.conn__saved-item:hover {
  color: var(--q-accent-teal);
}

.conn__saved-name {
  color: var(--q-text-secondary);
  font-size: var(--q-font-size-sm);
}

.conn__saved-nick {
  color: var(--q-text-dim);
  font-size: var(--q-font-size-xs);
}
</style>
