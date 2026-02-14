<template>
  <SplashScreen v-if="showSplash" @done="onSplashDone" />
  <div v-else class="app">
    <NoiseOverlay />

    <TopBar
      :channel-name="channels.activeChannel"
      :topic="channels.currentChannel?.topic"
      :online-count="users.onlineCount"
      :connection-status="connection.status"
      @toggle-channels="ui.toggleChannelDrawer()"
      @toggle-search="ui.toggleSearch()"
      @toggle-users="ui.toggleUsersDrawer()"
    />

    <MessageList
      :messages="messages.currentMessages"
      :typing-nicks="typingNicks"
      :motd="connection.motd"
      @reply="onReply"
      @react="onReact"
    />

    <InputBar
      ref="inputBarRef"
      v-model="inputText"
      :reply-target="messages.replyTarget"
      @send="onSend"
      @clear-reply="messages.clearReplyTarget()"
    />

    <ChannelDrawer
      :open="ui.channelDrawerOpen"
      :channels="channels.channels"
      :active="channels.activeChannel"
      :nick="connection.nick"
      :is-op="connection.isOp"
      :server-host="connection.serverHost"
      :server-port="connection.serverPort"
      :connection-status="connection.status"
      @close="ui.channelDrawerOpen = false"
      @pick="onChannelPick"
      @join-channel="onOpenJoinChannel"
      @open-settings="onOpenSettings"
    />

    <UsersDrawer
      :open="ui.usersDrawerOpen"
      :users="users.sortedUsers"
      :online-count="users.onlineCount"
      :is-op="connection.isOp"
      :my-nick="connection.nick"
      @close="ui.usersDrawerOpen = false"
      @open-d-m="onOpenDM"
    />

    <SearchOverlay
      :open="ui.searchOpen"
      :messages="messages.currentMessages"
      @close="ui.searchOpen = false"
    />

    <ConnectionModal
      :open="ui.connectionModalOpen"
      :dismissable="connection.isConfigured"
      @close="ui.connectionModalOpen = false"
      @connect="onConnect"
    />

    <SettingsPanel
      :open="ui.settingsOpen"
      @close="ui.settingsOpen = false"
    />

    <JoinChannelModal
      :open="ui.joinChannelOpen"
      @close="ui.joinChannelOpen = false"
      @join="onJoinChannel"
    />

    <FileUploadToast
      :visible="inputBarRef?.uploading"
      :progress="inputBarRef?.progress ?? 0"
    />
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUiStore } from '@/stores/ui'
import { useConnectionStore } from '@/stores/connection'
import { useChannelsStore } from '@/stores/channels'
import { useMessagesStore } from '@/stores/messages'
import { useUsersStore } from '@/stores/users'
import { useIRC } from '@/composables/useIRC'
import { getClient } from '@/irc/client'
import { useNotifications } from '@/composables/useNotifications'

import SplashScreen from '@/components/SplashScreen.vue'
import NoiseOverlay from '@/components/shared/NoiseOverlay.vue'
import TopBar from '@/components/layout/TopBar.vue'
import MessageList from '@/components/messages/MessageList.vue'
import InputBar from '@/components/layout/InputBar.vue'
import ChannelDrawer from '@/components/layout/ChannelDrawer.vue'
import UsersDrawer from '@/components/layout/UsersDrawer.vue'
import SearchOverlay from '@/components/overlays/SearchOverlay.vue'
import ConnectionModal from '@/components/overlays/ConnectionModal.vue'
import SettingsPanel from '@/components/overlays/SettingsPanel.vue'
import JoinChannelModal from '@/components/overlays/JoinChannelModal.vue'
import FileUploadToast from '@/components/overlays/FileUploadToast.vue'

const ui = useUiStore()
const connection = useConnectionStore()
const channels = useChannelsStore()
const messages = useMessagesStore()
const users = useUsersStore()
const irc = useIRC()
const notifications = useNotifications()

const route = useRoute()
const router = useRouter()

const showSplash = ref(true)
const inputText = ref('')
const inputBarRef = ref(null)
const typingNicks = ref([])

// Listen for typing events from IRC
const client = getClient()
client.on('typing', ({ nick, channel, status }) => {
  if (channel !== channels.activeChannel) return
  if (status === 'active') {
    if (!typingNicks.value.includes(nick)) {
      typingNicks.value = [...typingNicks.value, nick]
    }
  } else {
    typingNicks.value = typingNicks.value.filter(n => n !== nick)
  }
})

function onSplashDone() {
  showSplash.value = false
  notifications.requestPermission()

  if (connection.isConfigured) {
    // Auto-connect if we have saved config
    irc.connect()
  } else {
    // First run - show connection modal
    ui.connectionModalOpen = true
  }
}

// Notifications for DMs and mentions
client.on('PRIVMSG', (msg) => {
  const nick = msg.source?.nick || '???'
  if (nick === client.nick) return
  const target = msg.params[0]
  const text = msg.params[1] || ''

  // DM: target is our nick
  if (!target.startsWith('#')) {
    notifications.notify(`DM from ${nick}`, text)
    return
  }

  // @mention in channel
  if (text.toLowerCase().includes(client.nick.toLowerCase())) {
    notifications.notify(`${nick} in ${target}`, text)
  }
})

function onConnect() {
  ui.connectionModalOpen = false
  irc.connect()
}

// Sync route to active channel
if (route.params.name) {
  const channelName = `#${route.params.name}`
  if (channels.channels.find(c => c.name === channelName)) {
    channels.setActive(channelName)
  }
}

function onChannelPick(name) {
  channels.setActive(name)
  const routeName = name.replace('#', '')
  router.push(`/channel/${routeName}`)
}

function onSend() {
  if (!inputText.value.trim()) return
  irc.sendInput(inputText.value)
  inputText.value = ''
  nextTick(() => inputBarRef.value?.focus())
}

function onReply(msg) {
  messages.setReplyTarget(msg)
  nextTick(() => inputBarRef.value?.focus())
}

function onReact(msgId, emoji) {
  messages.addReaction(channels.activeChannel, msgId, emoji)
  const channel = channels.activeChannel
  // Only send TAGMSG if msgId looks like a real IRC msgid (not a local fallback number)
  if (channel && typeof msgId === 'string') {
    client.tagmsg(channel, { '+draft/react': emoji, '+draft/reply': msgId })
  }
}

function onOpenJoinChannel() {
  ui.channelDrawerOpen = false
  ui.joinChannelOpen = true
}

function onOpenSettings() {
  ui.channelDrawerOpen = false
  ui.settingsOpen = true
}

function onJoinChannel(channel, key) {
  client.join(channel, key)
}

function onOpenDM(nick) {
  channels.addChannel(nick, 'Direct message')
  channels.setActive(nick)
  const routeName = nick.replace('#', '')
  router.push(`/channel/${routeName}`)
}
</script>

<style scoped>
.app {
  height: 100dvh;
  width: 100%;
  display: flex;
  flex-direction: column;
  background: var(--q-bg-primary);
  color: var(--q-text-primary);
  font-family: var(--q-font-mono);
  position: relative;
  overflow: hidden;
}
</style>
