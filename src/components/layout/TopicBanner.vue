<template>
  <div v-if="topic" class="topic-banner" @click="$emit('openInfo')">
    <IconInfo :size="16" />
    <span class="topic-banner__text">{{ topic }}</span>
  </div>
</template>

<script setup>
import { IconInfo } from '@/components/icons'

defineProps({
  topic: { type: String, default: '' },
})

defineEmits(['openInfo'])
</script>

<style scoped>
.topic-banner {
  flex-shrink: 0;
  padding: 8px 16px;
  border-bottom: 1px solid var(--q-border);
  background: var(--q-bg-secondary);
  display: flex;
  align-items: flex-start;
  gap: 8px;
  cursor: pointer;
}

.topic-banner:hover {
  background: var(--q-bg-hover);
}

.topic-banner__text {
  color: var(--q-text-secondary);
  font-size: var(--q-font-size-sm);
  line-height: 1.5;
  word-break: break-word;
}
</style>
