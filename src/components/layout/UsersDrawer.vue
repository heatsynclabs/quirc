<template>
  <div class="us-drawer" :class="{ 'us-drawer--open': open }">
    <div class="us-drawer__backdrop" @click="$emit('close')" />
    <div class="us-drawer__panel">
      <div class="us-drawer__header">
        <div class="us-drawer__label">who's here</div>
        <div class="us-drawer__count">{{ onlineCount }} online</div>
      </div>
      <div class="us-drawer__list">
        <div
          v-for="u in users"
          :key="u.nick"
          class="us-drawer__user"
          :class="{
            'us-drawer__user--away': u.status === 'away',
            'us-drawer__user--off': u.status === 'offline',
            'us-drawer__user--self': u.nick === myNick,
          }"
          @click="selectUser(u)"
        >
          <div
            class="us-drawer__dot"
            :class="{
              'us-drawer__dot--on': u.status === 'online',
              'us-drawer__dot--away': u.status === 'away',
              'us-drawer__dot--off': u.status === 'offline',
            }"
          />
          <span class="us-drawer__nick" :style="{ color: getNickColor(u.nick) }">{{ u.op ? '@' : '' }}{{ u.nick }}<span v-if="u.nick === myNick" class="us-drawer__you"> (you)</span></span>
        </div>
      </div>

      <!-- User action sheet -->
      <div v-if="selectedUser" class="us-drawer__actions">
        <div class="us-drawer__actions-header">
          <span class="us-drawer__actions-nick" :style="{ color: getNickColor(selectedUser.nick) }">
            {{ selectedUser.op ? '@' : '' }}{{ selectedUser.nick }}
          </span>
          <button class="us-drawer__actions-x" aria-label="Close user actions" @click="selectedUser = null">
            <IconClose :size="14" color="var(--q-text-muted)" />
          </button>
        </div>
        <button class="us-drawer__action" @click="onWhois" title="Look up this user's info">WHOIS</button>
        <button class="us-drawer__action" @click="onDM" title="Start a private conversation">DIRECT MESSAGE</button>
        <template v-if="isOp && selectedUser.nick !== myNick">
          <button v-if="!selectedUser.op" class="us-drawer__action" @click="onGiveOp" title="Give this user operator status">GIVE OP</button>
          <button v-if="selectedUser.op" class="us-drawer__action" @click="onRemoveOp" title="Remove operator status from this user">REMOVE OP</button>
          <button v-if="!selectedUser.voiced" class="us-drawer__action" @click="onGiveVoice" title="Allow this user to speak in moderated channels">GIVE VOICE</button>
          <button v-if="selectedUser.voiced" class="us-drawer__action" @click="onRemoveVoice" title="Remove voice from this user">REMOVE VOICE</button>
          <button class="us-drawer__action" @click="onInvite" title="Invite this user to the current channel">INVITE</button>
          <button class="us-drawer__action us-drawer__action--danger" @click="onKick" title="Remove this user from the channel">KICK</button>
          <button class="us-drawer__action us-drawer__action--danger" @click="onBan" title="Ban and remove this user from the channel">BAN</button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { getNickColor } from '@/utils/nickColor'
import { IconClose } from '@/components/icons'
import { getClient } from '@/irc/client'
import { useChannelsStore } from '@/stores/channels'

const props = defineProps({
  open: { type: Boolean, default: false },
  users: { type: Array, default: () => [] },
  onlineCount: { type: Number, default: 0 },
  isOp: { type: Boolean, default: false },
  myNick: { type: String, default: '' },
})

const emit = defineEmits(['close', 'openDM'])

const channels = useChannelsStore()
const client = getClient()
const selectedUser = ref(null)

function selectUser(u) {
  if (u.nick === props.myNick) return
  selectedUser.value = u
}

function onWhois() {
  if (selectedUser.value) {
    client.whois(selectedUser.value.nick)
    selectedUser.value = null
  }
}

function onDM() {
  if (selectedUser.value) {
    emit('openDM', selectedUser.value.nick)
    selectedUser.value = null
    emit('close')
  }
}

function onGiveOp() {
  if (selectedUser.value && channels.activeChannel) {
    client.mode(channels.activeChannel, `+o ${selectedUser.value.nick}`)
    selectedUser.value = null
  }
}

function onRemoveOp() {
  if (selectedUser.value && channels.activeChannel) {
    client.mode(channels.activeChannel, `-o ${selectedUser.value.nick}`)
    selectedUser.value = null
  }
}

function onGiveVoice() {
  if (selectedUser.value && channels.activeChannel) {
    client.mode(channels.activeChannel, `+v ${selectedUser.value.nick}`)
    selectedUser.value = null
  }
}

function onRemoveVoice() {
  if (selectedUser.value && channels.activeChannel) {
    client.mode(channels.activeChannel, `-v ${selectedUser.value.nick}`)
    selectedUser.value = null
  }
}

function onInvite() {
  if (selectedUser.value && channels.activeChannel) {
    client.invite(selectedUser.value.nick, channels.activeChannel)
    selectedUser.value = null
  }
}

function onKick() {
  if (selectedUser.value && channels.activeChannel) {
    client.kick(channels.activeChannel, selectedUser.value.nick)
    selectedUser.value = null
  }
}

function onBan() {
  if (selectedUser.value && channels.activeChannel) {
    const nick = selectedUser.value.nick
    client.ban(channels.activeChannel, `${nick}!*@*`)
    client.kick(channels.activeChannel, nick, 'Banned')
    selectedUser.value = null
  }
}
</script>

<style scoped>
.us-drawer {
  position: fixed;
  inset: 0;
  z-index: 100;
  pointer-events: none;
}

.us-drawer--open {
  pointer-events: auto;
}

.us-drawer__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  opacity: 0;
  transition: opacity 0.2s;
}

.us-drawer--open .us-drawer__backdrop {
  opacity: 1;
}

.us-drawer__panel {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: var(--q-users-drawer-width);
  background: var(--q-bg-secondary);
  border-left: 2px solid var(--q-border-strong);
  transform: translateX(100%);
  transition: transform 0.25s ease;
  display: flex;
  flex-direction: column;
}

.us-drawer--open .us-drawer__panel {
  transform: translateX(0);
}

.us-drawer__header {
  padding: 20px 16px 12px;
  border-bottom: 2px solid var(--q-border-strong);
}

.us-drawer__label {
  font-size: var(--q-font-size-sm);
  color: var(--q-text-dim);
  letter-spacing: 3px;
  text-transform: uppercase;
}

.us-drawer__count {
  font-size: var(--q-font-size-base);
  color: var(--q-text-secondary);
  margin-top: 4px;
}

.us-drawer__list {
  flex: 1;
  padding: 8px 0;
  overflow-y: auto;
}

.us-drawer__user {
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.us-drawer__user:hover:not(.us-drawer__user--self) {
  background: var(--q-bg-hover);
}

.us-drawer__user--self {
  cursor: default;
  opacity: 0.8;
}

.us-drawer__you {
  color: var(--q-text-dim);
  font-size: var(--q-font-size-xs);
}

.us-drawer__user--away {
  opacity: 0.6;
}

.us-drawer__user--off {
  opacity: 0.35;
}

.us-drawer__dot {
  width: 7px;
  height: 7px;
}

.us-drawer__dot--on {
  background: var(--q-accent-green);
}

.us-drawer__dot--away {
  background: var(--q-accent-gold);
}

.us-drawer__dot--off {
  background: #444;
}

.us-drawer__nick {
  font-size: var(--q-font-size-base);
}

.us-drawer__actions {
  border-top: 2px solid var(--q-border-strong);
  padding: 12px 16px;
}

.us-drawer__actions-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.us-drawer__actions-nick {
  font-size: var(--q-font-size-md);
  font-weight: 700;
}

.us-drawer__actions-x {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
}

.us-drawer__action {
  display: block;
  width: 100%;
  padding: 8px 0;
  background: none;
  border: none;
  border-bottom: 1px solid var(--q-border);
  color: var(--q-text-secondary);
  font-family: var(--q-font-mono);
  font-size: var(--q-font-size-sm);
  letter-spacing: 2px;
  text-align: left;
  cursor: pointer;
}

.us-drawer__action:last-child {
  border-bottom: none;
}

.us-drawer__action:hover {
  color: var(--q-accent-teal);
}

.us-drawer__action--danger:hover {
  color: var(--q-accent-pink);
}
</style>
