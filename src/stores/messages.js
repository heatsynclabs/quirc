import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useChannelsStore } from './channels'
import { useSettingsStore } from './settings'
import { formatTime } from '@/utils/time'
import { saveMessages, loadMessages, clearChannel as dbClearChannel } from '@/db/messageStore'

export const useMessagesStore = defineStore('messages', () => {
  const messagesByChannel = ref({})
  const replyTarget = ref(null)

  // Batched DB persistence
  const _pendingSave = {}
  let _saveTimer = null

  function _scheduleSave(channel, msgs) {
    if (!_pendingSave[channel]) _pendingSave[channel] = []
    _pendingSave[channel].push(...msgs)
    if (!_saveTimer) {
      _saveTimer = setTimeout(_flushSaves, 500)
    }
  }

  function _flushSaves() {
    _saveTimer = null
    const batch = { ..._pendingSave }
    for (const ch in _pendingSave) delete _pendingSave[ch]
    for (const [ch, msgs] of Object.entries(batch)) {
      saveMessages(ch, msgs).catch(() => {})
    }
  }

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
    // Persist to IndexedDB (batched)
    if (message.msgid) {
      _scheduleSave(channel, [message])
    }
  }

  function prependMessages(channel, newMessages) {
    ensureChannel(channel)
    const existing = messagesByChannel.value[channel]
    // Deduplicate by msgid
    const existingIds = new Set(existing.map(m => m.msgid).filter(Boolean))
    const unique = newMessages.filter(m => !m.msgid || !existingIds.has(m.msgid))
    messagesByChannel.value[channel] = [...unique, ...existing]
    // Persist new unique messages to IndexedDB
    const withMsgid = unique.filter(m => m.msgid)
    if (withMsgid.length) {
      _scheduleSave(channel, withMsgid)
    }
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
    dbClearChannel(channel).catch(() => {})
  }

  /**
   * Load cached messages from IndexedDB for a channel.
   * Returns true if messages were loaded.
   */
  async function loadFromDB(channel) {
    try {
      const cached = await loadMessages(channel, 200)
      if (cached.length) {
        ensureChannel(channel)
        const existing = messagesByChannel.value[channel]
        const existingIds = new Set(existing.map(m => m.msgid).filter(Boolean))
        const unique = cached.filter(m => !m.msgid || !existingIds.has(m.msgid))
        if (unique.length) {
          messagesByChannel.value[channel] = [...unique, ...existing]
        }
        return true
      }
    } catch {
      // IndexedDB not available or error — continue without cache
    }
    return false
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
    loadFromDB,
    setReplyTarget,
    clearReplyTarget,
  }
})
