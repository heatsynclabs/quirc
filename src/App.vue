<template>
  <SplashScreen v-if="showSplash" @done="onSplashDone" />
  <div v-else class="app" :style="appStyle">
    <NoiseOverlay />

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
      @browse-channels="onBrowseChannels"
      @open-settings="onOpenSettings"
    />

    <div class="app__main">
      <TopBar
        :channel-name="channels.activeChannel"
        :topic="channels.currentChannel?.topic"
        :online-count="users.onlineCount"
        :connection-status="connection.status"
        :modes="channels.currentChannel?.modes"
        @toggle-channels="ui.toggleChannelDrawer()"
        @toggle-search="ui.toggleSearch()"
        @toggle-users="ui.toggleUsersDrawer()"
        @open-channel-info="ui.channelInfoOpen = true"
      />

      <TopicBanner
        :topic="channels.currentChannel?.topic"
        @open-info="ui.channelInfoOpen = true"
      />

      <MessageList
        :messages="messages.currentMessages"
        :typing-nicks="typingNicks"
        :motd="connection.motd"
        :channel-name="channels.activeChannel"
        :connection-status="connection.status"
        :loading-history="loadingHistory"
        @reply="onReply"
        @react="onReact"
        @load-history="onLoadHistory"
      />

      <InputBar
        ref="inputBarRef"
        v-model="inputText"
        :reply-target="messages.replyTarget"
        :channel-name="channels.activeChannel"
        :nick="connection.nick"
        @send="onSend"
        @clear-reply="messages.clearReplyTarget()"
      />
    </div>

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
      @browse="ui.channelDiscoveryOpen = true"
    />

    <RegisterNickModal
      :open="ui.registerNickOpen"
      @close="ui.registerNickOpen = false"
    />

    <ChannelInfoPanel
      :open="ui.channelInfoOpen"
      :channel-name="channels.activeChannel"
      @close="ui.channelInfoOpen = false"
    />

    <ChannelDiscoveryModal
      :open="ui.channelDiscoveryOpen"
      @close="ui.channelDiscoveryOpen = false"
      @join="onJoinChannel"
    />

    <HelpPanel
      :open="ui.helpOpen"
      @close="ui.helpOpen = false"
    />

    <UserInfoCard
      :open="ui.whoisCardOpen"
      :data="ui.whoisData || {}"
      @close="ui.closeWhoisCard()"
      @open-d-m="onOpenDM"
    />

    <FileUploadToast
      :visible="inputBarRef?.uploading"
      :progress="inputBarRef?.progress ?? 0"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUiStore } from '@/stores/ui'
import { useConnectionStore } from '@/stores/connection'
import { useChannelsStore } from '@/stores/channels'
import { useMessagesStore } from '@/stores/messages'
import { useUsersStore } from '@/stores/users'
import { useSettingsStore } from '@/stores/settings'
import { useIRC } from '@/composables/useIRC'
import { getClient } from '@/irc/client'
import { useNotifications } from '@/composables/useNotifications'

import SplashScreen from '@/components/SplashScreen.vue'
import NoiseOverlay from '@/components/shared/NoiseOverlay.vue'
import TopBar from '@/components/layout/TopBar.vue'
import TopicBanner from '@/components/layout/TopicBanner.vue'
import MessageList from '@/components/messages/MessageList.vue'
import InputBar from '@/components/layout/InputBar.vue'
import ChannelDrawer from '@/components/layout/ChannelDrawer.vue'
import UsersDrawer from '@/components/layout/UsersDrawer.vue'
import SearchOverlay from '@/components/overlays/SearchOverlay.vue'
import ConnectionModal from '@/components/overlays/ConnectionModal.vue'
import SettingsPanel from '@/components/overlays/SettingsPanel.vue'
import JoinChannelModal from '@/components/overlays/JoinChannelModal.vue'
import RegisterNickModal from '@/components/overlays/RegisterNickModal.vue'
import ChannelInfoPanel from '@/components/overlays/ChannelInfoPanel.vue'
import ChannelDiscoveryModal from '@/components/overlays/ChannelDiscoveryModal.vue'
import HelpPanel from '@/components/overlays/HelpPanel.vue'
import UserInfoCard from '@/components/overlays/UserInfoCard.vue'
import FileUploadToast from '@/components/overlays/FileUploadToast.vue'

const ui = useUiStore()
const connection = useConnectionStore()
const channels = useChannelsStore()
const messages = useMessagesStore()
const users = useUsersStore()
const settings = useSettingsStore()
const irc = useIRC()
const notifications = useNotifications()

const route = useRoute()
const router = useRouter()

const showSplash = ref(true)
const inputText = ref('')
const inputBarRef = ref(null)
const typingNicks = ref([])
const loadingHistory = ref(false)
const _typingTimers = new Map()

// Font size CSS variable
const appStyle = computed(() => ({
  '--q-font-size-base': `${settings.fontSize}px`,
}))

// Listen for typing events from IRC
const client = getClient()

function _onTyping({ nick, channel, status }) {
  if (!settings.showTypingIndicators) return
  if (channel !== channels.activeChannel) return

  // Clear existing timer for this nick
  if (_typingTimers.has(nick)) {
    clearTimeout(_typingTimers.get(nick))
    _typingTimers.delete(nick)
  }

  if (status === 'active') {
    if (!typingNicks.value.includes(nick)) {
      typingNicks.value = [...typingNicks.value, nick]
    }
    // Auto-expire after 7 seconds
    const timer = setTimeout(() => {
      typingNicks.value = typingNicks.value.filter(n => n !== nick)
      _typingTimers.delete(nick)
    }, 7000)
    _typingTimers.set(nick, timer)
  } else {
    typingNicks.value = typingNicks.value.filter(n => n !== nick)
  }
}
client.on('typing', _onTyping)

// Parse URL query params for server auto-config
// e.g. ?server=irc.example.org&ws=wss://...&port=6697&channels=general,random&nick=guest
function applyUrlConfig() {
  const params = new URLSearchParams(window.location.search)
  if (!params.has('ws') && !params.has('server')) return false

  const config = {}
  if (params.has('server')) config.serverHost = params.get('server')
  if (params.has('ws')) config.gatewayUrl = params.get('ws')
  if (params.has('port')) config.serverPort = Number(params.get('port'))
  if (params.has('nick')) config.nick = params.get('nick')
  if (params.has('channels')) {
    config.autoJoinChannels = params.get('channels')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .map(s => s.startsWith('#') ? s : `#${s}`)
  }

  connection.configure(config)

  // Clean URL params after applying
  if (window.history.replaceState) {
    const clean = window.location.pathname + window.location.hash
    window.history.replaceState({}, '', clean)
  }

  return !!(config.gatewayUrl && config.nick)
}

function onSplashDone() {
  showSplash.value = false
  notifications.requestPermission()

  const autoConnect = applyUrlConfig()
  if (autoConnect || connection.isConfigured) {
    irc.connect()
  } else {
    ui.connectionModalOpen = true
  }
}

// Notifications for DMs and mentions — gated on settings
function _onNotifyPrivmsg(msg) {
  if (!settings.desktopNotifications) return

  const nick = msg.source?.nick || '???'
  if (nick === client.nick) return
  const target = msg.params[0]
  const text = msg.params[1] || ''

  // DM: target is our nick
  if (!target.startsWith('#') && settings.notifyOnDM) {
    notifications.notify(`DM from ${nick}`, text)
    return
  }

  // @mention in channel (word boundary match to avoid false positives)
  if (settings.notifyOnMention) {
    const nickRe = new RegExp('\\b' + client.nick.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i')
    if (nickRe.test(text)) {
      notifications.notify(`${nick} in ${target}`, text)
      return
    }
  }

  // Custom keyword matching (word boundary)
  if (settings.notifyKeywords.length > 0) {
    for (const kw of settings.notifyKeywords) {
      if (!kw) continue
      const kwRe = new RegExp('\\b' + kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i')
      if (kwRe.test(text)) {
        notifications.notify(`${nick} in ${target}`, text)
        return
      }
    }
  }
}
client.on('PRIVMSG', _onNotifyPrivmsg)

function onConnect({ keepOpen } = {}) {
  if (!keepOpen) ui.connectionModalOpen = false
  irc.connect()
}

// Sync route to active channel
if (route.params.name) {
  const asChannel = `#${route.params.name}`
  const asDM = route.params.name
  const match = channels.channels.find(c => c.name === asChannel || c.name === asDM)
  if (match) channels.setActive(match.name)
}

// Sync active channel -> route
watch(() => channels.activeChannel, (ch) => {
  if (!ch) return
  const name = ch.startsWith('#') ? ch.slice(1) : ch
  const current = route.params.name
  if (current !== name) router.replace(`/channel/${name}`)
})

function onChannelPick(name) {
  channels.setActive(name)
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
  if (channel && typeof msgId === 'string') {
    client.tagmsg(channel, { '+draft/react': emoji, '+draft/reply': msgId })
  }
}

function onOpenJoinChannel() {
  ui.channelDrawerOpen = false
  ui.joinChannelOpen = true
}

function onBrowseChannels() {
  ui.channelDrawerOpen = false
  ui.channelDiscoveryOpen = true
}

function onOpenSettings() {
  ui.channelDrawerOpen = false
  ui.settingsOpen = true
}

function onJoinChannel(channel, key) {
  client.join(channel, key)
}

function onLoadHistory() {
  const channel = channels.activeChannel
  if (!channel || loadingHistory.value) return
  const msgs = messages.currentMessages
  // Find the oldest message with a msgid
  const oldest = msgs.find(m => m.msgid)
  if (!oldest?.msgid) return
  loadingHistory.value = true
  const sent = client.chathistoryBefore(channel, oldest.msgid, 100)
  if (!sent) {
    loadingHistory.value = false
    return
  }
  // Clear loading after batch is received or timeout
  const timeout = setTimeout(() => { loadingHistory.value = false }, 10000)
  const handler = (batch) => {
    if (batch.type !== 'chathistory') return
    loadingHistory.value = false
    clearTimeout(timeout)
    client.off('batch:end', handler)
  }
  client.on('batch:end', handler)
}

function onOpenDM(nick) {
  channels.addChannel(nick, 'Direct message')
  channels.setActive(nick)
  irc.client.chathistory(nick, 100)
}

// Global keyboard shortcuts
function onGlobalKeydown(e) {
  if (e.key === 'Escape') {
    if (ui.whoisCardOpen) { ui.closeWhoisCard(); return }
    if (ui.channelInfoOpen) { ui.channelInfoOpen = false; return }
    if (ui.channelDiscoveryOpen) { ui.channelDiscoveryOpen = false; return }
    if (ui.helpOpen) { ui.helpOpen = false; return }
    if (ui.registerNickOpen) { ui.registerNickOpen = false; return }
    if (ui.searchOpen) { ui.searchOpen = false; return }
    if (ui.settingsOpen) { ui.settingsOpen = false; return }
    if (ui.joinChannelOpen) { ui.joinChannelOpen = false; return }
    if (ui.connectionModalOpen && connection.isConfigured) { ui.connectionModalOpen = false; return }
    if (ui.channelDrawerOpen) { ui.channelDrawerOpen = false; return }
    if (ui.usersDrawerOpen) { ui.usersDrawerOpen = false; return }
  }
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    ui.toggleSearch()
  }
}

// Mobile viewport: track visual viewport height to handle keyboard resize
function updateAppHeight() {
  const vh = window.visualViewport?.height ?? window.innerHeight
  document.documentElement.style.setProperty('--app-height', `${vh}px`)
}

onMounted(() => {
  window.addEventListener('keydown', onGlobalKeydown)
  updateAppHeight()
  window.visualViewport?.addEventListener('resize', updateAppHeight)
  window.addEventListener('resize', updateAppHeight)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onGlobalKeydown)
  window.visualViewport?.removeEventListener('resize', updateAppHeight)
  window.removeEventListener('resize', updateAppHeight)
  client.off('typing', _onTyping)
  client.off('PRIVMSG', _onNotifyPrivmsg)
  for (const timer of _typingTimers.values()) {
    clearTimeout(timer)
  }
  _typingTimers.clear()
})
</script>

<style scoped>
.app {
  height: var(--app-height, 100dvh);
  width: 100%;
  display: flex;
  flex-direction: column;
  background: var(--q-bg-primary);
  color: var(--q-text-primary);
  font-family: var(--q-font-mono);
  position: relative;
  overflow: hidden;
}

.app__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

@media (min-width: 768px) {
  .app {
    flex-direction: row;
  }
}
</style>
