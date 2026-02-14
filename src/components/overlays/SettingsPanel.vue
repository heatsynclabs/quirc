<template>
  <div v-if="open" class="settings">
    <div class="settings__backdrop" @click="$emit('close')" />
    <div class="settings__panel">
      <div class="settings__header">
        <span class="settings__title">SETTINGS</span>
        <button class="settings__x" @click="$emit('close')">
          <IconClose :size="16" color="var(--q-text-muted)" />
        </button>
      </div>

      <div class="settings__body">
        <!-- Display -->
        <div class="settings__section">DISPLAY</div>

        <ToggleRow v-model="settings.use24hTime" label="24-hour time" />
        <ToggleRow v-model="settings.showTimestamps" label="Show timestamps" />
        <ToggleRow v-model="settings.showJoinPart" label="Show join/part messages" />
        <ToggleRow v-model="settings.coloredNicks" label="Colored nicknames" />

        <div class="settings__row">
          <span class="settings__row-label">Font size</span>
          <div class="settings__row-control">
            <button class="settings__size-btn" @click="settings.fontSize = Math.max(10, settings.fontSize - 1)">-</button>
            <span class="settings__size-val">{{ settings.fontSize }}px</span>
            <button class="settings__size-btn" @click="settings.fontSize = Math.min(20, settings.fontSize + 1)">+</button>
          </div>
        </div>

        <!-- Media -->
        <div class="settings__section">MEDIA</div>

        <ToggleRow v-model="settings.linkPreviews" label="Link previews" />
        <ToggleRow v-model="settings.inlineImages" label="Inline images" />
        <ToggleRow v-model="settings.mediaAutoExpand" label="Auto-expand media" />

        <!-- Behavior -->
        <div class="settings__section">BEHAVIOR</div>

        <ToggleRow v-model="settings.showTypingIndicators" label="Show typing indicators" />
        <ToggleRow v-model="settings.sendTypingIndicators" label="Send typing indicators" />
        <ToggleRow v-model="settings.desktopNotifications" label="Desktop notifications" />
        <ToggleRow v-model="settings.notifyOnMention" label="Notify on mention" />
        <ToggleRow v-model="settings.notifyOnDM" label="Notify on DM" />

        <!-- Advanced -->
        <div class="settings__section">ADVANCED</div>

        <ToggleRow v-model="settings.rawMessageLog" label="Raw message log" />

        <div class="settings__row">
          <span class="settings__row-label">Max messages/channel</span>
          <span class="settings__row-val">{{ settings.maxMessagesPerChannel }}</span>
        </div>

        <!-- Connection -->
        <div class="settings__section">CONNECTION</div>

        <div class="settings__row">
          <span class="settings__row-label">Server</span>
          <span class="settings__row-val">{{ connection.displayHost }}</span>
        </div>
        <div class="settings__row">
          <span class="settings__row-label">Nick</span>
          <span class="settings__row-val">{{ connection.nick || '—' }}</span>
        </div>
        <div class="settings__row">
          <span class="settings__row-label">Status</span>
          <span class="settings__row-val" :class="'settings__status--' + connection.status">{{ connection.status }}</span>
        </div>

        <div class="settings__actions">
          <button class="settings__btn settings__btn--accent" @click="openRegister">REGISTER NICKNAME</button>
          <button class="settings__btn" @click="openConnect">EDIT CONNECTION</button>
          <button class="settings__btn settings__btn--danger" @click="onClearData">CLEAR ALL DATA</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { IconClose } from '@/components/icons'
import { useSettingsStore } from '@/stores/settings'
import { useConnectionStore } from '@/stores/connection'
import { useUiStore } from '@/stores/ui'

const ToggleRow = {
  props: {
    modelValue: Boolean,
    label: String,
  },
  emits: ['update:modelValue'],
  template: `
    <label class="settings__toggle-row">
      <span class="settings__row-label">{{ label }}</span>
      <input type="checkbox" :checked="modelValue" @change="$emit('update:modelValue', $event.target.checked)" />
    </label>
  `,
}

defineProps({
  open: { type: Boolean, default: false },
})

const emit = defineEmits(['close'])

const settings = useSettingsStore()
const connection = useConnectionStore()
const ui = useUiStore()

function openConnect() {
  emit('close')
  ui.connectionModalOpen = true
}

function openRegister() {
  emit('close')
  ui.registerNickOpen = true
}

function onClearData() {
  if (confirm('Clear all saved data? This will reset settings, connection profiles, and channel history.')) {
    settings.reset()
    connection.clearSaved()
    localStorage.clear()
    location.reload()
  }
}
</script>

<style scoped>
.settings {
  position: fixed;
  inset: 0;
  z-index: 300;
  display: flex;
  align-items: center;
  justify-content: center;
}

.settings__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
}

.settings__panel {
  position: relative;
  background: var(--q-bg-primary);
  border: 2px solid var(--q-border-strong);
  max-width: 420px;
  width: 92%;
  max-height: 90dvh;
  overflow-y: auto;
}

.settings__header {
  padding: 16px 20px;
  border-bottom: 2px solid var(--q-border-strong);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.settings__title {
  font-size: var(--q-font-size-sm);
  color: var(--q-accent-teal);
  letter-spacing: 4px;
  font-weight: 700;
}

.settings__x {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
}

.settings__body {
  padding: 0 20px 20px;
}

.settings__section {
  font-size: 9px;
  letter-spacing: 2px;
  color: var(--q-text-dim);
  text-transform: uppercase;
  margin-top: 20px;
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--q-border);
}

.settings__toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  cursor: pointer;
}

.settings__toggle-row input {
  accent-color: var(--q-accent-teal);
}

.settings__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
}

.settings__row-label {
  font-size: var(--q-font-size-sm);
  color: var(--q-text-secondary);
}

.settings__row-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.settings__row-val {
  font-size: var(--q-font-size-sm);
  color: var(--q-text-muted);
}

.settings__size-btn {
  background: var(--q-bg-secondary);
  border: 1px solid var(--q-border-strong);
  color: var(--q-text-secondary);
  width: 28px;
  height: 28px;
  cursor: pointer;
  font-family: var(--q-font-mono);
  font-size: var(--q-font-size-base);
  display: flex;
  align-items: center;
  justify-content: center;
}

.settings__size-val {
  font-size: var(--q-font-size-sm);
  color: var(--q-text-secondary);
  min-width: 40px;
  text-align: center;
}

.settings__status--connected {
  color: var(--q-accent-green);
}

.settings__status--connecting {
  color: var(--q-accent-gold);
}

.settings__status--disconnected {
  color: var(--q-text-dim);
}

.settings__status--error {
  color: var(--q-accent-pink);
}

.settings__actions {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.settings__btn {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--q-border-strong);
  background: var(--q-bg-secondary);
  color: var(--q-text-secondary);
  font-family: var(--q-font-mono);
  font-size: var(--q-font-size-sm);
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  cursor: pointer;
}

.settings__btn:hover {
  border-color: var(--q-accent-teal);
  color: var(--q-accent-teal);
}

.settings__btn--accent {
  background: var(--q-accent-teal);
  color: #000;
  border: none;
}

.settings__btn--accent:hover {
  opacity: 0.9;
  color: #000;
  border: none;
}

.settings__btn--danger:hover {
  border-color: var(--q-accent-pink);
  color: var(--q-accent-pink);
}
</style>
