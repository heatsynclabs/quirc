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
  const channelInfoOpen = ref(false)
  const channelDiscoveryOpen = ref(false)
  const helpOpen = ref(false)
  const userContextNick = ref(null) // nick of user whose context menu is open
  const whoisCardOpen = ref(false)
  const whoisData = ref(null)

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

  function openWhoisCard(data) {
    whoisData.value = data
    whoisCardOpen.value = true
  }

  function closeWhoisCard() {
    whoisCardOpen.value = false
    whoisData.value = null
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
    channelInfoOpen.value = false
    channelDiscoveryOpen.value = false
    helpOpen.value = false
    userContextNick.value = null
    whoisCardOpen.value = false
    whoisData.value = null
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
    channelInfoOpen,
    channelDiscoveryOpen,
    helpOpen,
    userContextNick,
    whoisCardOpen,
    whoisData,
    toggleChannelDrawer,
    toggleUsersDrawer,
    toggleSearch,
    openUserContext,
    openWhoisCard,
    closeWhoisCard,
    closeAll,
  }
})
