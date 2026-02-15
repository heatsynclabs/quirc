<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="9" :stroke="color" stroke-width="2" />
    <line x1="12" y1="16" x2="12" y2="12" :stroke="color" stroke-width="2" stroke-linecap="square" />
    <line x1="12" y1="8" x2="12" y2="8" :stroke="color" stroke-width="2" stroke-linecap="square" />
  </svg>
</template>

<script setup>
defineProps({
  size: { type: Number, default: 16 },
  color: { type: String, default: 'var(--q-accent-teal)' },
})
</script>
