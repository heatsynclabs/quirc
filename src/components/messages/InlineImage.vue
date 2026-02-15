<template>
  <div class="inline-img">
    <div v-if="errored" class="inline-img__placeholder inline-img__placeholder--error">
      <div class="inline-img__label">IMAGE FAILED</div>
      <button class="inline-img__retry" @click="retry">retry</button>
    </div>
    <div v-else-if="!loaded" class="inline-img__placeholder">
      <div class="inline-img__icon">
        <IconPaperclip :size="20" color="var(--q-accent-blue)" />
      </div>
      <div class="inline-img__label">LOADING</div>
    </div>
    <img
      v-if="!errored"
      v-show="loaded"
      :src="imgSrc"
      class="inline-img__img"
      referrerpolicy="no-referrer"
      crossorigin="anonymous"
      loading="lazy"
      @load="loaded = true"
      @error="onError"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { IconPaperclip } from '@/components/icons'

const props = defineProps({
  url: { type: String, required: true },
})

const loaded = ref(false)
const errored = ref(false)
const imgSrc = ref(props.url)

function onError() {
  if (!loaded.value) {
    errored.value = true
  }
}

function retry() {
  errored.value = false
  loaded.value = false
  // Append cache-buster to force reload
  const sep = props.url.includes('?') ? '&' : '?'
  imgSrc.value = `${props.url}${sep}_r=${Date.now()}`
}
</script>

<style scoped>
.inline-img {
  margin: 6px 0;
}

.inline-img__placeholder {
  width: 260px;
  height: 140px;
  background: var(--q-bg-secondary);
  border: 1px solid var(--q-border);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 6px;
}

.inline-img__placeholder--error {
  border-color: var(--q-accent-pink);
}

.inline-img__label {
  font-size: var(--q-font-size-xs);
  color: var(--q-accent-blue);
  letter-spacing: 2px;
}

.inline-img__placeholder--error .inline-img__label {
  color: var(--q-accent-pink);
}

.inline-img__retry {
  background: none;
  border: 1px solid var(--q-border-strong);
  color: var(--q-text-muted);
  font-family: var(--q-font-mono);
  font-size: var(--q-font-size-xs);
  padding: 3px 12px;
  cursor: pointer;
  letter-spacing: 1px;
}

.inline-img__retry:hover {
  border-color: var(--q-accent-teal);
  color: var(--q-accent-teal);
}

.inline-img__img {
  max-width: 340px;
  max-height: 300px;
  border: 1px solid var(--q-border);
  display: block;
}
</style>
