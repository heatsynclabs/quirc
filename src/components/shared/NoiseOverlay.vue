<template>
  <div class="noise" />
</template>

<style scoped>
.noise {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
  opacity: 0.035;
  background-image: url('/noise.svg');
}
</style>
