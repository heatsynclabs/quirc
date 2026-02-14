<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="6" y1="6" x2="18" y2="18" :stroke="color" stroke-width="2" stroke-linecap="square" />
    <line x1="18" y1="6" x2="6" y2="18" :stroke="color" stroke-width="2" stroke-linecap="square" />
  </svg>
</template>

<script setup>
defineProps({
  size: { type: Number, default: 24 },
  color: { type: String, default: 'var(--q-text-muted)' },
})
</script>
