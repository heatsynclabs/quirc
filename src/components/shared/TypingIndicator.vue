<template>
  <div v-if="nicks.length" class="typing">
    <span class="typing__dots">
      <span v-for="i in 3" :key="i" class="typing__dot" :style="{ animationDelay: `${(i - 1) * 0.15}s` }" />
    </span>
    {{ nicks.join(', ') }} {{ nicks.length === 1 ? 'is' : 'are' }} typing
  </div>
</template>

<script setup>
defineProps({
  nicks: { type: Array, default: () => [] },
})
</script>

<style scoped>
.typing {
  padding: 4px 16px;
  font-size: var(--q-font-size-sm);
  color: var(--q-text-dim);
  font-style: italic;
  display: flex;
  align-items: center;
  gap: 6px;
}

.typing__dots {
  display: inline-flex;
  gap: 2px;
}

.typing__dot {
  width: 4px;
  height: 4px;
  background: var(--q-text-muted);
  animation: qDot 1s ease infinite;
}

@keyframes qDot {
  0%, 80%, 100% { opacity: 0.3; }
  40% { opacity: 1; }
}
</style>
