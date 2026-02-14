<template>
  <div class="sys-msg">
    <span class="sys-msg__time">{{ time }}</span> {{ text }}
  </div>
</template>

<script setup>
defineProps({
  time: { type: String, required: true },
  text: { type: String, required: true },
})
</script>

<style scoped>
.sys-msg {
  padding: 3px 16px;
  font-size: var(--q-font-size-sm);
  color: var(--q-text-dim);
  font-style: italic;
}

.sys-msg__time {
  color: var(--q-text-muted);
}
</style>
