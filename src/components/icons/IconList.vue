<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="8" y1="6" x2="21" y2="6" :stroke="color" stroke-width="2" stroke-linecap="square" />
    <line x1="8" y1="12" x2="21" y2="12" :stroke="color" stroke-width="2" stroke-linecap="square" />
    <line x1="8" y1="18" x2="21" y2="18" :stroke="color" stroke-width="2" stroke-linecap="square" />
    <line x1="3" y1="6" x2="3" y2="6" :stroke="color" stroke-width="3" stroke-linecap="square" />
    <line x1="3" y1="12" x2="3" y2="12" :stroke="color" stroke-width="3" stroke-linecap="square" />
    <line x1="3" y1="18" x2="3" y2="18" :stroke="color" stroke-width="3" stroke-linecap="square" />
  </svg>
</template>

<script setup>
defineProps({
  size: { type: Number, default: 16 },
  color: { type: String, default: 'var(--q-text-dim)' },
})
</script>
