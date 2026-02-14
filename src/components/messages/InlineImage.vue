<template>
  <div class="inline-img">
    <div v-if="!loaded" class="inline-img__placeholder">
      <div class="inline-img__icon">
        <IconPaperclip :size="20" color="var(--q-accent-blue)" />
      </div>
      <div class="inline-img__label">LOADING</div>
    </div>
    <img
      v-show="loaded"
      :src="url"
      class="inline-img__img"
      @load="loaded = true"
      @error="loaded = true"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { IconPaperclip } from '@/components/icons'

defineProps({
  url: { type: String, required: true },
})

const loaded = ref(false)
</script>

<style scoped>
.inline-img {
  margin: 6px 0;
}

.inline-img__placeholder {
  width: 260px;
  height: 140px;
  background: linear-gradient(135deg, #0a0a14, #101028, #0a1a30);
  border: 1px solid var(--q-border);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 6px;
}

.inline-img__label {
  font-size: var(--q-font-size-xs);
  color: var(--q-accent-blue);
  letter-spacing: 2px;
}

.inline-img__img {
  max-width: 340px;
  max-height: 300px;
  border: 1px solid var(--q-border);
  display: block;
}
</style>
