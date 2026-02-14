<template>
  <div v-if="open" class="jc">
    <div class="jc__backdrop" @click="$emit('close')" />
    <div class="jc__panel">
      <div class="jc__header">
        <span class="jc__title">JOIN CHANNEL</span>
        <button class="jc__x" @click="$emit('close')">
          <IconClose :size="16" color="var(--q-text-muted)" />
        </button>
      </div>

      <div class="jc__form">
        <label class="jc__label">CHANNEL NAME</label>
        <input
          ref="inputRef"
          v-model="channelName"
          class="jc__input"
          placeholder="#channel"
          @keydown.enter="onJoin"
        />

        <label class="jc__label">KEY <span class="jc__opt">(optional)</span></label>
        <input
          v-model="channelKey"
          class="jc__input"
          placeholder="leave blank if none"
          @keydown.enter="onJoin"
        />
      </div>

      <div class="jc__actions">
        <button class="jc__btn" :disabled="!canJoin" @click="onJoin">JOIN</button>
      </div>

      <!-- Channel list from server -->
      <div v-if="listEntries.length" class="jc__list">
        <div class="jc__list-header">
          <span class="jc__list-label">SERVER CHANNELS</span>
          <button class="jc__list-refresh" @click="fetchList">REFRESH</button>
        </div>
        <div
          v-for="entry in filteredList"
          :key="entry.channel"
          class="jc__list-item"
          @click="joinFromList(entry.channel)"
        >
          <span class="jc__list-name">{{ entry.channel }}</span>
          <span class="jc__list-users">{{ entry.users }}</span>
          <span class="jc__list-topic">{{ entry.topic }}</span>
        </div>
      </div>
      <div v-else class="jc__list-empty">
        <button class="jc__list-fetch" @click="fetchList">LIST SERVER CHANNELS</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { IconClose } from '@/components/icons'
import { getClient } from '@/irc/client'

const props = defineProps({
  open: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'join'])

const channelName = ref('')
const channelKey = ref('')
const listEntries = ref([])
const inputRef = ref(null)

const client = getClient()

const canJoin = computed(() => channelName.value.trim().length > 0)

const filteredList = computed(() => {
  const q = channelName.value.toLowerCase().replace('#', '')
  if (!q) return listEntries.value
  return listEntries.value.filter(e =>
    e.channel.toLowerCase().includes(q)
  )
})

watch(() => props.open, (val) => {
  if (val) {
    channelName.value = ''
    channelKey.value = ''
    nextTick(() => inputRef.value?.focus())
  }
})

function onJoin() {
  if (!canJoin.value) return
  let ch = channelName.value.trim()
  if (!ch.startsWith('#')) ch = `#${ch}`
  emit('join', ch, channelKey.value.trim())
  emit('close')
}

function joinFromList(name) {
  channelName.value = name
  onJoin()
}

function fetchList() {
  listEntries.value = []
  const handler = (entry) => {
    listEntries.value = [...listEntries.value, entry]
  }
  const endHandler = () => {
    client.off('list:entry', handler)
    client.off('list:end', endHandler)
  }
  client.on('list:entry', handler)
  client.on('list:end', endHandler)
  client.list()
}
</script>

<style scoped>
.jc {
  position: fixed;
  inset: 0;
  z-index: 300;
  display: flex;
  align-items: center;
  justify-content: center;
}

.jc__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
}

.jc__panel {
  position: relative;
  background: var(--q-bg-primary);
  border: 2px solid var(--q-border-strong);
  max-width: 420px;
  width: 92%;
  max-height: 90dvh;
  overflow-y: auto;
}

.jc__header {
  padding: 16px 20px;
  border-bottom: 2px solid var(--q-border-strong);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.jc__title {
  font-size: var(--q-font-size-sm);
  color: var(--q-accent-orange);
  letter-spacing: 4px;
  font-weight: 700;
}

.jc__x {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
}

.jc__form {
  padding: 16px 20px;
}

.jc__label {
  display: block;
  font-size: 9px;
  letter-spacing: 2px;
  color: var(--q-text-dim);
  text-transform: uppercase;
  margin-bottom: 4px;
  margin-top: 12px;
}

.jc__label:first-child {
  margin-top: 0;
}

.jc__opt {
  color: var(--q-text-ghost);
}

.jc__input {
  width: 100%;
  background: var(--q-bg-secondary);
  border: 1px solid var(--q-border-strong);
  color: var(--q-text-primary);
  font-family: var(--q-font-mono);
  font-size: var(--q-font-size-base);
  padding: 8px 10px;
}

.jc__input:focus {
  border-color: var(--q-accent-teal);
}

.jc__actions {
  padding: 0 20px 16px;
}

.jc__btn {
  width: 100%;
  padding: 12px;
  border: none;
  background: var(--q-accent-orange);
  color: #000;
  font-family: var(--q-font-mono);
  font-size: var(--q-font-size-sm);
  font-weight: 700;
  letter-spacing: 3px;
  text-transform: uppercase;
  cursor: pointer;
}

.jc__btn:disabled {
  background: var(--q-border-strong);
  color: var(--q-text-dim);
  cursor: not-allowed;
}

.jc__list {
  border-top: 1px solid var(--q-border);
  padding: 12px 20px 16px;
  max-height: 250px;
  overflow-y: auto;
}

.jc__list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.jc__list-label {
  font-size: 9px;
  letter-spacing: 2px;
  color: var(--q-text-dim);
  text-transform: uppercase;
}

.jc__list-refresh {
  background: none;
  border: 1px solid var(--q-border);
  color: var(--q-text-dim);
  font-family: var(--q-font-mono);
  font-size: 9px;
  letter-spacing: 1px;
  padding: 3px 8px;
  cursor: pointer;
}

.jc__list-item {
  padding: 6px 0;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 4px;
  cursor: pointer;
}

.jc__list-item:hover {
  color: var(--q-accent-teal);
}

.jc__list-name {
  color: var(--q-text-secondary);
  font-size: var(--q-font-size-sm);
}

.jc__list-users {
  color: var(--q-text-dim);
  font-size: var(--q-font-size-xs);
  text-align: right;
}

.jc__list-topic {
  grid-column: 1 / -1;
  color: var(--q-text-ghost);
  font-size: var(--q-font-size-xs);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.jc__list-empty {
  padding: 12px 20px 16px;
  border-top: 1px solid var(--q-border);
}

.jc__list-fetch {
  width: 100%;
  padding: 8px;
  border: 1px solid var(--q-border-strong);
  background: var(--q-bg-secondary);
  color: var(--q-text-dim);
  font-family: var(--q-font-mono);
  font-size: var(--q-font-size-sm);
  letter-spacing: 2px;
  cursor: pointer;
}

.jc__list-fetch:hover {
  border-color: var(--q-accent-teal);
  color: var(--q-accent-teal);
}
</style>
