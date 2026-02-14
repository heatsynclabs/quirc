<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M10.5 3h3l.5 3 2-1 2.12 2.12-1 2 3 .5v3l-3 .5 1 2-2.12 2.12-2-1-.5 3h-3l-.5-3-2 1-2.12-2.12 1-2-3-.5v-3l3-.5-1-2L6.38 4.62l2 1z"
      :stroke="color"
      stroke-width="1.8"
      stroke-linecap="square"
      stroke-linejoin="miter"
    />
    <rect x="9.5" y="9.5" width="5" height="5" :stroke="color" stroke-width="1.8" />
  </svg>
</template>

<script setup>
defineProps({
  size: { type: Number, default: 24 },
  color: { type: String, default: 'currentColor' },
})
</script>
