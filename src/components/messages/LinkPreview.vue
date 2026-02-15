<template>
  <div class="link-preview">
    <div class="link-preview__domain">{{ domain }}</div>
    <div class="link-preview__title">{{ title }}</div>
    <div v-if="description" class="link-preview__desc">{{ description }}</div>
  </div>
</template>

<script setup>
defineProps({
  domain: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
})
</script>

<style scoped>
.link-preview {
  margin: 6px 0;
  padding: 8px 10px;
  border-left: 3px solid var(--q-accent-teal);
  background: var(--q-bg-elevated);
  max-width: 340px;
}

.link-preview__domain {
  font-size: var(--q-font-size-xs);
  color: var(--q-text-muted);
  margin-bottom: 3px;
}

.link-preview__title {
  font-size: 12px;
  color: var(--q-text-primary);
  font-weight: 700;
  margin-bottom: 2px;
}

.link-preview__desc {
  font-size: var(--q-font-size-sm);
  color: var(--q-text-secondary);
}
</style>
