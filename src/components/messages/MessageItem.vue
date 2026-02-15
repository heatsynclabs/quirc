<template>
  <SystemMessage v-if="message.type === 'system'" :time="message.time" :text="message.text" :subtype="message.subtype" />
  <div
    v-else-if="message.isAction"
    class="msg msg--action"
    :class="{ 'msg--hover': hover }"
    @mouseenter="hover = true"
    @mouseleave="hover = false"
  >
    <div class="msg__action-text">
      <span v-if="settings.showTimestamps" class="msg__time">{{ message.time }}</span>
      * <span class="msg__nick" :style="{ color: nickColor }">{{ message.nick }}</span> {{ message.text }}
    </div>
  </div>
  <div
    v-else
    class="msg"
    :class="{ 'msg--hover': hover }"
    @mouseenter="hover = true"
    @mouseleave="hover = false; emojiOpen = false"
    @touchstart="onTouchStart"
    @touchend="onTouchEnd"
  >
    <ReplyContext v-if="message.replyTo" :nick="message.replyTo.nick" :text="message.replyTo.text" />

    <div class="msg__header">
      <span v-if="settings.showTimestamps" class="msg__time">{{ message.time }}</span>
      <span class="msg__nick" :style="{ color: nickColor }">{{ message.nick }}</span>
    </div>

    <div class="msg__body">
      <RichText :text="message.text" />
    </div>

    <LinkPreview
      v-if="message.linkPreview && settings.linkPreviews"
      :domain="message.linkPreview.domain"
      :title="message.linkPreview.title"
      :description="message.linkPreview.description"
    />

    <InlineImage v-if="message.hasImage && settings.inlineImages" :url="message.imageUrl" />

    <Reactions
      v-if="message.reactions?.length"
      :reactions="message.reactions"
      @react="onReact"
    />

    <!-- Hover actions -->
    <div v-if="hover" class="msg__actions">
      <button class="msg__action-btn" @click="$emit('reply', message)">
        <IconReply :size="18" />
      </button>
      <div class="msg__emoji-wrap">
        <button class="msg__action-btn" @click="emojiOpen = !emojiOpen">
          <IconPlus :size="18" />
        </button>
        <EmojiPicker
          v-if="emojiOpen"
          @pick="onEmojiPick"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { getNickColor } from '@/utils/nickColor'
import { useSettingsStore } from '@/stores/settings'
import { IconReply, IconPlus } from '@/components/icons'
import SystemMessage from './SystemMessage.vue'
import ReplyContext from './ReplyContext.vue'
import RichText from './RichText.vue'
import LinkPreview from './LinkPreview.vue'
import InlineImage from './InlineImage.vue'
import Reactions from './Reactions.vue'
import EmojiPicker from '@/components/overlays/EmojiPicker.vue'

const props = defineProps({
  message: { type: Object, required: true },
})

const emit = defineEmits(['reply', 'react'])

const settings = useSettingsStore()
const hover = ref(false)
const emojiOpen = ref(false)
let touchTimer = null

const nickColor = computed(() => {
  if (!props.message.nick) return ''
  return settings.coloredNicks ? getNickColor(props.message.nick) : 'var(--q-text-secondary)'
})

function onReact(emoji) {
  emit('react', props.message.id, emoji)
}

function onEmojiPick(emoji) {
  emit('react', props.message.id, emoji)
  emojiOpen.value = false
}

function onTouchStart() {
  touchTimer = setTimeout(() => { hover.value = true }, 400)
}

function onTouchEnd() {
  clearTimeout(touchTimer)
}

onUnmounted(() => {
  clearTimeout(touchTimer)
})
</script>

<style scoped>
.msg {
  padding: 6px 16px;
  font-size: var(--q-font-size-base);
  line-height: 1.5;
  position: relative;
}

.msg--hover {
  background: var(--q-bg-hover);
}

.msg--action .msg__action-text {
  font-style: italic;
  color: var(--q-text-secondary);
}

.msg__header {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.msg__time {
  color: var(--q-text-dim);
  font-size: var(--q-font-size-xs);
  flex-shrink: 0;
}

.msg__nick {
  font-weight: 700;
  font-size: 12px;
  flex-shrink: 0;
}

.msg__body {
  color: var(--q-text-primary);
  margin-top: 1px;
  word-break: break-word;
  overflow-wrap: break-word;
}

.msg__actions {
  position: absolute;
  top: 4px;
  right: 12px;
  display: flex;
  gap: 2px;
}

.msg__action-btn {
  background: var(--q-bg-elevated);
  border: 1px solid var(--q-border-strong);
  color: var(--q-text-secondary);
  padding: 2px 6px;
  cursor: pointer;
  font-size: var(--q-font-size-xs);
  font-family: var(--q-font-mono);
  display: flex;
  align-items: center;
}

.msg__action-btn:hover {
  border-color: var(--q-text-muted);
}

.msg__emoji-wrap {
  position: relative;
}
</style>
