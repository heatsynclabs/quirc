<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    :style="{ transform: `rotate(${rotation}deg)`, transition: 'transform 0.15s ease' }"
  >
    <path d="M6 9L12 15L18 9" :stroke="color" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter" />
  </svg>
</template>

<script setup>
defineProps({
  size: { type: Number, default: 16 },
  color: { type: String, default: 'var(--q-text-dim)' },
  rotation: { type: Number, default: 0 },
})
</script>
