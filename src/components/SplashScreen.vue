<template>
  <div class="splash" :class="{ 'splash--out': phase === 'out' }" @click="skip" @keydown="skip" tabindex="0" ref="splashRef">
    <!-- Scanline sweep -->
    <div class="splash__scanline" :class="{ 'splash__scanline--visible': phase === 'logo' }" />

    <!-- Logo canvas -->
    <div class="splash__logo" :class="{ 'splash__logo--glitch': phase === 'logo' }">
      <SplashLogo />
    </div>

    <!-- Connection status -->
    <div class="splash__status" :class="{ 'splash__status--visible': phase !== 'logo' }">
      <span class="splash__dot" />
      {{ statusText }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import SplashLogo from '@/components/logo/SplashLogo.vue'
import { useConnectionStore } from '@/stores/connection'

const emit = defineEmits(['done'])
const connection = useConnectionStore()

const phase = ref('logo')
const splashRef = ref(null)
let t1, t2
let skipped = false

function skip() {
  if (skipped) return
  skipped = true
  clearTimeout(t1)
  clearTimeout(t2)
  emit('done')
}

const statusText = computed(() => {
  if (connection.isConfigured) {
    return `connecting to ${connection.displayHost}...`
  }
  return 'welcome to QUIRC'
})

onMounted(() => {
  splashRef.value?.focus()
  t1 = setTimeout(() => { phase.value = 'out' }, 2200)
  t2 = setTimeout(() => { emit('done') }, 2800)
})

onUnmounted(() => {
  clearTimeout(t1)
  clearTimeout(t2)
})
</script>

<style scoped>
.splash {
  height: 100dvh;
  background: var(--q-bg-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 24px;
  font-family: var(--q-font-mono);
  opacity: 1;
  transition: opacity 0.5s ease;
  cursor: pointer;
  outline: none;
}

.splash--out {
  opacity: 0;
}

.splash__scanline {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(234, 255, 0, 0.27), transparent);
  animation: qScanDown 2s ease-in-out;
  opacity: 0;
  pointer-events: none;
}

.splash__scanline--visible {
  opacity: 0.6;
}

.splash__logo--glitch {
  animation: qGlitch 0.1s ease 1.5s 3;
}

.splash__status {
  font-size: var(--q-font-size-sm);
  color: var(--q-text-ghost);
  opacity: 0;
  transition: opacity 0.3s ease 0.3s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.splash__status--visible {
  opacity: 1;
}

.splash__dot {
  width: 6px;
  height: 6px;
  background: var(--q-accent-teal);
  animation: qBlink 1s ease infinite;
}

@keyframes qGlitch {
  0%, 100% { transform: translate(0); }
  20% { transform: translate(-2px, 1px); }
  40% { transform: translate(2px, -1px); }
  60% { transform: translate(-1px, -2px); }
  80% { transform: translate(1px, 2px); }
}

@keyframes qBlink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

@keyframes qScanDown {
  from { transform: translateY(-100%); }
  to { transform: translateY(100vh); }
}
</style>
