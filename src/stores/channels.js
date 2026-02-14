import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

const STORAGE_KEY = 'quirc:channels'

function loadSaved() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}
  } catch { return {} }
}

export const useChannelsStore = defineStore('channels', () => {
  const saved = loadSaved()

  const channels = ref([])
  const activeChannel = ref(saved.lastActive || '')
  const mutedChannels = ref(saved.mutedChannels || [])

  const currentChannel = computed(() =>
    channels.value.find(c => c.name === activeChannel.value)
  )

  const channelNames = computed(() => channels.value.map(c => c.name))

  function setActive(name) {
    activeChannel.value = name
    const ch = channels.value.find(c => c.name === name)
    if (ch) ch.unread = 0
    persist()
  }

  function addChannel(name, topic = '') {
    if (!channels.value.find(c => c.name === name)) {
      channels.value.push({ name, unread: 0, topic, modes: '' })
    }
  }

  function removeChannel(name) {
    channels.value = channels.value.filter(c => c.name !== name)
    if (activeChannel.value === name && channels.value.length) {
      setActive(channels.value[0].name)
    } else if (!channels.value.length) {
      activeChannel.value = ''
    }
  }

  function setTopic(name, topic) {
    const ch = channels.value.find(c => c.name === name)
    if (ch) ch.topic = topic
  }

  function setModes(name, modes) {
    const ch = channels.value.find(c => c.name === name)
    if (ch) ch.modes = modes
  }

  function incrementUnread(name) {
    const ch = channels.value.find(c => c.name === name)
    if (ch && name !== activeChannel.value) ch.unread++
  }

  function toggleMute(name) {
    const idx = mutedChannels.value.indexOf(name)
    if (idx !== -1) {
      mutedChannels.value.splice(idx, 1)
    } else {
      mutedChannels.value.push(name)
    }
    persist()
  }

  function isMuted(name) {
    return mutedChannels.value.includes(name)
  }

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      lastActive: activeChannel.value,
      mutedChannels: mutedChannels.value,
    }))
  }

  return {
    channels,
    activeChannel,
    currentChannel,
    channelNames,
    mutedChannels,
    setActive,
    addChannel,
    removeChannel,
    setTopic,
    setModes,
    incrementUnread,
    toggleMute,
    isMuted,
    persist,
  }
})
