<template>
  <div class="codeblock">{{ code }}</div>
</template>

<script setup>
defineProps({
  code: { type: String, required: true },
})
</script>

<style scoped>
.codeblock {
  background: var(--q-bg-primary);
  border: 1px solid var(--q-border);
  border-left: 3px solid var(--q-border-strong);
  padding: 10px 12px;
  margin: 6px 0;
  font-size: 12px;
  font-family: var(--q-font-mono);
  color: var(--q-accent-green);
  white-space: pre;
  overflow-x: auto;
  line-height: 1.6;
}
</style>
