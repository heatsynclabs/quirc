<template>
  <div v-if="open" class="chinfo" role="dialog" aria-modal="true" aria-label="Channel info">
    <div class="chinfo__backdrop" @click="$emit('close')" />
    <div class="chinfo__panel">
      <div class="chinfo__header">
        <span class="chinfo__title">CHANNEL INFO</span>
        <button class="chinfo__x" @click="$emit('close')">
          <IconClose :size="16" color="var(--q-text-muted)" />
        </button>
      </div>

      <div class="chinfo__body">
        <!-- Info Section -->
        <div class="chinfo__section">INFO</div>

        <div class="chinfo__row">
          <span class="chinfo__row-label">Channel</span>
          <span class="chinfo__row-val">{{ channelName }}</span>
        </div>

        <div class="chinfo__row">
          <span class="chinfo__row-label">Users</span>
          <span class="chinfo__row-val">{{ userCount }}</span>
        </div>

        <div class="chinfo__topic-area">
          <label class="chinfo__row-label">Topic</label>
          <div v-if="editingTopic" class="chinfo__topic-edit">
            <input
              v-model="topicDraft"
              class="chinfo__input"
              placeholder="Set a topic..."
              @keydown.enter="saveTopic"
              @keydown.escape="editingTopic = false"
            />
            <div class="chinfo__topic-actions">
              <button class="chinfo__btn-sm" @click="saveTopic">SAVE</button>
              <button class="chinfo__btn-sm chinfo__btn-sm--muted" @click="editingTopic = false">CANCEL</button>
            </div>
          </div>
          <div v-else class="chinfo__topic-display" @click="startEditTopic">
            <span v-if="topic" class="chinfo__topic-text">{{ topic }}</span>
            <span v-else class="chinfo__topic-empty">No topic set</span>
            <span v-if="isOp" class="chinfo__topic-edit-hint">click to edit</span>
          </div>
        </div>

        <!-- Mode Badges -->
        <div v-if="modeBadges.length" class="chinfo__badges">
          <span v-for="b in modeBadges" :key="b.mode" class="chinfo__badge" :title="b.desc">
            {{ b.icon }} {{ b.label }}
          </span>
        </div>

        <!-- Modes Section (op only) -->
        <template v-if="isOp">
          <div class="chinfo__section">CHANNEL MODES</div>

          <label class="chinfo__toggle-row">
            <span class="chinfo__row-label">Invite Only <span class="chinfo__hint">+i</span></span>
            <input type="checkbox" :checked="hasMode('i')" @change="toggleMode('i', $event.target.checked)" />
          </label>

          <label class="chinfo__toggle-row">
            <span class="chinfo__row-label">Moderated <span class="chinfo__hint">+m — Only ops/voiced can talk</span></span>
            <input type="checkbox" :checked="hasMode('m')" @change="toggleMode('m', $event.target.checked)" />
          </label>

          <label class="chinfo__toggle-row">
            <span class="chinfo__row-label">Topic Locked <span class="chinfo__hint">+t — Only ops can change topic</span></span>
            <input type="checkbox" :checked="hasMode('t')" @change="toggleMode('t', $event.target.checked)" />
          </label>

          <label class="chinfo__toggle-row">
            <span class="chinfo__row-label">No External Messages <span class="chinfo__hint">+n</span></span>
            <input type="checkbox" :checked="hasMode('n')" @change="toggleMode('n', $event.target.checked)" />
          </label>

          <label class="chinfo__toggle-row">
            <span class="chinfo__row-label">Secret <span class="chinfo__hint">+s — Hidden from /list</span></span>
            <input type="checkbox" :checked="hasMode('s')" @change="toggleMode('s', $event.target.checked)" />
          </label>

          <div class="chinfo__key-row">
            <span class="chinfo__row-label">Require Password <span class="chinfo__hint">+k</span></span>
            <div class="chinfo__key-control">
              <input
                v-model="keyDraft"
                class="chinfo__input chinfo__input--short"
                placeholder="password"
                :disabled="!hasMode('k') && !keyDraft"
              />
              <button v-if="hasMode('k')" class="chinfo__btn-sm chinfo__btn-sm--danger" @click="removeKey">REMOVE</button>
              <button v-else class="chinfo__btn-sm" :disabled="!keyDraft" @click="setKey">SET</button>
            </div>
          </div>

          <!-- Management Section -->
          <div class="chinfo__section">MANAGEMENT</div>

          <button class="chinfo__action-btn" @click="registerChannel">REGISTER CHANNEL</button>

          <button class="chinfo__action-btn" @click="queryBanList">
            {{ showBans ? 'HIDE BAN LIST' : 'VIEW BAN LIST' }}
          </button>

          <div v-if="showBans" class="chinfo__ban-list">
            <div v-if="!banList.length" class="chinfo__ban-empty">No bans set</div>
            <div v-for="ban in banList" :key="ban.mask" class="chinfo__ban-item">
              <span class="chinfo__ban-mask">{{ ban.mask }}</span>
              <button class="chinfo__ban-remove" @click="removeBan(ban.mask)" title="Remove ban">&times;</button>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { IconClose } from '@/components/icons'
import { useChannelsStore } from '@/stores/channels'
import { useUsersStore } from '@/stores/users'
import { useConnectionStore } from '@/stores/connection'
import { getClient } from '@/irc/client'

const props = defineProps({
  open: { type: Boolean, default: false },
  channelName: { type: String, default: '' },
})

defineEmits(['close'])

const channels = useChannelsStore()
const usersStore = useUsersStore()
const connection = useConnectionStore()
const client = getClient()

const editingTopic = ref(false)
const topicDraft = ref('')
const keyDraft = ref('')
const showBans = ref(false)

const channel = computed(() =>
  channels.channels.find(c => c.name === props.channelName)
)

const topic = computed(() => channel.value?.topic || '')
const modes = computed(() => channel.value?.modes || {})
const banList = computed(() => channel.value?.banList || [])
const isOp = computed(() => connection.isOp)
const userCount = computed(() => usersStore.onlineCount)

const modeBadges = computed(() => {
  const m = modes.value
  const badges = []
  if (m.k) badges.push({ mode: 'k', icon: '\u{1F512}', label: 'Password', desc: 'Requires a password to join (+k)' })
  if (m.i) badges.push({ mode: 'i', icon: '\u{1F6E1}', label: 'Invite Only', desc: 'Invite only (+i)' })
  if (m.m) badges.push({ mode: 'm', icon: '\u{1F507}', label: 'Moderated', desc: 'Moderated — only ops/voiced can speak (+m)' })
  if (m.t) badges.push({ mode: 't', icon: '\u{1F4CC}', label: 'Topic Locked', desc: 'Only ops can change topic (+t)' })
  if (m.n) badges.push({ mode: 'n', icon: '\u{1F4E8}', label: 'No External', desc: 'No external messages (+n)' })
  if (m.s) badges.push({ mode: 's', icon: '\u{1F441}', label: 'Secret', desc: 'Hidden from /list (+s)' })
  return badges
})

watch(() => props.open, (val) => {
  if (val) {
    editingTopic.value = false
    showBans.value = false
    keyDraft.value = typeof modes.value.k === 'string' ? modes.value.k : ''
    // Refresh modes
    if (props.channelName.startsWith('#')) {
      client.mode(props.channelName)
    }
  }
})

function hasMode(m) {
  return !!modes.value[m]
}

function toggleMode(mode, on) {
  client.mode(props.channelName, `${on ? '+' : '-'}${mode}`)
}

function startEditTopic() {
  if (!isOp.value) return
  topicDraft.value = topic.value
  editingTopic.value = true
}

function saveTopic() {
  client.topic(props.channelName, topicDraft.value)
  editingTopic.value = false
}

function setKey() {
  if (keyDraft.value) {
    client.mode(props.channelName, `+k ${keyDraft.value}`)
  }
}

function removeKey() {
  const currentKey = typeof modes.value.k === 'string' ? modes.value.k : '*'
  client.mode(props.channelName, `-k ${currentKey}`)
  keyDraft.value = ''
}

function registerChannel() {
  client.privmsg('ChanServ', `REGISTER ${props.channelName}`)
}

function queryBanList() {
  showBans.value = !showBans.value
  if (showBans.value) {
    client.mode(props.channelName, '+b')
  }
}

function removeBan(mask) {
  client.unban(props.channelName, mask)
  // Re-query after a short delay
  setTimeout(() => client.mode(props.channelName, '+b'), 500)
}
</script>

<style scoped>
.chinfo {
  position: fixed;
  inset: 0;
  z-index: 300;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chinfo__backdrop {
  position: absolute;
  inset: 0;
  background: var(--q-backdrop);
}

.chinfo__panel {
  position: relative;
  background: var(--q-bg-primary);
  border: 2px solid var(--q-border-strong);
  max-width: 440px;
  width: 92%;
  max-height: 90dvh;
  overflow-y: auto;
}

.chinfo__header {
  padding: 16px 20px;
  border-bottom: 2px solid var(--q-border-strong);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.chinfo__title {
  font-size: var(--q-font-size-sm);
  color: var(--q-accent-teal);
  letter-spacing: 4px;
  font-weight: 700;
}

.chinfo__x {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
}

.chinfo__body {
  padding: 0 20px 20px;
}

.chinfo__section {
  font-size: 9px;
  letter-spacing: 2px;
  color: var(--q-text-dim);
  text-transform: uppercase;
  margin-top: 20px;
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--q-border);
}

.chinfo__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
}

.chinfo__row-label {
  font-size: var(--q-font-size-sm);
  color: var(--q-text-secondary);
}

.chinfo__row-val {
  font-size: var(--q-font-size-sm);
  color: var(--q-text-muted);
}

.chinfo__hint {
  color: var(--q-text-ghost);
  font-size: 10px;
}

.chinfo__badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.chinfo__badge {
  font-size: 10px;
  padding: 3px 8px;
  border: 1px solid var(--q-border-strong);
  color: var(--q-text-muted);
  letter-spacing: 1px;
  cursor: default;
}

/* Topic */
.chinfo__topic-area {
  padding: 8px 0;
}

.chinfo__topic-display {
  margin-top: 4px;
  padding: 6px 0;
  cursor: pointer;
}

.chinfo__topic-text {
  color: var(--q-text-muted);
  font-size: var(--q-font-size-sm);
}

.chinfo__topic-empty {
  color: var(--q-text-ghost);
  font-size: var(--q-font-size-sm);
  font-style: italic;
}

.chinfo__topic-edit-hint {
  font-size: 9px;
  color: var(--q-text-ghost);
  margin-left: 8px;
}

.chinfo__topic-edit {
  margin-top: 4px;
}

.chinfo__topic-actions {
  display: flex;
  gap: 8px;
  margin-top: 6px;
}

/* Toggle rows */
.chinfo__toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  cursor: pointer;
}

.chinfo__toggle-row input {
  accent-color: var(--q-accent-teal);
}

/* Inputs */
.chinfo__input {
  width: 100%;
  background: var(--q-bg-secondary);
  border: 1px solid var(--q-border-strong);
  color: var(--q-text-primary);
  font-family: var(--q-font-mono);
  font-size: 12px;
  padding: 6px 10px;
}

.chinfo__input:focus {
  border-color: var(--q-accent-teal);
}

.chinfo__input--short {
  width: 120px;
}

/* Key row */
.chinfo__key-row {
  padding: 8px 0;
}

.chinfo__key-control {
  display: flex;
  gap: 6px;
  margin-top: 6px;
  align-items: center;
}

/* Buttons */
.chinfo__btn-sm {
  background: none;
  border: 1px solid var(--q-border-strong);
  color: var(--q-accent-teal);
  font-family: var(--q-font-mono);
  font-size: 10px;
  letter-spacing: 1px;
  padding: 4px 10px;
  cursor: pointer;
}

.chinfo__btn-sm:hover {
  border-color: var(--q-accent-teal);
}

.chinfo__btn-sm--muted {
  color: var(--q-text-muted);
}

.chinfo__btn-sm--danger {
  color: var(--q-accent-pink);
}

.chinfo__btn-sm--danger:hover {
  border-color: var(--q-accent-pink);
}

.chinfo__btn-sm:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.chinfo__action-btn {
  display: block;
  width: 100%;
  padding: 10px;
  margin-top: 6px;
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

.chinfo__action-btn:hover {
  border-color: var(--q-accent-teal);
  color: var(--q-accent-teal);
}

/* Ban list */
.chinfo__ban-list {
  margin-top: 8px;
  border: 1px solid var(--q-border);
  max-height: 200px;
  overflow-y: auto;
}

.chinfo__ban-empty {
  padding: 12px;
  color: var(--q-text-ghost);
  font-size: var(--q-font-size-sm);
  text-align: center;
}

.chinfo__ban-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  border-bottom: 1px solid var(--q-border);
}

.chinfo__ban-item:last-child {
  border-bottom: none;
}

.chinfo__ban-mask {
  color: var(--q-text-muted);
  font-size: var(--q-font-size-sm);
  font-family: var(--q-font-mono);
}

.chinfo__ban-remove {
  background: none;
  border: none;
  color: var(--q-accent-pink);
  font-size: 16px;
  cursor: pointer;
  padding: 0 4px;
}

.chinfo__ban-remove:hover {
  color: var(--q-text-bright);
}
</style>
