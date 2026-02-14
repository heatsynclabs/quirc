<template>
  <div v-if="filtered.length" ref="listRef" class="cmd-palette">
    <div
      v-for="(cmd, i) in filtered"
      :key="cmd.name"
      class="cmd-palette__item"
      :class="{ 'cmd-palette__item--active': i === activeIndex }"
      @mousedown.prevent="select(cmd)"
    >
      <div class="cmd-palette__main">
        <span class="cmd-palette__name">/{{ cmd.name }}</span>
        <span v-if="cmd.args" class="cmd-palette__args">{{ cmd.args }}</span>
        <span class="cmd-palette__desc">{{ cmd.desc }}</span>
      </div>
      <div v-if="cmd.example && i === activeIndex" class="cmd-palette__example">{{ cmd.example }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { COMMANDS } from '@/irc/commands'

const props = defineProps({
  filter: { type: String, default: '' },
})

const emit = defineEmits(['select'])

const listRef = ref(null)
const activeIndex = ref(0)

const filtered = computed(() => {
  const q = props.filter.toLowerCase()
  if (!q) return COMMANDS
  return COMMANDS.filter(cmd =>
    cmd.name.startsWith(q) ||
    cmd.aliases.some(a => a.startsWith(q))
  )
})

watch(() => props.filter, () => {
  activeIndex.value = 0
})

function select(cmd) {
  emit('select', cmd.name)
}

function scrollToActive() {
  nextTick(() => {
    const el = listRef.value?.children[activeIndex.value]
    if (el) el.scrollIntoView({ block: 'nearest' })
  })
}

function onKeydown(e) {
  if (!filtered.value.length) return false

  if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeIndex.value = activeIndex.value > 0
      ? activeIndex.value - 1
      : filtered.value.length - 1
    scrollToActive()
    return true
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    activeIndex.value = activeIndex.value < filtered.value.length - 1
      ? activeIndex.value + 1
      : 0
    scrollToActive()
    return true
  }
  if (e.key === 'Enter' || e.key === 'Tab') {
    e.preventDefault()
    select(filtered.value[activeIndex.value])
    return true
  }
  if (e.key === 'Escape') {
    e.preventDefault()
    emit('select', null)
    return true
  }
  return false
}

defineExpose({ onKeydown })
</script>

<style scoped>
.cmd-palette {
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  background: var(--q-bg-primary);
  border: 2px solid var(--q-border-strong);
  border-bottom: none;
  max-height: 280px;
  overflow-y: auto;
  z-index: 50;
}

.cmd-palette__item {
  padding: 8px 12px;
  cursor: pointer;
  border-bottom: 1px solid var(--q-border);
}

.cmd-palette__item:last-child {
  border-bottom: none;
}

.cmd-palette__item:hover,
.cmd-palette__item--active {
  background: var(--q-bg-hover);
}

.cmd-palette__main {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.cmd-palette__name {
  color: var(--q-accent-teal);
  font-family: var(--q-font-mono);
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
}

.cmd-palette__args {
  color: var(--q-text-muted);
  font-family: var(--q-font-mono);
  font-size: 12px;
  flex-shrink: 0;
}

.cmd-palette__desc {
  color: var(--q-text-dim);
  font-size: 12px;
  margin-left: auto;
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cmd-palette__example {
  font-size: 11px;
  color: var(--q-text-ghost);
  font-family: var(--q-font-mono);
  margin-top: 2px;
  padding-left: 2px;
}
</style>
