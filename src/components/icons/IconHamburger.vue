<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="4" y1="7" x2="20" y2="7" :stroke="color" stroke-width="2" stroke-linecap="square" />
    <line x1="4" y1="12" x2="20" y2="12" :stroke="color" stroke-width="2" stroke-linecap="square" />
    <line x1="4" y1="17" x2="20" y2="17" :stroke="color" stroke-width="2" stroke-linecap="square" />
  </svg>
</template>

<script setup>
defineProps({
  size: { type: Number, default: 20 },
  color: { type: String, default: 'var(--q-accent-orange)' },
})
</script>
