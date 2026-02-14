import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useUsersStore = defineStore('users', () => {
  const users = ref([])

  const onlineCount = computed(() =>
    users.value.filter(u => u.status !== 'offline').length
  )

  const sortedUsers = computed(() => {
    const order = { online: 0, away: 1, offline: 2 }
    return [...users.value].sort((a, b) => {
      // ops first
      if (a.op && !b.op) return -1
      if (!a.op && b.op) return 1
      // then by status
      const statusDiff = (order[a.status] ?? 2) - (order[b.status] ?? 2)
      if (statusDiff !== 0) return statusDiff
      // then alphabetical
      return a.nick.localeCompare(b.nick)
    })
  })

  function addUser(nick, { status = 'online', op = false, voiced = false } = {}) {
    const existing = users.value.find(u => u.nick === nick)
    if (existing) {
      existing.status = status
      existing.op = op
      existing.voiced = voiced
    } else {
      users.value.push({ nick, status, op, voiced })
    }
  }

  function removeUser(nick) {
    const idx = users.value.findIndex(u => u.nick === nick)
    if (idx !== -1) users.value.splice(idx, 1)
  }

  function updateStatus(nick, status) {
    const user = users.value.find(u => u.nick === nick)
    if (user) user.status = status
  }

  function setOp(nick, isOp) {
    const user = users.value.find(u => u.nick === nick)
    if (user) user.op = isOp
  }

  function setVoiced(nick, isVoiced) {
    const user = users.value.find(u => u.nick === nick)
    if (user) user.voiced = isVoiced
  }

  function renameUser(oldNick, newNick) {
    const user = users.value.find(u => u.nick === oldNick)
    if (user) user.nick = newNick
  }

  function setUsers(list) {
    users.value = list
  }

  function clearUsers() {
    users.value = []
  }

  return {
    users,
    onlineCount,
    sortedUsers,
    addUser,
    removeUser,
    updateStatus,
    setOp,
    setVoiced,
    renameUser,
    setUsers,
    clearUsers,
  }
})
