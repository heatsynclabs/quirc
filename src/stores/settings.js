import { ref, watch } from 'vue'
import { defineStore } from 'pinia'

const STORAGE_KEY = 'quirc:settings'

function loadSaved() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}
  } catch { return {} }
}

export const useSettingsStore = defineStore('settings', () => {
  const saved = loadSaved()

  // Display
  const theme = ref(saved.theme ?? 'dark')
  const use24hTime = ref(saved.use24hTime ?? true)
  const fontSize = ref(saved.fontSize ?? 13)
  const showJoinPart = ref(saved.showJoinPart ?? true)
  const showTimestamps = ref(saved.showTimestamps ?? true)
  const coloredNicks = ref(saved.coloredNicks ?? true)

  // Media
  const mediaAutoExpand = ref(saved.mediaAutoExpand ?? true)
  const linkPreviews = ref(saved.linkPreviews ?? true)
  const inlineImages = ref(saved.inlineImages ?? true)

  // Behavior
  const showTypingIndicators = ref(saved.showTypingIndicators ?? true)
  const sendTypingIndicators = ref(saved.sendTypingIndicators ?? true)
  const desktopNotifications = ref(saved.desktopNotifications ?? false)
  const notifyOnMention = ref(saved.notifyOnMention ?? true)
  const notifyOnDM = ref(saved.notifyOnDM ?? true)
  const notifyKeywords = ref(saved.notifyKeywords || [])

  // Advanced
  const rawMessageLog = ref(saved.rawMessageLog ?? false)
  const maxMessagesPerChannel = ref(saved.maxMessagesPerChannel ?? 10000)

  function applyTheme() {
    document.documentElement.setAttribute('data-theme', theme.value)
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) {
      meta.setAttribute('content', theme.value === 'light' ? '#f5f5f0' : '#0a0a0a')
    }
  }

  // Apply theme immediately on store init
  applyTheme()

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      theme: theme.value,
      use24hTime: use24hTime.value,
      fontSize: fontSize.value,
      showJoinPart: showJoinPart.value,
      showTimestamps: showTimestamps.value,
      coloredNicks: coloredNicks.value,
      mediaAutoExpand: mediaAutoExpand.value,
      linkPreviews: linkPreviews.value,
      inlineImages: inlineImages.value,
      showTypingIndicators: showTypingIndicators.value,
      sendTypingIndicators: sendTypingIndicators.value,
      desktopNotifications: desktopNotifications.value,
      notifyOnMention: notifyOnMention.value,
      notifyOnDM: notifyOnDM.value,
      notifyKeywords: notifyKeywords.value,
      rawMessageLog: rawMessageLog.value,
      maxMessagesPerChannel: maxMessagesPerChannel.value,
    }))
  }

  // Auto-persist on any change
  // Re-apply theme whenever it changes
  watch(theme, applyTheme)

  const allRefs = [
    theme, use24hTime, fontSize, showJoinPart, showTimestamps, coloredNicks,
    mediaAutoExpand, linkPreviews, inlineImages,
    showTypingIndicators, sendTypingIndicators, desktopNotifications,
    notifyOnMention, notifyOnDM, notifyKeywords,
    rawMessageLog, maxMessagesPerChannel,
  ]
  for (const r of allRefs) {
    watch(r, persist, { deep: true })
  }

  function reset() {
    localStorage.removeItem(STORAGE_KEY)
  }

  return {
    theme,
    use24hTime,
    fontSize,
    showJoinPart,
    showTimestamps,
    coloredNicks,
    mediaAutoExpand,
    linkPreviews,
    inlineImages,
    showTypingIndicators,
    sendTypingIndicators,
    desktopNotifications,
    notifyOnMention,
    notifyOnDM,
    notifyKeywords,
    rawMessageLog,
    maxMessagesPerChannel,
    persist,
    reset,
  }
})
