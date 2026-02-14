<template>
  <div class="reply-ctx" :style="{ borderLeftColor: nickColor }">
    <span class="reply-ctx__nick" :style="{ color: nickColor }">{{ nick }}</span>
    {{ text }}
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { getNickColor } from '@/utils/nickColor'

const props = defineProps({
  nick: { type: String, required: true },
  text: { type: String, required: true },
})

const nickColor = computed(() => getNickColor(props.nick))
</script>

<style scoped>
.reply-ctx {
  border-left: 2px solid;
  padding: 2px 8px;
  margin-bottom: 4px;
  font-size: var(--q-font-size-sm);
  color: var(--q-text-muted);
}

.reply-ctx__nick {
  font-weight: 700;
}
</style>
