import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

const STORAGE_KEY = 'quirc:connection'

function loadSaved() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}
  } catch { return {} }
}

function save(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export const useConnectionStore = defineStore('connection', () => {
  const saved = loadSaved()

  // Runtime state
  const status = ref('disconnected') // connecting | connected | registered | disconnected | error
  const errorMessage = ref('')

  // User config (persisted)
  const nick = ref(saved.nick || '')
  const password = ref(saved.password || '')
  const realname = ref(saved.realname || 'QUIRC User')
  const useSasl = ref(saved.useSasl ?? false)
  const saslUsername = ref(saved.saslUsername || '')
  const saslPassword = ref(saved.saslPassword || '')

  // Server config (persisted)
  const serverHost = ref(saved.serverHost || import.meta.env.VITE_DEFAULT_SERVER || '')
  const serverPort = ref(saved.serverPort || Number(import.meta.env.VITE_DEFAULT_PORT) || 6697)
  const gatewayUrl = ref(saved.gatewayUrl || import.meta.env.VITE_GATEWAY_URL || '')
  const autoJoinChannels = ref(saved.autoJoinChannels || (import.meta.env.VITE_AUTO_JOIN || '#general').split(',').map(s => s.trim()).filter(Boolean))

  // Runtime info
  const isOp = ref(false)
  const serverName = ref('')
  const networkName = ref('')
  const motd = ref([])

  // Saved server profiles
  const savedServers = ref(saved.savedServers || [])

  const isConfigured = computed(() => !!(gatewayUrl.value && nick.value))
  const displayHost = computed(() => serverHost.value || 'not connected')

  function setStatus(s, error = '') {
    status.value = s
    errorMessage.value = error
  }

  function setNick(n) {
    nick.value = n
    persist()
  }

  function setOp(val) {
    isOp.value = val
  }

  function setServerInfo(name, network) {
    serverName.value = name
    networkName.value = network
  }

  function setMotd(lines) {
    motd.value = lines
  }

  function configure(config) {
    if (config.nick !== undefined) nick.value = config.nick
    if (config.password !== undefined) password.value = config.password
    if (config.realname !== undefined) realname.value = config.realname
    if (config.serverHost !== undefined) serverHost.value = config.serverHost
    if (config.serverPort !== undefined) serverPort.value = config.serverPort
    if (config.gatewayUrl !== undefined) gatewayUrl.value = config.gatewayUrl
    if (config.useSasl !== undefined) useSasl.value = config.useSasl
    if (config.saslUsername !== undefined) saslUsername.value = config.saslUsername
    if (config.saslPassword !== undefined) saslPassword.value = config.saslPassword
    if (config.autoJoinChannels !== undefined) autoJoinChannels.value = config.autoJoinChannels
    persist()
  }

  function addSavedServer(profile) {
    const existing = savedServers.value.findIndex(s => s.id === profile.id)
    if (existing !== -1) {
      savedServers.value[existing] = profile
    } else {
      savedServers.value.push(profile)
    }
    persist()
  }

  function removeSavedServer(id) {
    savedServers.value = savedServers.value.filter(s => s.id !== id)
    persist()
  }

  function loadServerProfile(id) {
    const profile = savedServers.value.find(s => s.id === id)
    if (profile) {
      configure(profile)
    }
  }

  function persist() {
    save({
      nick: nick.value,
      password: password.value,
      realname: realname.value,
      serverHost: serverHost.value,
      serverPort: serverPort.value,
      gatewayUrl: gatewayUrl.value,
      useSasl: useSasl.value,
      saslUsername: saslUsername.value,
      saslPassword: saslPassword.value,
      autoJoinChannels: autoJoinChannels.value,
      savedServers: savedServers.value,
    })
  }

  function clearSaved() {
    localStorage.removeItem(STORAGE_KEY)
  }

  return {
    status,
    errorMessage,
    nick,
    password,
    realname,
    useSasl,
    saslUsername,
    saslPassword,
    serverHost,
    serverPort,
    gatewayUrl,
    autoJoinChannels,
    isOp,
    serverName,
    networkName,
    motd,
    savedServers,
    isConfigured,
    displayHost,
    setStatus,
    setNick,
    setOp,
    setServerInfo,
    setMotd,
    configure,
    addSavedServer,
    removeSavedServer,
    loadServerProfile,
    persist,
    clearSaved,
  }
})
