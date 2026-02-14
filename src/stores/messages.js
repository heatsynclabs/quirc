import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useChannelsStore } from './channels'

export const useMessagesStore = defineStore('messages', () => {
  const messagesByChannel = ref({})
  const replyTarget = ref(null)

  const currentMessages = computed(() => {
    const channels = useChannelsStore()
    return messagesByChannel.value[channels.activeChannel] || []
  })

  function ensureChannel(channel) {
    if (!messagesByChannel.value[channel]) {
      messagesByChannel.value[channel] = []
    }
  }

  function addMessage(channel, message) {
    ensureChannel(channel)
    messagesByChannel.value[channel].push(message)
  }

  function addSystemMessage(channel, text) {
    ensureChannel(channel)
    messagesByChannel.value[channel].push({
      id: Date.now() + Math.random(),
      type: 'system',
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      text,
    })
  }

  function addReaction(channel, messageId, emoji) {
    const msgs = messagesByChannel.value[channel]
    if (!msgs) return
    const msg = msgs.find(m => m.id === messageId)
    if (!msg) return
    if (!msg.reactions) msg.reactions = []
    const existing = msg.reactions.find(r => r.emoji === emoji)
    if (existing) {
      existing.count++
    } else {
      msg.reactions.push({ emoji, count: 1 })
    }
  }

  function clearChannel(channel) {
    messagesByChannel.value[channel] = []
  }

  function setReplyTarget(msg) {
    replyTarget.value = msg
  }

  function clearReplyTarget() {
    replyTarget.value = null
  }

  return {
    messagesByChannel,
    replyTarget,
    currentMessages,
    addMessage,
    addSystemMessage,
    addReaction,
    clearChannel,
    setReplyTarget,
    clearReplyTarget,
  }
})
