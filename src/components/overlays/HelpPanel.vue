<template>
  <div v-if="open" class="help" role="dialog" aria-modal="true" aria-label="Help and commands">
    <div class="help__backdrop" @click="$emit('close')" />
    <div class="help__panel">
      <div class="help__header">
        <span class="help__title">HELP</span>
        <button class="help__x" @click="$emit('close')">
          <IconClose :size="16" color="var(--q-text-muted)" />
        </button>
      </div>

      <div class="help__body">
        <!-- Getting Started -->
        <div class="help__section">GETTING STARTED</div>
        <div class="help__text">
          <p>QUIRC is an IRC (Internet Relay Chat) client. IRC is a real-time messaging protocol where conversations happen in <strong>channels</strong> (group chats starting with #) or <strong>direct messages</strong> (private 1-on-1 chats).</p>
          <p>To get started, join a channel using the + button in the sidebar, or type <code>/join #channelname</code>.</p>
        </div>

        <!-- Nicknames -->
        <div class="help__section">NICKNAMES</div>
        <div class="help__text">
          <p>Your nickname is your identity on IRC. As a guest, anyone can use an unclaimed name.</p>
          <p>To reserve your nick, go to Settings and click "Register Nickname". Once registered, use Sign In to authenticate on future connections.</p>
          <p>Change your nick anytime with <code>/nick newnick</code>.</p>
        </div>

        <!-- Commands Reference -->
        <div class="help__section">COMMANDS</div>

        <div class="help__cmd-group">
          <div class="help__cmd-group-label">CHAT</div>
          <div class="help__cmd"><code>/me &lt;action&gt;</code> <span>Send an action (e.g. "/me waves hello")</span></div>
          <div class="help__cmd"><code>/msg &lt;nick&gt; &lt;text&gt;</code> <span>Send a private message</span></div>
          <div class="help__cmd"><code>/notice &lt;target&gt; &lt;text&gt;</code> <span>Send a notice</span></div>
          <div class="help__cmd"><code>/away &lt;message&gt;</code> <span>Mark yourself as away</span></div>
          <div class="help__cmd"><code>/back</code> <span>Clear away status</span></div>
        </div>

        <div class="help__cmd-group">
          <div class="help__cmd-group-label">CHANNELS</div>
          <div class="help__cmd"><code>/join &lt;#channel&gt; [key]</code> <span>Join a channel</span></div>
          <div class="help__cmd"><code>/part [#channel]</code> <span>Leave a channel</span></div>
          <div class="help__cmd"><code>/topic [text]</code> <span>View or set channel topic</span></div>
          <div class="help__cmd"><code>/list</code> <span>List all channels on the server</span></div>
          <div class="help__cmd"><code>/invite &lt;nick&gt;</code> <span>Invite a user to current channel</span></div>
        </div>

        <div class="help__cmd-group">
          <div class="help__cmd-group-label">MODERATION</div>
          <div class="help__cmd"><code>/kick &lt;nick&gt; [reason]</code> <span>Kick a user from channel (requires op)</span></div>
          <div class="help__cmd"><code>/ban &lt;mask&gt;</code> <span>Ban a user (requires op)</span></div>
          <div class="help__cmd"><code>/unban &lt;mask&gt;</code> <span>Remove a ban (requires op)</span></div>
          <div class="help__cmd"><code>/mode &lt;modes&gt;</code> <span>Set channel/user modes (requires op)</span></div>
        </div>

        <div class="help__cmd-group">
          <div class="help__cmd-group-label">UTILITY</div>
          <div class="help__cmd"><code>/nick &lt;newnick&gt;</code> <span>Change your nickname</span></div>
          <div class="help__cmd"><code>/whois &lt;nick&gt;</code> <span>Look up user information</span></div>
          <div class="help__cmd"><code>/clear</code> <span>Clear message history</span></div>
          <div class="help__cmd"><code>/connect</code> <span>Open connection dialog</span></div>
          <div class="help__cmd"><code>/disconnect</code> <span>Disconnect from server</span></div>
        </div>

        <!-- Channel Management -->
        <div class="help__section">CHANNEL MANAGEMENT</div>
        <div class="help__text">
          <p>Channel operators (ops) have an @ prefix before their nick. Ops can kick/ban users, change the topic, and set channel modes.</p>
          <p>To become an op, register the channel: <code>/msg ChanServ REGISTER #channel</code> (you must have a registered nick first).</p>
          <p>You can also manage channels through the Channel Info panel — click the channel name in the top bar.</p>
        </div>

        <!-- Keyboard Shortcuts -->
        <div class="help__section">KEYBOARD SHORTCUTS</div>
        <div class="help__cmd"><kbd>Ctrl/Cmd + K</kbd> <span>Toggle search</span></div>
        <div class="help__cmd"><kbd>Escape</kbd> <span>Close active panel/modal</span></div>
        <div class="help__cmd"><kbd>/</kbd> <span>Start typing a command (in input)</span></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { IconClose } from '@/components/icons'

defineProps({
  open: { type: Boolean, default: false },
})

defineEmits(['close'])
</script>

<style scoped>
.help {
  position: fixed;
  inset: 0;
  z-index: 300;
  display: flex;
  align-items: center;
  justify-content: center;
}

.help__backdrop {
  position: absolute;
  inset: 0;
  background: var(--q-backdrop);
}

.help__panel {
  position: relative;
  background: var(--q-bg-primary);
  border: 2px solid var(--q-border-strong);
  max-width: 520px;
  width: 94%;
  max-height: 90dvh;
  overflow-y: auto;
}

.help__header {
  padding: 16px 20px;
  border-bottom: 2px solid var(--q-border-strong);
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  background: var(--q-bg-primary);
  z-index: 1;
}

.help__title {
  font-size: var(--q-font-size-sm);
  color: var(--q-accent-teal);
  letter-spacing: 4px;
  font-weight: 700;
}

.help__x {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
}

.help__body {
  padding: 0 20px 20px;
}

.help__section {
  font-size: 9px;
  letter-spacing: 2px;
  color: var(--q-text-dim);
  text-transform: uppercase;
  margin-top: 20px;
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--q-border);
}

.help__text {
  font-size: 12px;
  color: var(--q-text-secondary);
  line-height: 1.6;
}

.help__text p {
  margin: 8px 0;
}

.help__text strong {
  color: var(--q-text-primary);
}

.help__text code {
  color: var(--q-accent-teal);
  font-family: var(--q-font-mono);
  font-size: 12px;
}

.help__cmd-group {
  margin-bottom: 12px;
}

.help__cmd-group-label {
  font-size: 9px;
  letter-spacing: 1px;
  color: var(--q-text-ghost);
  margin: 8px 0 4px;
}

.help__cmd {
  padding: 4px 0;
  font-size: 12px;
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.help__cmd code,
.help__cmd kbd {
  color: var(--q-accent-teal);
  font-family: var(--q-font-mono);
  font-size: 12px;
  flex-shrink: 0;
}

.help__cmd kbd {
  padding: 1px 5px;
  border: 1px solid var(--q-border-strong);
  background: var(--q-bg-secondary);
}

.help__cmd span {
  color: var(--q-text-muted);
}
</style>
