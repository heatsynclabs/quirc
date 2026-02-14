<template>
  <div class="msg-list" ref="scrollRef">
    <!-- MOTD from server -->
    <div v-if="motd.length" class="msg-list__motd">
      <div class="msg-list__motd-label">MOTD</div>
      <div class="msg-list__motd-text">
        <div v-for="(line, i) in motd" :key="i">{{ line }}</div>
      </div>
    </div>

    <!-- No channel state -->
    <div v-if="!messages.length && !motd.length" class="msg-list__empty">
      <div class="msg-list__empty-text">No messages yet.</div>
      <div class="msg-list__empty-hint">Join a channel or wait for a connection.</div>
    </div>

    <UnreadMarker v-if="messages.length" />

    <MessageItem
      v-for="msg in messages"
      :key="msg.id"
      :message="msg"
      @reply="onReply"
      @react="onReact"
    />

    <TypingIndicator :nicks="typingNicks" />
    <div ref="endRef" />
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted } from 'vue'
import MessageItem from './MessageItem.vue'
import UnreadMarker from '@/components/shared/UnreadMarker.vue'
import TypingIndicator from '@/components/shared/TypingIndicator.vue'

const props = defineProps({
  messages: { type: Array, required: true },
  typingNicks: { type: Array, default: () => [] },
  motd: { type: Array, default: () => [] },
})

const emit = defineEmits(['reply', 'react'])

const scrollRef = ref(null)
const endRef = ref(null)

function scrollToBottom() {
  nextTick(() => {
    endRef.value?.scrollIntoView({ behavior: 'smooth' })
  })
}

watch(() => props.messages.length, scrollToBottom)
onMounted(scrollToBottom)

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

.msg-list__empty-hint {
  color: var(--q-text-ghost);
  font-size: var(--q-font-size-sm);
  margin-top: 8px;
}
</style>
