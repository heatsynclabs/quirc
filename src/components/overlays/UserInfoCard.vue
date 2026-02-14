<template>
  <div v-if="open" class="whois-overlay" @click.self="$emit('close')">
    <div class="whois-card">
      <button class="whois-card__close" @click="$emit('close')">&times;</button>

      <!-- Avatar + Nick -->
      <div class="whois-card__header">
        <div class="whois-card__avatar" :style="{ borderColor: avatarColor }">
          {{ initial }}
        </div>
        <div>
          <div class="whois-card__nick">{{ data.nick }}</div>
          <div v-if="data.user && data.host" class="whois-card__host">{{ data.user }}@{{ data.host }}</div>
        </div>
      </div>

      <!-- Details -->
      <div class="whois-card__details">
        <div v-if="data.realname" class="whois-card__row">
          <span class="whois-card__label">Real name</span>
          <span class="whois-card__value">{{ data.realname }}</span>
        </div>
        <div v-if="data.account" class="whois-card__row">
          <span class="whois-card__label">Account</span>
          <span class="whois-card__value">{{ data.account }}</span>
        </div>
        <div v-if="data.server" class="whois-card__row">
          <span class="whois-card__label">Server</span>
          <span class="whois-card__value">{{ data.server }}</span>
        </div>
        <div v-if="data.channels" class="whois-card__row">
          <span class="whois-card__label">Channels</span>
          <span class="whois-card__value">{{ data.channels }}</span>
        </div>
        <div v-if="idleText" class="whois-card__row">
          <span class="whois-card__label">Idle</span>
          <span class="whois-card__value">{{ idleText }}</span>
        </div>
      </div>

      <!-- Badges -->
      <div v-if="badges.length" class="whois-card__badges">
        <span v-for="b in badges" :key="b" class="whois-card__badge">{{ b }}</span>
      </div>

      <!-- DM button -->
      <button class="whois-card__dm" @click="onDM">MESSAGE</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { getNickColor } from '@/utils/nickColor'

const props = defineProps({
  open: { type: Boolean, default: false },
  data: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['close', 'openDM'])

const initial = computed(() => (props.data.nick || '?')[0].toUpperCase())
const avatarColor = computed(() => props.data.nick ? getNickColor(props.data.nick) : '#555')

const badges = computed(() => {
  const b = []
  if (props.data.secure) b.push('TLS')
  if (props.data.isOperator) b.push('OPER')
  return b
})

const idleText = computed(() => {
  if (!props.data.idle) return ''
  const mins = Math.floor(props.data.idle / 60)
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  const rem = mins % 60
  return `${hrs}h ${rem}m`
})

function onDM() {
  emit('openDM', props.data.nick)
  emit('close')
}
</script>

<style scoped>
.whois-overlay {
  position: fixed;
  inset: 0;
  z-index: 300;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.whois-card {
  background: var(--q-bg-secondary);
  border: 2px solid var(--q-border-strong);
  width: 100%;
  max-width: 360px;
  padding: 24px;
  position: relative;
}

.whois-card__close {
  position: absolute;
  top: 12px;
  right: 12px;
  background: none;
  border: none;
  color: var(--q-text-muted);
  font-size: 20px;
  cursor: pointer;
  line-height: 1;
  padding: 4px;
}

.whois-card__close:hover {
  color: var(--q-text-primary);
}

.whois-card__header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.whois-card__avatar {
  width: 48px;
  height: 48px;
  border: 2px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  color: var(--q-text-primary);
  background: var(--q-bg-primary);
  flex-shrink: 0;
}

.whois-card__nick {
  font-size: var(--q-font-size-lg);
  font-weight: 700;
  color: #fff;
}

.whois-card__host {
  font-size: var(--q-font-size-xs);
  color: var(--q-text-muted);
  word-break: break-all;
  margin-top: 2px;
}

.whois-card__details {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.whois-card__row {
  display: flex;
  gap: 12px;
}

.whois-card__label {
  color: var(--q-text-dim);
  font-size: var(--q-font-size-sm);
  min-width: 80px;
  flex-shrink: 0;
}

.whois-card__value {
  color: var(--q-text-secondary);
  font-size: var(--q-font-size-sm);
  word-break: break-word;
}

.whois-card__badges {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.whois-card__badge {
  font-size: var(--q-font-size-xs);
  color: var(--q-accent-teal);
  border: 1px solid var(--q-accent-teal);
  padding: 2px 8px;
  letter-spacing: 1px;
  font-weight: 700;
}

.whois-card__dm {
  width: 100%;
  padding: 10px;
  background: var(--q-bg-primary);
  border: 1px solid var(--q-border-strong);
  color: var(--q-text-secondary);
  font-family: var(--q-font-mono);
  font-size: var(--q-font-size-sm);
  font-weight: 700;
  letter-spacing: 2px;
  cursor: pointer;
}

.whois-card__dm:hover {
  border-color: var(--q-accent-teal);
  color: var(--q-accent-teal);
}
</style>
