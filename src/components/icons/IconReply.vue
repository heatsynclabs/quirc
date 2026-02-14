<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 4L4 10L10 16" :stroke="color" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter" />
    <path d="M4 10H16C18.2091 10 20 11.7909 20 14V20" :stroke="color" stroke-width="2" stroke-linecap="square" />
  </svg>
</template>

<script setup>
defineProps({
  size: { type: Number, default: 24 },
  color: { type: String, default: 'var(--q-text-secondary)' },
})
</script>
