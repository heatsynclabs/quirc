<template>
  <div class="msg-list" ref="scrollRef" @scroll="onScroll">
    <!-- Disconnection banner -->
    <div v-if="connectionStatus === 'disconnected' || connectionStatus === 'error'" class="msg-list__offline">
      Connection lost. Reconnecting...
    </div>

    <!-- Loading history indicator -->
    <div v-if="loadingHistory" class="msg-list__loading">
      <span class="msg-list__spinner" />
      Loading older messages...
    </div>

    <!-- MOTD from server -->
    <div v-if="motd.length" class="msg-list__motd">
      <div class="msg-list__motd-label">MOTD</div>
      <div class="msg-list__motd-text">
        <div v-for="(line, i) in motd" :key="i">{{ line }}</div>
      </div>
    </div>

    <!-- Context-aware empty state -->
    <div v-if="!messages.length && !motd.length" class="msg-list__empty">
      <template v-if="connectionStatus !== 'connected'">
        <div class="msg-list__empty-text">Connecting to server...</div>
      </template>
      <template v-else-if="!channelName">
        <div class="msg-list__empty-text">Join a channel to start chatting</div>
      </template>
      <template v-else-if="channelName && !channelName.startsWith('#')">
        <div class="msg-list__empty-text">Start a conversation with {{ channelName }}</div>
      </template>
      <template v-else>
        <div class="msg-list__empty-text">No messages in {{ channelName }} yet</div>
      </template>
    </div>

    <template v-for="(msg, i) in messages" :key="msg.id">
      <!-- Date separator -->
      <div v-if="showDateSeparator(i)" class="msg-list__date-sep">
        <span class="msg-list__date-line" />
        <span class="msg-list__date-label">{{ getDateLabel(msg) }}</span>
        <span class="msg-list__date-line" />
      </div>

      <MessageItem
        :message="msg"
        @reply="onReply"
        @react="onReact"
      />
    </template>

    <TypingIndicator :nicks="typingNicks" />
    <div ref="endRef" />
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import MessageItem from './MessageItem.vue'
import TypingIndicator from '@/components/shared/TypingIndicator.vue'

const props = defineProps({
  messages: { type: Array, required: true },
  typingNicks: { type: Array, default: () => [] },
  motd: { type: Array, default: () => [] },
  channelName: { type: String, default: '' },
  connectionStatus: { type: String, default: 'disconnected' },
  loadingHistory: { type: Boolean, default: false },
})

const emit = defineEmits(['reply', 'react', 'loadHistory'])

const scrollRef = ref(null)
const endRef = ref(null)

function scrollToBottom() {
  nextTick(() => {
    if (scrollRef.value) {
      scrollRef.value.scrollTop = scrollRef.value.scrollHeight
    }
  })
}

let _wasNearBottom = true

watch(() => props.messages.length, (newLen, oldLen) => {
  if (!scrollRef.value) { scrollToBottom(); return }
  const el = scrollRef.value
  _wasNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 150

  if (oldLen && newLen > oldLen && !_wasNearBottom) {
    // User is scrolled up — maintain scroll position (handles both prepend and append)
    const prevHeight = el.scrollHeight
    nextTick(() => {
      const newHeight = el.scrollHeight
      el.scrollTop += (newHeight - prevHeight)
    })
  } else {
    scrollToBottom()
  }
})

function getMessageDate(msg) {
  // Use the server time tag if stored in the message, otherwise use the time string
  // Messages with isHistory may have the original timestamp
  // Fall back to extracting from the time field
  if (msg._date) return msg._date

  // For now, we'll derive date from time field and position
  // Messages from today show just time, but we can use id for ordering
  const id = msg.id
  if (typeof id === 'number' && id > 1000000000000) {
    return new Date(Math.floor(id)).toDateString()
  }
  if (typeof id === 'string' && id.length > 10) {
    // msgid from server — not a timestamp
    return null
  }
  return null
}

function showDateSeparator(index) {
  if (index === 0) return false
  const prev = props.messages[index - 1]
  const curr = props.messages[index]

  // Skip separators between system messages
  if (prev.type === 'system' && curr.type === 'system') return false

  const prevDate = getMessageDate(prev)
  const currDate = getMessageDate(curr)

  if (!prevDate || !currDate) return false
  return prevDate !== currDate
}

function getDateLabel(msg) {
  const dateStr = getMessageDate(msg)
  if (!dateStr) return ''

  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'

  return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined })
}

// Scroll handler for infinite history
function onScroll() {
  if (!scrollRef.value) return
  const { scrollTop } = scrollRef.value
  if (scrollTop < 100 && !props.loadingHistory && props.messages.length > 0) {
    emit('loadHistory')
  }
}

// Re-scroll when mobile keyboard opens/closes (viewport resize)
function onViewportResize() {
  // Only auto-scroll if already near the bottom
  if (!scrollRef.value) return
  const { scrollTop, scrollHeight, clientHeight } = scrollRef.value
  const nearBottom = scrollHeight - scrollTop - clientHeight < 150
  if (nearBottom) scrollToBottom()
}

onMounted(() => {
  scrollToBottom()
  window.visualViewport?.addEventListener('resize', onViewportResize)
})
onUnmounted(() => {
  window.visualViewport?.removeEventListener('resize', onViewportResize)
})

function onReply(msg) {
  emit('reply', msg)
}

function onReact(msgId, emoji) {
  emit('react', msgId, emoji)
}
</script>

<style scoped>
.msg-list {
  flex: 1;
  overflow-y: auto;
  padding-top: 8px;
  padding-bottom: 8px;
  -webkit-overflow-scrolling: touch;
}

.msg-list__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  color: var(--q-text-muted);
  font-size: var(--q-font-size-xs);
  letter-spacing: 1px;
}

.msg-list__spinner {
  width: 12px;
  height: 12px;
  border: 2px solid var(--q-border-strong);
  border-top-color: var(--q-accent-teal);
  animation: msg-spin 0.8s linear infinite;
  flex-shrink: 0;
}

@keyframes msg-spin {
  to { transform: rotate(360deg); }
}

.msg-list__date-sep {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px 8px;
}

.msg-list__date-line {
  flex: 1;
  height: 1px;
  background: var(--q-border);
}

.msg-list__date-label {
  font-size: 10px;
  letter-spacing: 2px;
  color: var(--q-text-dim);
  text-transform: uppercase;
  flex-shrink: 0;
}

.msg-list__motd {
  margin: 8px 16px 16px;
  padding: 12px;
  border: 1px dashed var(--q-border-strong);
  background: var(--q-bg-secondary);
}

.msg-list__motd-label {
  font-size: var(--q-font-size-xs);
  letter-spacing: 3px;
  color: var(--q-accent-orange);
  text-transform: uppercase;
  margin-bottom: 6px;
}

.msg-list__motd-text {
  font-size: 12px;
  color: var(--q-text-secondary);
  line-height: 1.5;
}

.msg-list__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.msg-list__empty-text {
  color: var(--q-text-dim);
  font-size: var(--q-font-size-md);
}

.msg-list__offline {
  padding: 10px 16px;
  background: rgba(255, 46, 99, 0.12);
  border-bottom: 1px solid var(--q-accent-pink);
  color: var(--q-accent-pink);
  font-size: var(--q-font-size-sm);
  text-align: center;
  letter-spacing: 1px;
}
</style>
