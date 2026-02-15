<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="12" y1="5" x2="12" y2="19" :stroke="color" stroke-width="2" stroke-linecap="square" />
    <line x1="5" y1="12" x2="19" y2="12" :stroke="color" stroke-width="2" stroke-linecap="square" />
  </svg>
</template>

<script setup>
defineProps({
  size: { type: Number, default: 16 },
  color: { type: String, default: 'var(--q-text-secondary)' },
})
</script>
