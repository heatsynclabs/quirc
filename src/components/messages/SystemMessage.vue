<template>
  <div class="sys-msg" :class="'sys-msg--' + subtype">
    <span class="sys-msg__icon">{{ icon }}</span>
    <span class="sys-msg__time">{{ time }}</span>
    <span class="sys-msg__text">{{ text }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  time: { type: String, required: true },
  text: { type: String, required: true },
  subtype: { type: String, default: 'info' },
})

const ICONS = {
  join: '\u2192',   // →
  part: '\u2190',   // ←
  quit: '\u2190',   // ←
  kick: '\u2718',   // ✘
  mode: '\u2699',   // ⚙
  topic: '\u270E',  // ✎
  nick: '\u2194',   // ↔
  error: '\u26A0',  // ⚠
  whois: '\u2139',  // ℹ
  info: '\u2014',   // —
}

const icon = computed(() => ICONS[props.subtype] || ICONS.info)
</script>

<style scoped>
.sys-msg {
  padding: 3px 16px;
  font-size: var(--q-font-size-sm);
  color: var(--q-text-dim);
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.sys-msg__icon {
  flex-shrink: 0;
  width: 14px;
  text-align: center;
  font-style: normal;
}

.sys-msg__time {
  color: var(--q-text-muted);
  flex-shrink: 0;
}

.sys-msg__text {
  word-break: break-word;
}

/* Subtype colors */
.sys-msg--join { color: var(--q-accent-green); }
.sys-msg--part { color: var(--q-text-dim); }
.sys-msg--quit { color: var(--q-text-dim); }
.sys-msg--kick { color: var(--q-accent-pink); }
.sys-msg--mode { color: var(--q-accent-teal); }
.sys-msg--topic { color: var(--q-accent-teal); }
.sys-msg--nick { color: var(--q-accent-gold); }
.sys-msg--error { color: var(--q-accent-pink); }
.sys-msg--whois { color: var(--q-accent-blue); }
.sys-msg--info { color: var(--q-text-dim); font-style: italic; }
</style>
