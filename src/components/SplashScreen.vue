<template>
  <div class="splash" :class="{ 'splash--out': phase === 'out' }">
    <!-- Scanline sweep -->
    <div class="splash__scanline" :class="{ 'splash__scanline--visible': phase === 'logo' }" />

    <!-- Logo canvas -->
    <div class="splash__logo" :class="{ 'splash__logo--glitch': phase === 'logo' }">
      <SplashLogo />
    </div>

    <!-- Wordmark -->
    <div class="splash__wordmark" :class="{ 'splash__wordmark--visible': phase !== 'logo' }">
      <div class="splash__title">
        <span
          v-for="(ch, i) in 'QUIRC'.split('')"
          :key="i"
          class="splash__letter"
          :class="{
            'splash__letter--animate': phase !== 'logo',
            'splash__letter--pink': i < 2,
            'splash__letter--teal': i === 4,
          }"
          :style="{ animationDelay: phase !== 'logo' ? `${i * 0.06}s` : undefined }"
        >{{ ch }}</span>
      </div>
      <div
        class="splash__subtitle"
        :class="{ 'splash__subtitle--animate': phase !== 'logo' }"
      >QUICK IRC</div>
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
let t1, t2, t3

const statusText = computed(() => {
  if (connection.isConfigured) {
    return `connecting to ${connection.displayHost}...`
  }
  return 'welcome to QUIRC'
})

onMounted(() => {
  t1 = setTimeout(() => { phase.value = 'text' }, 1800)
  t2 = setTimeout(() => { phase.value = 'out' }, 3400)
  t3 = setTimeout(() => { emit('done') }, 4000)
})

onUnmounted(() => {
  clearTimeout(t1)
  clearTimeout(t2)
  clearTimeout(t3)
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
  gap: 20px;
  font-family: var(--q-font-mono);
  opacity: 1;
  transition: opacity 0.5s ease;
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

.splash__wordmark {
  opacity: 0;
  transform: translateY(12px);
  transition: all 0.4s ease;
  text-align: center;
}

.splash__wordmark--visible {
  opacity: 1;
  transform: translateY(0);
}

.splash__title {
  font-size: 48px;
  font-weight: 800;
  color: #fff;
  letter-spacing: 8px;
  line-height: 1;
}

.splash__letter {
  display: inline-block;
}

.splash__letter--animate {
  animation: qFadeUp 0.3s ease both;
}

.splash__letter--pink {
  color: var(--q-accent-pink);
}

.splash__letter--teal {
  color: var(--q-accent-teal);
}

.splash__subtitle {
  font-size: var(--q-font-size-xs);
  letter-spacing: 6px;
  color: var(--q-text-ghost);
  margin-top: 8px;
}

.splash__subtitle--animate {
  animation: qFadeUp 0.3s ease 0.4s both;
}

.splash__status {
  font-size: var(--q-font-size-sm);
  color: var(--q-text-ghost);
  opacity: 0;
  transition: opacity 0.3s ease 0.6s;
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

@keyframes qFadeUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
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
