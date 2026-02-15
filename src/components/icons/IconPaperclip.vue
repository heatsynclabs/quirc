<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M21.44 11.05L12.25 20.24C10.01 22.48 6.37 22.48 4.13 20.24C1.89 18 1.89 14.36 4.13 12.12L13.33 2.93C14.79 1.47 17.15 1.47 18.61 2.93C20.07 4.39 20.07 6.75 18.61 8.21L9.41 17.41C8.68 18.14 7.5 18.14 6.77 17.41C6.04 16.68 6.04 15.5 6.77 14.77L15.97 5.58"
      :stroke="color"
      stroke-width="2"
      stroke-linecap="square"
      stroke-linejoin="miter"
    />
  </svg>
</template>

<script setup>
defineProps({
  size: { type: Number, default: 18 },
  color: { type: String, default: 'var(--q-text-muted)' },
})
</script>
