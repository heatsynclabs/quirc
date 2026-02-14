<template>
  <div v-if="open" class="disc">
    <div class="disc__backdrop" @click="$emit('close')" />
    <div class="disc__panel">
      <div class="disc__header">
        <span class="disc__title">BROWSE CHANNELS</span>
        <button class="disc__x" @click="$emit('close')">
          <IconClose :size="16" color="var(--q-text-muted)" />
        </button>
      </div>

      <div class="disc__search">
        <input
          ref="searchRef"
          v-model="searchQuery"
          class="disc__input"
          placeholder="Search channels..."
          @keydown.escape="$emit('close')"
        />
      </div>

      <div class="disc__body">
        <div v-if="loading" class="disc__loading">
          <span class="disc__spinner" />
          <span>Loading channel list...</span>
        </div>

        <div v-else-if="!entries.length" class="disc__empty">
          <button class="disc__fetch-btn" @click="fetchList">LOAD CHANNELS FROM SERVER</button>
        </div>

        <template v-else>
          <div class="disc__meta">
            {{ filtered.length }} channel{{ filtered.length !== 1 ? 's' : '' }}
            <button class="disc__refresh" @click="fetchList">REFRESH</button>
          </div>

          <div class="disc__list">
            <div
              v-for="entry in filtered"
              :key="entry.channel"
              class="disc__item"
              :class="{ 'disc__item--joined': isJoined(entry.channel) }"
              @click="onJoin(entry.channel)"
            >
              <div class="disc__item-header">
                <span class="disc__item-name">{{ entry.channel }}</span>
                <span class="disc__item-users">{{ entry.users }} users</span>
              </div>
              <div v-if="entry.topic" class="disc__item-topic">{{ entry.topic }}</div>
              <div v-if="isJoined(entry.channel)" class="disc__item-tag">JOINED</div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { IconClose } from '@/components/icons'
import { getClient } from '@/irc/client'
import { useChannelsStore } from '@/stores/channels'

const props = defineProps({
  open: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'join'])

const client = getClient()
const channels = useChannelsStore()

const searchQuery = ref('')
const searchRef = ref(null)
const entries = ref([])
const loading = ref(false)

const filtered = computed(() => {
  const q = searchQuery.value.toLowerCase()
  const list = [...entries.value].sort((a, b) => b.users - a.users)
  if (!q) return list
  return list.filter(e =>
    e.channel.toLowerCase().includes(q) ||
    e.topic.toLowerCase().includes(q)
  )
})

watch(() => props.open, (val) => {
  if (val) {
    searchQuery.value = ''
    nextTick(() => searchRef.value?.focus())
    if (!entries.value.length) {
      fetchList()
    }
  }
})

function isJoined(name) {
  return channels.channels.some(c => c.name === name)
}

function fetchList() {
  entries.value = []
  loading.value = true

  const handler = (entry) => {
    entries.value = [...entries.value, entry]
  }
  const endHandler = () => {
    loading.value = false
    client.off('list:entry', handler)
    client.off('list:end', endHandler)
  }
  client.on('list:entry', handler)
  client.on('list:end', endHandler)
  client.list()

  // Safety timeout
  setTimeout(() => {
    if (loading.value) {
      loading.value = false
      client.off('list:entry', handler)
      client.off('list:end', endHandler)
    }
  }, 15000)
}

function onJoin(channel) {
  if (isJoined(channel)) {
    channels.setActive(channel)
    emit('close')
  } else {
    emit('join', channel)
    emit('close')
  }
}
</script>

<style scoped>
.disc {
  position: fixed;
  inset: 0;
  z-index: 300;
  display: flex;
  align-items: center;
  justify-content: center;
}

.disc__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
}

.disc__panel {
  position: relative;
  background: var(--q-bg-primary);
  border: 2px solid var(--q-border-strong);
  max-width: 520px;
  width: 94%;
  max-height: 80dvh;
  display: flex;
  flex-direction: column;
}

.disc__header {
  padding: 16px 20px;
  border-bottom: 2px solid var(--q-border-strong);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.disc__title {
  font-size: var(--q-font-size-sm);
  color: var(--q-accent-orange);
  letter-spacing: 4px;
  font-weight: 700;
}

.disc__x {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
}

.disc__search {
  padding: 12px 20px;
  border-bottom: 1px solid var(--q-border);
  flex-shrink: 0;
}

.disc__input {
  width: 100%;
  background: var(--q-bg-secondary);
  border: 1px solid var(--q-border-strong);
  color: var(--q-text-primary);
  font-family: var(--q-font-mono);
  font-size: 13px;
  padding: 10px 12px;
}

.disc__input:focus {
  border-color: var(--q-accent-teal);
}

.disc__body {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.disc__loading {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 24px 20px;
  color: var(--q-text-secondary);
  font-size: 13px;
}

.disc__spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--q-border-strong);
  border-top-color: var(--q-accent-teal);
  animation: disc-spin 0.8s linear infinite;
  flex-shrink: 0;
}

@keyframes disc-spin {
  to { transform: rotate(360deg); }
}

.disc__empty {
  padding: 24px 20px;
  text-align: center;
}

.disc__fetch-btn {
  padding: 12px 24px;
  border: 1px solid var(--q-border-strong);
  background: var(--q-bg-secondary);
  color: var(--q-text-secondary);
  font-family: var(--q-font-mono);
  font-size: var(--q-font-size-sm);
  letter-spacing: 2px;
  cursor: pointer;
}

.disc__fetch-btn:hover {
  border-color: var(--q-accent-teal);
  color: var(--q-accent-teal);
}

.disc__meta {
  padding: 8px 20px;
  font-size: var(--q-font-size-xs);
  color: var(--q-text-dim);
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--q-border);
}

.disc__refresh {
  background: none;
  border: 1px solid var(--q-border);
  color: var(--q-text-dim);
  font-family: var(--q-font-mono);
  font-size: 9px;
  letter-spacing: 1px;
  padding: 3px 8px;
  cursor: pointer;
}

.disc__refresh:hover {
  border-color: var(--q-accent-teal);
  color: var(--q-accent-teal);
}

.disc__list {
  padding: 0;
}

.disc__item {
  padding: 10px 20px;
  cursor: pointer;
  border-bottom: 1px solid var(--q-border);
  position: relative;
}

.disc__item:hover {
  background: var(--q-bg-hover);
}

.disc__item--joined {
  opacity: 0.6;
}

.disc__item-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.disc__item-name {
  color: var(--q-text-secondary);
  font-size: var(--q-font-size-base);
  font-weight: 700;
}

.disc__item:hover .disc__item-name {
  color: var(--q-accent-teal);
}

.disc__item-users {
  color: var(--q-text-dim);
  font-size: var(--q-font-size-xs);
  flex-shrink: 0;
}

.disc__item-topic {
  color: var(--q-text-ghost);
  font-size: var(--q-font-size-xs);
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.disc__item-tag {
  position: absolute;
  top: 10px;
  right: 20px;
  font-size: 9px;
  color: var(--q-accent-green);
  letter-spacing: 1px;
}
</style>
