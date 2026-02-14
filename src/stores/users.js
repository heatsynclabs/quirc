import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useChannelsStore } from './channels'

export const useUsersStore = defineStore('users', () => {
  const usersByChannel = ref({})

  function _ensure(channel) {
    if (!usersByChannel.value[channel]) {
      usersByChannel.value[channel] = []
    }
  }

  const currentUsers = computed(() => {
    const channels = useChannelsStore()
    return usersByChannel.value[channels.activeChannel] || []
  })

  const onlineCount = computed(() =>
    currentUsers.value.filter(u => u.status !== 'offline').length
  )

  const sortedUsers = computed(() => {
    const order = { online: 0, away: 1, offline: 2 }
    return [...currentUsers.value].sort((a, b) => {
      // ops first
      if (a.op && !b.op) return -1
      if (!a.op && b.op) return 1
      // voiced next
      if (a.voiced && !b.voiced) return -1
      if (!a.voiced && b.voiced) return 1
      // then by status
      const statusDiff = (order[a.status] ?? 2) - (order[b.status] ?? 2)
      if (statusDiff !== 0) return statusDiff
      // then alphabetical
      return a.nick.localeCompare(b.nick)
    })
  })

  function addUser(channel, nick, { status = 'online', op = false, voiced = false } = {}) {
    _ensure(channel)
    const list = usersByChannel.value[channel]
    const existing = list.find(u => u.nick === nick)
    if (existing) {
      existing.status = status
      existing.op = op
      existing.voiced = voiced
    } else {
      list.push({ nick, status, op, voiced })
    }
  }

  function removeUser(channel, nick) {
    const list = usersByChannel.value[channel]
    if (!list) return
    const idx = list.findIndex(u => u.nick === nick)
    if (idx !== -1) list.splice(idx, 1)
  }

  function removeUserFromAll(nick) {
    for (const channel of Object.keys(usersByChannel.value)) {
      removeUser(channel, nick)
    }
  }

  function hasUser(channel, nick) {
    const list = usersByChannel.value[channel]
    return list ? list.some(u => u.nick === nick) : false
  }

  function updateStatus(nick, status) {
    for (const list of Object.values(usersByChannel.value)) {
      const user = list.find(u => u.nick === nick)
      if (user) user.status = status
    }
  }

  function setOp(channel, nick, isOp) {
    const list = usersByChannel.value[channel]
    if (!list) return
    const user = list.find(u => u.nick === nick)
    if (user) user.op = isOp
  }

  function setVoiced(channel, nick, isVoiced) {
    const list = usersByChannel.value[channel]
    if (!list) return
    const user = list.find(u => u.nick === nick)
    if (user) user.voiced = isVoiced
  }

  function renameUser(oldNick, newNick) {
    for (const list of Object.values(usersByChannel.value)) {
      const user = list.find(u => u.nick === oldNick)
      if (user) user.nick = newNick
    }
  }

  function clearChannel(channel) {
    usersByChannel.value[channel] = []
  }

  function clearAll() {
    usersByChannel.value = {}
  }

  return {
    usersByChannel,
    currentUsers,
    onlineCount,
    sortedUsers,
    addUser,
    removeUser,
    removeUserFromAll,
    hasUser,
    updateStatus,
    setOp,
    setVoiced,
    renameUser,
    clearChannel,
    clearAll,
  }
})
