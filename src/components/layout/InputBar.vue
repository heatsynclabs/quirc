<template>
  <div>
    <!-- Reply bar -->
    <div v-if="replyTarget" class="reply-bar">
      <IconReply :size="16" color="var(--q-text-muted)" />
      <span class="reply-bar__nick" :style="{ color: replyNickColor }">{{ replyTarget.nick }}</span>
      <span class="reply-bar__text">{{ replyTarget.text.slice(0, 40) }}</span>
      <button class="reply-bar__close" @click="$emit('clearReply')">
        <IconClose :size="16" color="var(--q-text-muted)" />
      </button>
    </div>

    <!-- Upload error -->
    <div v-if="uploadError" class="upload-error">{{ uploadError }}</div>

    <!-- Input -->
    <div class="input-bar">
      <SlashCommandPalette
        v-if="showCommandPalette"
        ref="paletteRef"
        :filter="commandFilter"
        @select="onCommandSelect"
      />
      <span class="input-bar__nick">{{ nick || '>' }}</span>
      <input
        ref="inputRef"
        :value="modelValue"
        class="input-bar__input"
        :placeholder="placeholder"
        @input="$emit('update:modelValue', $event.target.value); onInputEvent()"
        @keydown="onKeydown"
      />
      <input
        ref="fileInputRef"
        type="file"
        style="display: none"
        @change="onFileSelected"
      />
      <button class="input-bar__attach" aria-label="Attach file" @click="triggerFileInput">
        <IconPaperclip :size="20" />
      </button>
      <button
        class="input-bar__send"
        aria-label="Send message"
        :class="{ 'input-bar__send--active': modelValue.trim() }"
        @click="$emit('send')"
      >SEND</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { IconReply, IconClose, IconPaperclip } from '@/components/icons'
import SlashCommandPalette from '@/components/shared/SlashCommandPalette.vue'
import { getNickColor } from '@/utils/nickColor'
import { useUsersStore } from '@/stores/users'
import { useChannelsStore } from '@/stores/channels'
import { useSettingsStore } from '@/stores/settings'
import { getClient } from '@/irc/client'
import { useFileUpload } from '@/composables/useFileUpload'

const props = defineProps({
  modelValue: { type: String, default: '' },
  replyTarget: { type: Object, default: null },
  channelName: { type: String, default: '' },
  nick: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue', 'send', 'clearReply'])

const inputRef = ref(null)
const usersStore = useUsersStore()
const channelsStore = useChannelsStore()
const settingsStore = useSettingsStore()
const ircClient = getClient()

// Typing indicator
let lastTypingSent = 0
let typingTimeout = null

function sendTyping(status) {
  if (!settingsStore.sendTypingIndicators) return
  const ch = channelsStore.activeChannel
  if (!ch || !ircClient._capAcked.includes('message-tags')) return
  ircClient.tagmsg(ch, { '+typing': status })
}

function onInputEvent() {
  if (!settingsStore.sendTypingIndicators) return
  const now = Date.now()
  if (now - lastTypingSent > 3000) {
    sendTyping('active')
    lastTypingSent = now
  }
  clearTimeout(typingTimeout)
  typingTimeout = setTimeout(() => sendTyping('done'), 6000)
}

function clearTyping() {
  clearTimeout(typingTimeout)
  if (lastTypingSent > 0) {
    sendTyping('done')
    lastTypingSent = 0
  }
}

onUnmounted(() => {
  clearTimeout(typingTimeout)
  clearTimeout(uploadErrorTimer)
})

// File upload
const { uploading, progress, upload } = useFileUpload()
const fileInputRef = ref(null)
const uploadError = ref('')
let uploadErrorTimer = null

function triggerFileInput() {
  fileInputRef.value?.click()
}

async function onFileSelected(e) {
  const file = e.target.files?.[0]
  if (!file) return
  try {
    const cdnUrl = await upload(file)
    if (cdnUrl) {
      emit('update:modelValue', props.modelValue + (props.modelValue ? ' ' : '') + cdnUrl)
    }
  } catch (err) {
    console.error('[UPLOAD]', err)
    uploadError.value = 'Upload failed'
    clearTimeout(uploadErrorTimer)
    uploadErrorTimer = setTimeout(() => { uploadError.value = '' }, 3000)
  }
  // Reset so same file can be re-selected
  e.target.value = ''
}

// Slash command palette
const paletteRef = ref(null)
const showCommandPalette = computed(() => {
  const v = props.modelValue
  return v.startsWith('/') && !v.includes(' ')
})
const commandFilter = computed(() => props.modelValue.slice(1).toLowerCase())

function onCommandSelect(name) {
  if (name) {
    emit('update:modelValue', `/${name} `)
  }
  inputRef.value?.focus()
}

// DM-aware placeholder
const placeholder = computed(() => {
  if (props.channelName && !props.channelName.startsWith('#')) {
    return `message ${props.channelName}`
  }
  return 'say something...'
})

// Input history
const history = ref([])
const historyIndex = ref(-1)
const pendingInput = ref('')

const replyNickColor = computed(() =>
  props.replyTarget ? getNickColor(props.replyTarget.nick) : ''
)

function onKeydown(e) {
  // Forward to command palette if visible
  if (showCommandPalette.value && paletteRef.value) {
    if (paletteRef.value.onKeydown(e)) return
  }

  // Enter to send
  if (e.key === 'Enter') {
    e.preventDefault()
    if (props.modelValue.trim()) {
      // Save to history
      history.value.unshift(props.modelValue)
      if (history.value.length > 100) history.value.pop()
      historyIndex.value = -1
    }
    clearTyping()
    emit('send')
    return
  }

  // Up arrow - navigate history
  if (e.key === 'ArrowUp') {
    if (historyIndex.value === -1) {
      pendingInput.value = props.modelValue
    }
    if (historyIndex.value < history.value.length - 1) {
      historyIndex.value++
      emit('update:modelValue', history.value[historyIndex.value])
    }
    e.preventDefault()
    return
  }

  // Down arrow - navigate history
  if (e.key === 'ArrowDown') {
    if (historyIndex.value > 0) {
      historyIndex.value--
      emit('update:modelValue', history.value[historyIndex.value])
    } else if (historyIndex.value === 0) {
      historyIndex.value = -1
      emit('update:modelValue', pendingInput.value)
    }
    e.preventDefault()
    return
  }

  // Tab - nick completion
  if (e.key === 'Tab') {
    e.preventDefault()
    completeNick()
    return
  }
}

function completeNick() {
  const val = props.modelValue
  const cursorPos = inputRef.value?.selectionStart || val.length

  // Find the word being typed at cursor
  const beforeCursor = val.slice(0, cursorPos)
  const lastSpace = beforeCursor.lastIndexOf(' ')
  const partial = beforeCursor.slice(lastSpace + 1).toLowerCase()

  if (!partial) return

  // Find matching nicks
  const nicks = usersStore.sortedUsers.map(u => u.nick)
  const matches = nicks.filter(n => n.toLowerCase().startsWith(partial))

  if (matches.length === 0) return

  // Use first match
  const match = matches[0]
  const suffix = lastSpace === -1 ? ': ' : ' '
  const newVal = val.slice(0, lastSpace + 1) + match + suffix + val.slice(cursorPos)
  emit('update:modelValue', newVal)
}

function focus() {
  inputRef.value?.focus()
}

defineExpose({ focus, uploading, progress })
</script>

<style scoped>
.reply-bar {
  padding: 6px 12px;
  border-top: 1px solid var(--q-border);
  background: var(--q-bg-secondary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.reply-bar__nick {
  font-size: var(--q-font-size-sm);
  font-weight: 700;
}

.reply-bar__text {
  color: var(--q-text-dim);
  font-size: var(--q-font-size-sm);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.reply-bar__close {
  background: none;
  border: none;
  color: var(--q-text-muted);
  cursor: pointer;
  padding: 2px;
  display: flex;
}

.input-bar {
  position: relative;
  border-top: 2px solid var(--q-border);
  padding: 8px 12px;
  padding-bottom: max(8px, env(safe-area-inset-bottom));
  background: var(--q-bg-secondary);
  display: flex;
  align-items: center;
  gap: 6px;
}

.input-bar__nick {
  color: var(--q-accent-teal);
  font-size: var(--q-font-size-sm);
  font-weight: 700;
  flex-shrink: 0;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding-right: 8px;
  border-right: 1px solid var(--q-border-strong);
  margin-right: 2px;
}

.input-bar__input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: var(--q-text-primary);
  font-size: var(--q-font-size-md);
  font-family: var(--q-font-mono);
  padding: 8px 0;
}

.input-bar__attach {
  background: none;
  border: none;
  cursor: pointer;
  padding: 12px;
  display: flex;
  align-items: center;
  min-width: 44px;
  min-height: 44px;
  justify-content: center;
}

.input-bar__send {
  background: var(--q-border);
  border: none;
  color: var(--q-text-muted);
  padding: 12px 16px;
  min-height: 44px;
  cursor: pointer;
  font-family: var(--q-font-mono);
  font-size: var(--q-font-size-sm);
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  transition: all 0.15s;
}

.input-bar__send--active {
  background: var(--q-accent-orange);
  color: var(--q-text-on-accent);
}

.upload-error {
  padding: 4px 12px;
  background: rgba(255, 46, 99, 0.12);
  color: var(--q-accent-pink);
  font-size: var(--q-font-size-xs);
  text-align: center;
}
</style>
