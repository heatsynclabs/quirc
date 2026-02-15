<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10.5" cy="10.5" r="6" :stroke="color" stroke-width="2" />
    <line x1="15" y1="15" x2="20" y2="20" :stroke="color" stroke-width="2" stroke-linecap="square" />
  </svg>
</template>

<script setup>
defineProps({
  size: { type: Number, default: 18 },
  color: { type: String, default: 'var(--q-text-muted)' },
})
</script>
