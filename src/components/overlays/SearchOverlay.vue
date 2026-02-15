<template>
  <div v-if="open" class="search" role="dialog" aria-modal="true" aria-label="Search messages">
    <div class="search__header">
      <IconSearch :size="18" color="var(--q-accent-orange)" />
      <input
        ref="inputRef"
        v-model="query"
        class="search__input"
        placeholder="search messages..."
      />
      <button class="search__close" @click="$emit('close')">ESC</button>
    </div>
    <div class="search__results">
      <div v-if="query.length > 1 && !results.length" class="search__empty">no results</div>
      <div
        v-for="m in results"
        :key="m.id"
        class="search__item"
      >
        <span class="search__item-time">{{ m.time }} </span>
        <span class="search__item-nick" :style="{ color: getNickColor(m.nick) }">{{ m.nick }}</span>
        <div class="search__item-text">{{ m.text.slice(0, 120) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { IconSearch } from '@/components/icons'
import { getNickColor } from '@/utils/nickColor'

const props = defineProps({
  open: { type: Boolean, default: false },
  messages: { type: Array, default: () => [] },
})

defineEmits(['close'])

const query = ref('')
const inputRef = ref(null)

watch(() => props.open, (val) => {
  if (val) {
    query.value = ''
    nextTick(() => {
      setTimeout(() => inputRef.value?.focus(), 100)
    })
  }
})

const results = computed(() => {
  if (query.value.length < 2) return []
  const q = query.value.toLowerCase()
  return props.messages.filter(m => !m.type && m.text.toLowerCase().includes(q))
})
</script>

<style scoped>
.search {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: var(--q-backdrop-heavy);
  display: flex;
  flex-direction: column;
}

.search__header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-bottom: 2px solid var(--q-border-strong);
}

.search__input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: var(--q-text-primary);
  font-size: var(--q-font-size-md);
  font-family: var(--q-font-mono);
}

.search__close {
  background: none;
  border: 1px solid var(--q-border-strong);
  color: var(--q-text-secondary);
  padding: 4px 10px;
  cursor: pointer;
  font-family: var(--q-font-mono);
  font-size: var(--q-font-size-sm);
}

.search__results {
  flex: 1;
  overflow-y: auto;
}

.search__empty {
  padding: 20px;
  color: var(--q-text-dim);
  font-size: 12px;
  text-align: center;
}

.search__item {
  padding: 8px 16px;
  border-bottom: 1px solid var(--q-border);
}

.search__item-time {
  color: var(--q-text-dim);
  font-size: var(--q-font-size-xs);
}

.search__item-nick {
  font-size: 12px;
  font-weight: 700;
}

.search__item-text {
  color: var(--q-text-secondary);
  font-size: 12px;
  margin-top: 2px;
}
</style>
