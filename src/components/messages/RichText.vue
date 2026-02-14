<template>
  <span>
    <template v-for="(part, i) in parts" :key="i">
      <CodeBlock v-if="part.type === 'code'" :code="part.value" />
      <template v-else>
        <template v-for="(seg, j) in part.segments" :key="j">
          <code v-if="seg.type === 'inline'" class="rich-inline">{{ seg.value }}</code>
          <span v-else>{{ seg.value }}</span>
        </template>
      </template>
    </template>
  </span>
</template>

<script setup>
import { computed } from 'vue'
import CodeBlock from './CodeBlock.vue'

const props = defineProps({
  text: { type: String, required: true },
})

const parts = computed(() => {
  const result = []
  const re = /```([\s\S]*?)```/g
  let last = 0
  let m

  while ((m = re.exec(props.text)) !== null) {
    if (m.index > last) {
      result.push({ type: 'text', value: props.text.slice(last, m.index), segments: parseInline(props.text.slice(last, m.index)) })
    }
    result.push({ type: 'code', value: m[1].trim() })
    last = m.index + m[0].length
  }

  if (last < props.text.length) {
    result.push({ type: 'text', value: props.text.slice(last), segments: parseInline(props.text.slice(last)) })
  }

  return result
})

function parseInline(text) {
  const segments = []
  const parts = text.split(/(`[^`]+`)/g)
  for (const s of parts) {
    if (s.startsWith('`') && s.endsWith('`')) {
      segments.push({ type: 'inline', value: s.slice(1, -1) })
    } else if (s) {
      segments.push({ type: 'plain', value: s })
    }
  }
  return segments
}
</script>

<style scoped>
.rich-inline {
  background: #111;
  padding: 1px 5px;
  border: 1px solid var(--q-border);
  font-size: 12px;
  color: var(--q-accent-orange);
  font-family: var(--q-font-mono);
}
</style>
