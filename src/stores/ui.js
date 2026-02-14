import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useUiStore = defineStore('ui', () => {
  const channelDrawerOpen = ref(false)
  const usersDrawerOpen = ref(false)
  const searchOpen = ref(false)
  const emojiPickerOpen = ref(false)
  const connectionModalOpen = ref(false)
  const settingsOpen = ref(false)
  const joinChannelOpen = ref(false)
  const registerNickOpen = ref(false)
  const userContextNick = ref(null) // nick of user whose context menu is open

  function toggleChannelDrawer() {
    channelDrawerOpen.value = !channelDrawerOpen.value
    if (channelDrawerOpen.value) usersDrawerOpen.value = false
  }

  function toggleUsersDrawer() {
    usersDrawerOpen.value = !usersDrawerOpen.value
    if (usersDrawerOpen.value) channelDrawerOpen.value = false
  }

  function toggleSearch() {
    searchOpen.value = !searchOpen.value
  }

  function openUserContext(nick) {
    userContextNick.value = nick
  }

  function closeAll() {
    channelDrawerOpen.value = false
    usersDrawerOpen.value = false
    searchOpen.value = false
    emojiPickerOpen.value = false
    connectionModalOpen.value = false
    settingsOpen.value = false
    joinChannelOpen.value = false
    registerNickOpen.value = false
    userContextNick.value = null
  }

  return {
    channelDrawerOpen,
    usersDrawerOpen,
    searchOpen,
    emojiPickerOpen,
    connectionModalOpen,
    settingsOpen,
    joinChannelOpen,
    registerNickOpen,
    userContextNick,
    toggleChannelDrawer,
    toggleUsersDrawer,
    toggleSearch,
    openUserContext,
    closeAll,
  }
})
