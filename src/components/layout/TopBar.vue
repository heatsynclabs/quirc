<template>
  <div class="topbar">
    <button class="topbar__menu" @click="$emit('toggleChannels')">
      <IconHamburger :size="20" />
    </button>

    <div class="topbar__center">
      <QuircMark :size="28" />
      <div class="topbar__info">
        <div class="topbar__channel">{{ channelName || 'QUIRC' }}</div>
        <div v-if="topic" class="topbar__topic">{{ topic }}</div>
        <div v-else-if="connectionStatus !== 'connected'" class="topbar__status" :class="'topbar__status--' + connectionStatus">
          {{ statusText }}
        </div>
      </div>
    </div>

    <button class="topbar__search" @click="$emit('toggleSearch')">
      <IconSearch :size="18" />
    </button>

    <button class="topbar__users" @click="$emit('toggleUsers')">
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
})

defineEmits(['toggleChannels', 'toggleSearch', 'toggleUsers'])

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
}

.topbar__info {
  text-align: center;
}

.topbar__channel {
  font-size: var(--q-font-size-md);
  font-weight: 700;
  color: #fff;
}

.topbar__topic {
  font-size: var(--q-font-size-xs);
  color: var(--q-text-muted);
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
</style>
