<template>
  <div class="ch-drawer" :class="{ 'ch-drawer--open': open }">
    <div class="ch-drawer__backdrop" @click="$emit('close')" />
    <div class="ch-drawer__panel">
      <!-- Header -->
      <div class="ch-drawer__header">
        <QuircMark :size="34" />
        <div>
          <div class="ch-drawer__title">QUIRC</div>
          <div class="ch-drawer__server">{{ serverHost }}:{{ serverPort }}</div>
        </div>
      </div>

      <!-- Channels -->
      <div class="ch-drawer__list">
        <div class="ch-drawer__label-row">
          <span class="ch-drawer__label">channels</span>
          <button class="ch-drawer__add" title="Join channel" @click="$emit('joinChannel')">+</button>
        </div>
        <div
          v-for="ch in channels"
          :key="ch.name"
          class="ch-drawer__item"
          :class="{ 'ch-drawer__item--active': ch.name === active }"
          @click="$emit('pick', ch.name); $emit('close')"
          @contextmenu.prevent="onContext(ch.name)"
        >
          <span class="ch-drawer__name" :class="{ 'ch-drawer__name--active': ch.name === active }">{{ ch.name }}</span>
          <span v-if="ch.unread > 0" class="ch-drawer__badge">{{ ch.unread }}</span>
        </div>
      </div>

      <!-- Context menu -->
      <div v-if="contextChannel" class="ch-drawer__context" :style="contextStyle">
        <div class="ch-drawer__ctx-backdrop" @click="contextChannel = null" />
        <div class="ch-drawer__ctx-menu">
          <button class="ch-drawer__ctx-item" @click="onLeave">LEAVE CHANNEL</button>
          <button class="ch-drawer__ctx-item" @click="onMute">{{ isMuted ? 'UNMUTE' : 'MUTE' }}</button>
        </div>
      </div>

      <!-- User footer -->
      <div class="ch-drawer__footer">
        <div class="ch-drawer__status-dot" :class="'ch-drawer__status-dot--' + connectionStatus" />
        <span class="ch-drawer__nick">{{ nick }}</span>
        <span v-if="isOp" class="ch-drawer__op">@op</span>
        <button class="ch-drawer__settings" @click="$emit('openSettings')">
          <IconSettings :size="16" color="var(--q-text-muted)" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import QuircMark from '@/components/logo/QuircMark.vue'
import { IconSettings } from '@/components/icons'
import { useChannelsStore } from '@/stores/channels'
import { getClient } from '@/irc/client'

const props = defineProps({
  open: { type: Boolean, default: false },
  channels: { type: Array, default: () => [] },
  active: { type: String, default: '' },
  nick: { type: String, default: '' },
  isOp: { type: Boolean, default: false },
  serverHost: { type: String, default: '' },
  serverPort: { type: Number, default: 6697 },
  connectionStatus: { type: String, default: 'disconnected' },
})

defineEmits(['close', 'pick', 'joinChannel', 'openSettings'])

const channelsStore = useChannelsStore()
const client = getClient()
const contextChannel = ref(null)
const contextStyle = ref({})

const isMuted = computed(() =>
  contextChannel.value ? channelsStore.isMuted(contextChannel.value) : false
)

function onContext(name) {
  contextChannel.value = name
}

function onLeave() {
  const ch = contextChannel.value
  contextChannel.value = null
  if (ch) {
    client.part(ch)
  }
}

function onMute() {
  if (contextChannel.value) {
    channelsStore.toggleMute(contextChannel.value)
  }
  contextChannel.value = null
}
</script>

<style scoped>
.ch-drawer {
  position: fixed;
  inset: 0;
  z-index: 100;
  pointer-events: none;
}

.ch-drawer--open {
  pointer-events: auto;
}

.ch-drawer__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  opacity: 0;
  transition: opacity 0.2s;
}

.ch-drawer--open .ch-drawer__backdrop {
  opacity: 1;
}

.ch-drawer__panel {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: var(--q-drawer-width);
  background: var(--q-bg-secondary);
  border-right: 2px solid var(--q-border-strong);
  transform: translateX(-100%);
  transition: transform 0.25s ease;
  display: flex;
  flex-direction: column;
}

.ch-drawer--open .ch-drawer__panel {
  transform: translateX(0);
}

.ch-drawer__header {
  padding: 16px;
  border-bottom: 2px solid var(--q-border-strong);
  display: flex;
  align-items: center;
  gap: 10px;
}

.ch-drawer__title {
  font-size: var(--q-font-size-lg);
  font-weight: 800;
  color: #fff;
  letter-spacing: 3px;
}

.ch-drawer__server {
  font-size: var(--q-font-size-xs);
  color: var(--q-text-muted);
}

.ch-drawer__list {
  padding: 12px 0;
  flex: 1;
  overflow-y: auto;
}

.ch-drawer__label-row {
  padding: 0 16px 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ch-drawer__label {
  font-size: var(--q-font-size-xs);
  letter-spacing: 3px;
  color: var(--q-text-dim);
  text-transform: uppercase;
}

.ch-drawer__add {
  background: none;
  border: 1px solid var(--q-border-strong);
  color: var(--q-text-dim);
  width: 22px;
  height: 22px;
  cursor: pointer;
  font-size: 14px;
  font-family: var(--q-font-mono);
  display: flex;
  align-items: center;
  justify-content: center;
}

.ch-drawer__add:hover {
  border-color: var(--q-accent-teal);
  color: var(--q-accent-teal);
}

.ch-drawer__item {
  padding: 10px 16px;
  cursor: pointer;
  border-left: 3px solid transparent;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ch-drawer__item--active {
  background: var(--q-bg-hover);
  border-left-color: var(--q-accent-orange);
}

.ch-drawer__name {
  color: var(--q-text-secondary);
  font-size: var(--q-font-size-md);
}

.ch-drawer__name--active {
  color: #fff;
}

.ch-drawer__badge {
  background: var(--q-accent-orange);
  color: #000;
  font-size: var(--q-font-size-xs);
  font-weight: 700;
  padding: 2px 6px;
}

.ch-drawer__context {
  position: fixed;
  inset: 0;
  z-index: 150;
}

.ch-drawer__ctx-backdrop {
  position: absolute;
  inset: 0;
}

.ch-drawer__ctx-menu {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--q-bg-primary);
  border: 2px solid var(--q-border-strong);
  min-width: 180px;
}

.ch-drawer__ctx-item {
  display: block;
  width: 100%;
  padding: 10px 16px;
  background: none;
  border: none;
  border-bottom: 1px solid var(--q-border);
  color: var(--q-text-secondary);
  font-family: var(--q-font-mono);
  font-size: var(--q-font-size-sm);
  letter-spacing: 1px;
  text-align: left;
  cursor: pointer;
}

.ch-drawer__ctx-item:last-child {
  border-bottom: none;
}

.ch-drawer__ctx-item:hover {
  background: var(--q-bg-hover);
  color: var(--q-accent-teal);
}

.ch-drawer__footer {
  padding: 12px 16px;
  border-top: 2px solid var(--q-border-strong);
  display: flex;
  align-items: center;
  gap: 10px;
}

.ch-drawer__status-dot {
  width: 8px;
  height: 8px;
  background: #444;
}

.ch-drawer__status-dot--connected {
  background: var(--q-accent-green);
  box-shadow: 0 0 6px var(--q-accent-green);
}

.ch-drawer__status-dot--connecting {
  background: var(--q-accent-gold);
  animation: qBlink 1s ease infinite;
}

.ch-drawer__status-dot--disconnected {
  background: #444;
}

.ch-drawer__status-dot--error {
  background: var(--q-accent-pink);
}

.ch-drawer__nick {
  color: #aaa;
  font-size: var(--q-font-size-base);
}

.ch-drawer__op {
  font-size: var(--q-font-size-xs);
  color: var(--q-text-muted);
  border: 1px solid var(--q-border-strong);
  padding: 2px 6px;
}

.ch-drawer__settings {
  margin-left: auto;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
}

@keyframes qBlink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
</style>
