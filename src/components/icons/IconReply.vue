<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 5L4 11L10 17" :stroke="color" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter" />
    <path d="M4 11H15C17.7614 11 20 13.2386 20 16V19" :stroke="color" stroke-width="2" stroke-linecap="square" />
  </svg>
</template>

<script setup>
defineProps({
  size: { type: Number, default: 16 },
  color: { type: String, default: 'var(--q-text-secondary)' },
})
</script>
