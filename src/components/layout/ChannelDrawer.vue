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
          <button class="ch-drawer__toggle" @click="channelsCollapsed = !channelsCollapsed">
            <IconChevron :size="14" :rotation="channelsCollapsed ? -90 : 0" />
            <span class="ch-drawer__label">channels</span>
          </button>
          <div class="ch-drawer__label-actions">
            <button class="ch-drawer__add" title="Browse channels" aria-label="Browse channels" @click="$emit('browseChannels')"><IconList :size="16" /></button>
            <button class="ch-drawer__add" title="Join channel" aria-label="Join channel" @click="$emit('joinChannel')"><IconPlus :size="16" /></button>
          </div>
        </div>
        <template v-if="!channelsCollapsed">
          <div v-if="!ircChannels.length" class="ch-drawer__empty">
            No channels joined yet
          </div>
          <div
            v-for="ch in ircChannels"
            :key="ch.name"
            class="ch-drawer__item"
            :class="{ 'ch-drawer__item--active': ch.name === active }"
            @click="$emit('pick', ch.name); $emit('close')"
            @contextmenu.prevent="onContext(ch.name, $event)"
          >
            <span class="ch-drawer__name" :class="{ 'ch-drawer__name--active': ch.name === active }">{{ ch.name }}</span>
            <span v-if="ch.unread > 0" class="ch-drawer__badge">{{ ch.unread }}</span>
            <button class="ch-drawer__close" aria-label="Leave channel" @click.stop="onCloseChannel(ch.name)"><IconClose :size="16" /></button>
          </div>
        </template>

        <!-- DMs -->
        <template v-if="dmChannels.length">
          <div class="ch-drawer__label-row ch-drawer__label-row--dm">
            <button class="ch-drawer__toggle" @click="dmsCollapsed = !dmsCollapsed">
              <IconChevron :size="14" :rotation="dmsCollapsed ? -90 : 0" />
              <span class="ch-drawer__label">direct messages</span>
            </button>
          </div>
          <template v-if="!dmsCollapsed">
            <div
              v-for="ch in dmChannels"
              :key="ch.name"
              class="ch-drawer__item ch-drawer__item--dm"
              :class="{ 'ch-drawer__item--active': ch.name === active }"
              @click="$emit('pick', ch.name); $emit('close')"
              @contextmenu.prevent="onContext(ch.name, $event)"
            >
              <span class="ch-drawer__name ch-drawer__name--dm" :class="{ 'ch-drawer__name--active': ch.name === active }">{{ ch.name }}</span>
              <span v-if="ch.unread > 0" class="ch-drawer__badge">{{ ch.unread }}</span>
              <button class="ch-drawer__close" aria-label="Close DM" @click.stop="onCloseChannel(ch.name)"><IconClose :size="16" /></button>
            </div>
          </template>
        </template>
      </div>

      <!-- Context menu -->
      <div v-if="contextChannel" class="ch-drawer__context">
        <div class="ch-drawer__ctx-backdrop" @click="contextChannel = null" />
        <div class="ch-drawer__ctx-menu" :style="contextStyle">
          <button class="ch-drawer__ctx-item" @click="onLeave">
            {{ contextChannel.startsWith('#') ? 'LEAVE CHANNEL' : 'CLOSE' }}
          </button>
          <button class="ch-drawer__ctx-item" @click="onMute">{{ isMuted ? 'UNMUTE' : 'MUTE' }}</button>
        </div>
      </div>

      <!-- User footer -->
      <div class="ch-drawer__footer">
        <div class="ch-drawer__status-dot" :class="'ch-drawer__status-dot--' + connectionStatus" />
        <span class="ch-drawer__nick">{{ nick }}</span>
        <span v-if="isOp" class="ch-drawer__op">@op</span>
        <button class="ch-drawer__settings" aria-label="Open settings" @click="$emit('openSettings')">
          <IconSettings :size="18" color="var(--q-text-muted)" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import QuircMark from '@/components/logo/QuircMark.vue'
import { IconSettings, IconChevron, IconList, IconPlus, IconClose } from '@/components/icons'
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

defineEmits(['close', 'pick', 'joinChannel', 'openSettings', 'browseChannels'])

const channelsStore = useChannelsStore()
const client = getClient()
const contextChannel = ref(null)
const contextStyle = ref({})
const channelsCollapsed = ref(false)
const dmsCollapsed = ref(false)

const ircChannels = computed(() => props.channels.filter(c => c.name.startsWith('#')))
const dmChannels = computed(() => props.channels.filter(c => !c.name.startsWith('#')))

const isMuted = computed(() =>
  contextChannel.value ? channelsStore.isMuted(contextChannel.value) : false
)

function onContext(name, event) {
  contextChannel.value = name
  // Position context menu near click point, clamped to viewport
  const menuW = 200, menuH = 100
  const x = Math.min(event.clientX, window.innerWidth - menuW - 8)
  const y = Math.min(event.clientY, window.innerHeight - menuH - 8)
  contextStyle.value = { top: `${y}px`, left: `${x}px` }
}

function onCloseChannel(name) {
  if (name.startsWith('#')) {
    client.part(name)
  } else {
    channelsStore.removeChannel(name)
  }
}

function onLeave() {
  const ch = contextChannel.value
  contextChannel.value = null
  if (!ch) return
  if (ch.startsWith('#')) {
    client.part(ch)
  } else {
    // DM: just remove from sidebar without sending PART
    channelsStore.removeChannel(ch)
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
  background: var(--q-backdrop-light);
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
  color: var(--q-text-bright);
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

.ch-drawer__toggle {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.ch-drawer__label {
  font-size: var(--q-font-size-xs);
  letter-spacing: 3px;
  color: var(--q-text-dim);
  text-transform: uppercase;
}

.ch-drawer__label-actions {
  display: flex;
  gap: 4px;
}

.ch-drawer__add {
  background: none;
  border: 1px solid var(--q-border-strong);
  color: var(--q-text-dim);
  width: 28px;
  height: 28px;
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

.ch-drawer__empty {
  padding: 12px 16px;
  color: var(--q-text-dim);
  font-size: var(--q-font-size-sm);
}

.ch-drawer__label-row--dm {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--q-border);
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
  color: var(--q-text-bright);
}

.ch-drawer__name--dm {
  color: var(--q-text-muted);
}

.ch-drawer__close {
  background: none;
  border: none;
  color: var(--q-text-dim);
  font-size: 16px;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
  opacity: 0;
  flex-shrink: 0;
  margin-left: auto;
}

.ch-drawer__item:hover .ch-drawer__close {
  opacity: 1;
}

.ch-drawer__close:hover {
  color: var(--q-accent-pink);
}

@media (hover: none) {
  .ch-drawer__close {
    opacity: 0.5;
  }
}

.ch-drawer__badge {
  background: var(--q-accent-orange);
  color: var(--q-text-on-accent);
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
  position: fixed;
  background: var(--q-bg-primary);
  border: 2px solid var(--q-border-strong);
  min-width: 180px;
  z-index: 151;
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
  background: var(--q-text-inactive);
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
  background: var(--q-text-inactive);
}

.ch-drawer__status-dot--error {
  background: var(--q-accent-pink);
}

.ch-drawer__nick {
  color: var(--q-text-secondary);
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

/* Desktop: pinned sidebar */
@media (min-width: 768px) {
  .ch-drawer {
    position: static;
    pointer-events: auto;
    z-index: auto;
    height: 100%;
    flex-shrink: 0;
  }

  .ch-drawer__backdrop {
    display: none;
  }

  .ch-drawer__panel {
    position: relative;
    transform: none;
    transition: none;
    width: var(--q-drawer-width);
    height: 100%;
    flex-shrink: 0;
  }
}
</style>
