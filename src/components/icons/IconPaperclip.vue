<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 11L12.5 19.5C10.0147 21.9853 6.01472 21.9853 3.5 19.5C0.985281 17.0147 0.985281 13.0147 3.5 10.5L12 2C13.6569 0.343146 16.3431 0.343146 18 2C19.6569 3.65685 19.6569 6.34315 18 8L9.5 16.5C8.67157 17.3284 7.32843 17.3284 6.5 16.5C5.67157 15.6716 5.67157 14.3284 6.5 13.5L14 6" :stroke="color" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter" />
  </svg>
</template>

<script setup>
defineProps({
  size: { type: Number, default: 24 },
  color: { type: String, default: 'var(--q-text-muted)' },
})
</script>
