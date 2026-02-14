import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useChannelsStore } from './channels'
import { useSettingsStore } from './settings'
import { formatTime } from '@/utils/time'

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

  function _trimToLimit(channel) {
    const settings = useSettingsStore()
    const max = settings.maxMessagesPerChannel
    const arr = messagesByChannel.value[channel]
    if (arr && arr.length > max) {
      arr.splice(0, arr.length - max)
    }
  }

  function addMessage(channel, message) {
    ensureChannel(channel)
    messagesByChannel.value[channel].push(message)
    _trimToLimit(channel)
  }

  function prependMessages(channel, newMessages) {
    ensureChannel(channel)
    const existing = messagesByChannel.value[channel]
    // Deduplicate by msgid
    const existingIds = new Set(existing.map(m => m.msgid).filter(Boolean))
    const unique = newMessages.filter(m => !m.msgid || !existingIds.has(m.msgid))
    messagesByChannel.value[channel] = [...unique, ...existing]
  }

  function addSystemMessage(channel, text, subtype = 'info') {
    const settings = useSettingsStore()
    ensureChannel(channel)
    messagesByChannel.value[channel].push({
      id: Date.now() + Math.random(),
      type: 'system',
      subtype,
      time: formatTime(new Date(), settings.use24hTime),
      text,
    })
    _trimToLimit(channel)
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
    prependMessages,
    addSystemMessage,
    addReaction,
    clearChannel,
    setReplyTarget,
    clearReplyTarget,
  }
})
