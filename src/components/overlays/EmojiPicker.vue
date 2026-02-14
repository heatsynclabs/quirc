<template>
  <div class="emoji-picker">
    <button
      v-for="e in emojis"
      :key="e"
      class="emoji-picker__btn"
      @click="$emit('pick', e)"
    >{{ e }}</button>
  </div>
</template>

<script setup>
defineEmits(['pick'])

const emojis = ['\u{1F44D}', '\u{1F44E}', '\u{1F525}', '\u{1F480}', '\u{1F389}', '\u{1F355}', '\u2764\uFE0F', '\u{1F602}', '\u{1F914}', '\u26A1']
</script>

<style scoped>
.emoji-picker {
  position: absolute;
  bottom: 100%;
  right: 0;
  margin-bottom: 4px;
  background: var(--q-bg-elevated);
  border: 1px solid var(--q-border-strong);
  padding: 8px;
  display: flex;
  gap: 2px;
  flex-wrap: wrap;
  width: 200px;
  z-index: 50;
}

.emoji-picker__btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  padding: 4px;
}

.emoji-picker__btn:hover {
  background: var(--q-bg-hover);
}
</style>
