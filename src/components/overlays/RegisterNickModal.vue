<template>
  <div v-if="open" class="reg">
    <div class="reg__backdrop" @click="$emit('close')" />
    <div class="reg__panel">
      <div class="reg__header">
        <span class="reg__title">REGISTER NICKNAME</span>
        <button class="reg__x" @click="$emit('close')">
          <IconClose :size="16" color="var(--q-text-muted)" />
        </button>
      </div>

      <div class="reg__body">
        <div class="reg__info">
          <div class="reg__info-title">Reserve "{{ connection.nick }}"</div>
          <div class="reg__info-text">
            Registering your nickname creates an account on this server.
            Once registered, no one else can use your nick. You'll sign in
            automatically on future visits.
          </div>
        </div>

        <template v-if="!isConnected">
          <div class="reg__warn">
            You must be connected to the server to register.
          </div>
        </template>

        <template v-else-if="step === 'form'">
          <label class="reg__label">PASSWORD</label>
          <input
            v-model="password"
            class="reg__input"
            type="password"
            placeholder="choose a password"
            @keydown.enter="onRegister"
          />
          <div class="reg__field-hint">You'll use this to sign in next time.</div>

          <label class="reg__label">EMAIL <span class="reg__opt">(for recovery, optional)</span></label>
          <input
            v-model="email"
            class="reg__input"
            type="email"
            placeholder="you@example.com"
            @keydown.enter="onRegister"
          />

          <button
            class="reg__btn"
            :disabled="!password || registering"
            @click="onRegister"
          >
            {{ registering ? 'REGISTERING...' : 'REGISTER' }}
          </button>
        </template>

        <template v-else-if="step === 'result'">
          <div class="reg__result" :class="success ? 'reg__result--ok' : 'reg__result--fail'">
            <div v-for="(line, i) in resultLines" :key="i" class="reg__result-line">{{ line }}</div>
          </div>

          <template v-if="success">
            <div class="reg__next-steps">
              <div class="reg__next-title">WHAT'S NEXT</div>
              <div class="reg__next-text">
                Your nickname "{{ connection.nick }}" is now reserved.
                To sign in automatically next time, go to
                <strong>Settings > Edit Connection</strong> and choose
                "Sign in" with your account name and password.
              </div>
            </div>
            <button class="reg__btn" @click="onAutoSetup">
              SET UP AUTO-LOGIN NOW
            </button>
          </template>
          <button class="reg__btn reg__btn--secondary" @click="step = 'form'; resultLines = []">
            {{ success ? 'DONE' : 'TRY AGAIN' }}
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { IconClose } from '@/components/icons'
import { useConnectionStore } from '@/stores/connection'
import { getClient } from '@/irc/client'

defineProps({
  open: { type: Boolean, default: false },
})

const emit = defineEmits(['close'])

const connection = useConnectionStore()
const client = getClient()

const password = ref('')
const email = ref('')
const step = ref('form') // 'form' | 'result'
const registering = ref(false)
const resultLines = ref([])
const success = ref(false)

const isConnected = computed(() =>
  connection.status === 'connected' || connection.status === 'registered'
)

// Listen for NickServ responses
function onNotice(msg) {
  const nick = msg.source?.nick || ''
  if (!nick.toLowerCase().includes('nickserv')) return
  if (!registering.value) return

  const text = msg.params[1] || ''
  resultLines.value.push(text)

  // Detect success/failure from common NickServ responses
  const lower = text.toLowerCase()
  if (lower.includes('registered') || lower.includes('account has been created') || lower.includes('you are now logged in')) {
    success.value = true
    registering.value = false
    step.value = 'result'
  } else if (lower.includes('already registered') || lower.includes('invalid') || lower.includes('error') || lower.includes('could not')) {
    success.value = false
    registering.value = false
    step.value = 'result'
  }
}

client.on('NOTICE', onNotice)
onUnmounted(() => client.off('NOTICE', onNotice))

// Clear timeout in case NickServ never responds
let _timeout = null

function onRegister() {
  if (!password.value || registering.value) return

  registering.value = true
  resultLines.value = []
  success.value = false

  const emailPart = email.value ? ` ${email.value}` : ''
  client.sendRaw(`PRIVMSG NickServ :REGISTER ${password.value}${emailPart}`)

  // Timeout after 10s if no response
  clearTimeout(_timeout)
  _timeout = setTimeout(() => {
    if (registering.value) {
      registering.value = false
      if (resultLines.value.length === 0) {
        resultLines.value.push('No response from NickServ. The server may not support nickname registration.')
      }
      step.value = 'result'
    }
  }, 10000)
}

function onAutoSetup() {
  connection.configure({
    useSasl: true,
    saslUsername: connection.nick,
    saslPassword: password.value,
  })
  emit('close')
}

watch(() => step.value, () => {
  if (step.value === 'form') {
    password.value = ''
    email.value = ''
    success.value = false
    resultLines.value = []
  }
})
</script>

<style scoped>
.reg {
  position: fixed;
  inset: 0;
  z-index: 310;
  display: flex;
  align-items: center;
  justify-content: center;
}

.reg__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
}

.reg__panel {
  position: relative;
  background: var(--q-bg-primary);
  border: 2px solid var(--q-border-strong);
  max-width: 420px;
  width: 92%;
  max-height: 90dvh;
  overflow-y: auto;
}

.reg__header {
  padding: 16px 20px;
  border-bottom: 2px solid var(--q-border-strong);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.reg__title {
  font-size: var(--q-font-size-sm);
  color: var(--q-accent-teal);
  letter-spacing: 4px;
  font-weight: 700;
}

.reg__x {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
}

.reg__body {
  padding: 16px 20px 20px;
}

.reg__info {
  margin-bottom: 16px;
}

.reg__info-title {
  font-size: var(--q-font-size-md);
  color: var(--q-text-primary);
  font-weight: 700;
  margin-bottom: 6px;
}

.reg__info-text {
  font-size: 12px;
  color: var(--q-text-dim);
  line-height: 1.6;
}

.reg__warn {
  padding: 10px 12px;
  border: 1px solid var(--q-accent-gold);
  color: var(--q-accent-gold);
  font-size: var(--q-font-size-sm);
  margin-top: 8px;
}

.reg__label {
  display: block;
  font-size: 9px;
  letter-spacing: 2px;
  color: var(--q-text-dim);
  text-transform: uppercase;
  margin-bottom: 4px;
  margin-top: 12px;
}

.reg__opt {
  color: var(--q-text-ghost);
}

.reg__input {
  width: 100%;
  background: var(--q-bg-secondary);
  border: 1px solid var(--q-border-strong);
  color: var(--q-text-primary);
  font-family: var(--q-font-mono);
  font-size: var(--q-font-size-base);
  padding: 8px 10px;
}

.reg__input:focus {
  border-color: var(--q-accent-teal);
}

.reg__field-hint {
  font-size: 10px;
  color: var(--q-text-ghost);
  margin-top: 4px;
}

.reg__btn {
  width: 100%;
  padding: 12px;
  border: none;
  background: var(--q-accent-teal);
  color: #000;
  font-family: var(--q-font-mono);
  font-size: var(--q-font-size-sm);
  font-weight: 700;
  letter-spacing: 3px;
  text-transform: uppercase;
  cursor: pointer;
  margin-top: 16px;
}

.reg__btn:disabled {
  background: var(--q-border-strong);
  color: var(--q-text-dim);
  cursor: not-allowed;
}

.reg__btn--secondary {
  background: var(--q-bg-secondary);
  color: var(--q-text-secondary);
  border: 1px solid var(--q-border-strong);
  margin-top: 8px;
}

.reg__btn--secondary:hover {
  border-color: var(--q-accent-teal);
  color: var(--q-accent-teal);
}

.reg__result {
  padding: 10px 12px;
  border: 1px solid var(--q-border-strong);
  margin-bottom: 12px;
  font-size: 12px;
  line-height: 1.5;
}

.reg__result--ok {
  border-color: var(--q-accent-green);
  color: var(--q-accent-green);
}

.reg__result--fail {
  border-color: var(--q-accent-pink);
  color: var(--q-accent-pink);
}

.reg__result-line {
  margin-bottom: 4px;
}

.reg__result-line:last-child {
  margin-bottom: 0;
}

.reg__next-steps {
  margin-bottom: 8px;
}

.reg__next-title {
  font-size: 9px;
  letter-spacing: 2px;
  color: var(--q-text-dim);
  text-transform: uppercase;
  margin-bottom: 4px;
}

.reg__next-text {
  font-size: 12px;
  color: var(--q-text-dim);
  line-height: 1.5;
}

.reg__next-text strong {
  color: var(--q-text-secondary);
}
</style>
