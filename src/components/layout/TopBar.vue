<template>
  <div class="topbar">
    <button class="topbar__menu" aria-label="Toggle channels" @click="$emit('toggleChannels')">
      <IconHamburger :size="20" />
    </button>

    <div class="topbar__center" @click="onChannelClick">
      <QuircMark :size="28" />
      <div class="topbar__info">
        <div class="topbar__channel">
          <span v-if="channelName && !channelName.startsWith('#')" class="topbar__dm-tag">DM</span>
          {{ channelName || 'QUIRC' }}
          <span v-for="b in modeBadges" :key="b" class="topbar__mode-badge" :title="b.desc">{{ b.icon }}</span>
        </div>
        <div v-if="connectionStatus !== 'connected'" class="topbar__status" :class="'topbar__status--' + connectionStatus">
          {{ statusText }}
        </div>
      </div>
    </div>

    <button class="topbar__search" aria-label="Search messages" @click="$emit('toggleSearch')">
      <IconSearch :size="18" />
    </button>

    <button class="topbar__users" aria-label="Toggle user list" @click="$emit('toggleUsers')">
      <span class="topbar__users-dot" :class="{ 'topbar__users-dot--off': connectionStatus !== 'connected' }" />
      {{ onlineCount }}
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { IconHamburger, IconSearch } from '@/components/icons'
import QuircMark from '@/components/logo/QuircMark.vue'

const props = defineProps({
  channelName: { type: String, default: '' },
  topic: { type: String, default: '' },
  onlineCount: { type: Number, default: 0 },
  connectionStatus: { type: String, default: 'disconnected' },
  modes: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['toggleChannels', 'toggleSearch', 'toggleUsers', 'openChannelInfo'])

const modeBadges = computed(() => {
  const m = props.modes || {}
  const badges = []
  if (m.k) badges.push({ icon: '\u{1F512}', desc: 'Password protected (+k)' })
  if (m.i) badges.push({ icon: '\u{1F6E1}', desc: 'Invite only (+i)' })
  if (m.m) badges.push({ icon: '\u{1F507}', desc: 'Moderated (+m)' })
  if (m.s) badges.push({ icon: '\u{1F441}', desc: 'Secret (+s)' })
  return badges
})

function onChannelClick() {
  if (props.channelName?.startsWith('#')) {
    emit('openChannelInfo')
  }
}

const statusText = computed(() => {
  switch (props.connectionStatus) {
    case 'connecting': return 'connecting...'
    case 'disconnected': return 'disconnected'
    case 'error': return 'connection error'
    default: return ''
  }
})
</script>

<style scoped>
.topbar {
  display: flex;
  align-items: center;
  padding: 0 12px;
  height: var(--q-topbar-height);
  flex-shrink: 0;
  border-bottom: 2px solid var(--q-border);
  background: var(--q-bg-secondary);
}

.topbar__menu {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
}

.topbar__center {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
}

.topbar__info {
  text-align: center;
}

.topbar__channel {
  font-size: var(--q-font-size-md);
  font-weight: 700;
  color: #fff;
}

.topbar__mode-badge {
  font-size: 10px;
  margin-left: 4px;
  vertical-align: middle;
  opacity: 0.7;
}

.topbar__dm-tag {
  font-size: var(--q-font-size-xs);
  color: var(--q-accent-teal);
  border: 1px solid var(--q-accent-teal);
  padding: 1px 5px;
  margin-right: 6px;
  font-weight: 700;
  letter-spacing: 1px;
  vertical-align: middle;
}

.topbar__status {
  font-size: var(--q-font-size-xs);
}

.topbar__status--connecting {
  color: var(--q-accent-gold);
}

.topbar__status--disconnected {
  color: var(--q-text-dim);
}

.topbar__status--error {
  color: var(--q-accent-pink);
}

.topbar__search {
  background: none;
  border: none;
  color: var(--q-text-muted);
  padding: 8px;
  cursor: pointer;
}

.topbar__users {
  background: none;
  border: 1px solid var(--q-border-strong);
  cursor: pointer;
  padding: 4px 8px;
  font-size: var(--q-font-size-xs);
  color: var(--q-text-secondary);
  font-family: var(--q-font-mono);
  display: flex;
  align-items: center;
  gap: 4px;
}

.topbar__users-dot {
  width: 5px;
  height: 5px;
  background: var(--q-accent-green);
}

.topbar__users-dot--off {
  background: #444;
}

@media (min-width: 768px) {
  .topbar__menu {
    display: none;
  }
}
</style>
