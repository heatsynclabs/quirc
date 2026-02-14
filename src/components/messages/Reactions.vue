<template>
  <div class="reactions">
    <button
      v-for="(r, i) in reactions"
      :key="i"
      class="reactions__badge"
      @click="$emit('react', r.emoji)"
    >
      <span>{{ r.emoji }}</span>
      <span class="reactions__count">{{ r.count }}</span>
    </button>
  </div>
</template>

<script setup>
defineProps({
  reactions: { type: Array, required: true },
})

defineEmits(['react'])
</script>

<style scoped>
.reactions {
  display: flex;
  gap: 4px;
  margin-top: 4px;
  flex-wrap: wrap;
}

.reactions__badge {
  background: var(--q-bg-elevated);
  border: 1px solid var(--q-border);
  padding: 1px 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--q-text-secondary);
  font-family: var(--q-font-mono);
}

.reactions__badge:hover {
  border-color: var(--q-border-strong);
}

.reactions__count {
  font-size: var(--q-font-size-xs);
}
</style>
