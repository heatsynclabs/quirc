<template>
  <div v-if="visible" class="upload-toast">
    <div class="upload-toast__label">UPLOADING</div>
    <div class="upload-toast__bar">
      <div class="upload-toast__progress" :style="{ width: `${progress}%` }" />
    </div>
    <div class="upload-toast__pct">{{ progress }}%</div>
  </div>
</template>

<script setup>
defineProps({
  visible: { type: Boolean, default: false },
  progress: { type: Number, default: 0 },
})
</script>

<style scoped>
.upload-toast {
  position: fixed;
  bottom: 80px;
  left: 16px;
  right: 16px;
  background: var(--q-bg-elevated);
  border: 1px solid var(--q-border-strong);
  padding: 12px;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 12px;
}

.upload-toast__label {
  font-size: var(--q-font-size-xs);
  color: var(--q-accent-orange);
  letter-spacing: 2px;
}

.upload-toast__bar {
  flex: 1;
  height: 4px;
  background: var(--q-border);
}

.upload-toast__progress {
  height: 100%;
  background: var(--q-accent-teal);
  transition: width 0.2s;
}

.upload-toast__pct {
  font-size: var(--q-font-size-xs);
  color: var(--q-text-muted);
  min-width: 30px;
  text-align: right;
}
</style>
