import { onUnmounted } from 'vue'
import { getClient } from '@/irc/client'
import { parseSlashCommand, COMMAND_HELP } from '@/irc/commands'
import { useConnectionStore } from '@/stores/connection'
import { useMessagesStore } from '@/stores/messages'
import { useChannelsStore } from '@/stores/channels'
import { useUsersStore } from '@/stores/users'
import { useUiStore } from '@/stores/ui'
import { useSettingsStore } from '@/stores/settings'
import { formatTime } from '@/utils/time'
import { detectUrls } from '@/utils/linkDetect'
import { stripFormatting } from '@/irc/format'

const IMAGE_RE = /\.(jpe?g|png|gif|webp|svg)(\?.*)?$/i

export function useIRC() {
  const connection = useConnectionStore()
  const messages = useMessagesStore()
  const channels = useChannelsStore()
  const usersStore = useUsersStore()
  const ui = useUiStore()
  const settings = useSettingsStore()
  const client = getClient()

  const _handlers = []
  let _nickAttempt = 0

  function on(event, handler) {
    client.on(event, handler)
    _handlers.push([event, handler])
  }

  // --- Connection ---
  on('status', (status, error) => {
    connection.setStatus(status, error)
    if (status === 'disconnected') {
      usersStore.clearAll()
    }
  })

  on('reconnecting', (delay, attempt) => {
    const channel = channels.activeChannel
    if (channel) {
      messages.addSystemMessage(channel, `Reconnecting in ${delay / 1000}s (attempt ${attempt})...`, 'error')
    }
  })

  // --- Registered (001) ---
  on('registered', (msg) => {
    _nickAttempt = 0
    connection.setNick(client.nick)
    for (const ch of connection.autoJoinChannels) {
      client.join(ch)
    }
    // Restore saved DM channels — load from DB first, then fetch server history
    const savedDMs = channels.getSavedDMs()
    for (const dm of savedDMs) {
      channels.addChannel(dm, 'Direct message')
      messages.loadFromDB(dm).catch(() => {}).then(() => {
        client.chathistory(dm, 100)
      })
    }
    // Tip about registration for history persistence
    if (!connection.useSasl) {
      setTimeout(() => {
        const ch = channels.activeChannel
        if (ch) {
          messages.addSystemMessage(ch, 'Tip: Register your nickname to enable persistent chat history and DMs across sessions. Use /msg NickServ REGISTER <password> <email>', 'info')
        }
      }, 1500)
    }
  })

  // --- Server info (004) ---
  on('serverinfo', ({ serverName }) => {
    connection.setServerInfo(serverName, '')
  })

  // --- MOTD ---
  on('motd', (lines) => {
    connection.setMotd(lines)
  })

  // --- Nick errors ---
  const _deferredMessages = []

  on('nick:error', ({ code, nick, message }) => {
    if (code === '433' && client.status !== 'connected') {
      _nickAttempt++
      const altNick = `${connection.nick}_${_nickAttempt}`
      client.changeNick(altNick)
      const text = `Nick "${nick}" is already in use, trying "${altNick}"...`
      const ch = channels.activeChannel
      if (ch) {
        messages.addSystemMessage(ch, text, 'error')
      } else {
        _deferredMessages.push({ text, subtype: 'error' })
      }
    } else {
      const ch = channels.activeChannel
      if (ch) messages.addSystemMessage(ch, `Nick error: ${message}`, 'error')
    }
  })

  // --- Channel errors ---
  const CHANNEL_ERROR_MESSAGES = {
    '403': 'Channel does not exist',
    '405': 'You have joined too many channels',
    '471': 'Channel is full (user limit reached)',
    '473': 'Channel is invite-only — you need an invite to join',
    '474': 'You are banned from this channel',
    '475': 'Incorrect channel password — use /join #channel <password>',
  }

  on('channel:error', ({ code, channel, message }) => {
    const targetExists = channels.channels.find(c => c.name === channel)
    const ch = targetExists ? channel : (channels.activeChannel || channel)
    const friendly = CHANNEL_ERROR_MESSAGES[code] || message
    if (ch) messages.addSystemMessage(ch, `Cannot join ${channel}: ${friendly}`, 'error')
  })

  // --- General/permission errors ---
  const GENERAL_ERROR_MESSAGES = {
    '401': 'No such nick or channel',
    '402': 'No such server',
    '404': 'Cannot send to channel — you may need voice (+v) in a moderated channel',
    '406': 'There was no such nickname',
    '481': 'You need to be an IRC operator for this',
    '482': 'You need to be a channel operator (op) for this',
  }

  on('error', ({ code, target, message }) => {
    const ch = channels.activeChannel
    const friendly = GENERAL_ERROR_MESSAGES[code] || message
    if (ch) messages.addSystemMessage(ch, `${friendly}${target ? ` (${target})` : ''}`, 'error')
  })

  // --- SASL ---
  on('sasl:success', () => {
    const ch = channels.activeChannel
    if (ch) messages.addSystemMessage(ch, 'SASL authentication successful', 'info')
  })
  on('sasl:fail', (reason) => {
    const ch = channels.activeChannel
    if (ch) {
      messages.addSystemMessage(ch, `SASL authentication failed: ${reason}`, 'error')
    } else {
      connection.setStatus(connection.status, `SASL authentication failed: ${reason}`)
      ui.connectionModalOpen = true
    }
  })

  // --- PRIVMSG ---
  const SERVICE_NICKS = ['nickserv', 'chanserv', 'hostserv', 'memoserv', 'operserv']

  on('PRIVMSG', (msg) => {
    const target = msg.params[0]
    const rawText = msg.params[1] || ''
    const text = stripFormatting(rawText)
    const nick = msg.source?.nick || '???'
    const time = msg.tags['time']
      ? formatTime(new Date(msg.tags['time']), settings.use24hTime)
      : formatTime(new Date(), settings.use24hTime)

    // Skip our own messages unless echoed by the server (echo-message cap)
    if (nick === client.nick && !client._capAcked.includes('echo-message')) return

    // Suppress echoed outgoing messages to IRC services (hides passwords)
    if (nick === client.nick && SERVICE_NICKS.includes(target.toLowerCase())) return

    // Determine target channel — echo-aware DM routing
    let channel
    if (target.startsWith('#')) {
      channel = target
    } else if (nick === client.nick) {
      channel = target   // Outgoing DM: route to recipient
    } else {
      channel = nick     // Incoming DM: route to sender
    }

    // ACTION (/me)
    if (text.startsWith('\x01ACTION ') && text.endsWith('\x01')) {
      messages.addMessage(channel, {
        id: msg.tags['msgid'] || Date.now() + Math.random(),
        nick, time,
        text: text.slice(8, -1),
        isAction: true,
        msgid: msg.tags['msgid'],
      })
    } else {
      const messageObj = {
        id: msg.tags['msgid'] || Date.now() + Math.random(),
        nick, time, text,
        msgid: msg.tags['msgid'],
        replyToId: msg.tags['+draft/reply'] || undefined,
        linkPreview: null,
        hasImage: false,
        imageUrl: null,
      }

      // Detect URLs for previews/inline images
      const urls = detectUrls(text)
      if (urls.length > 0) {
        const firstUrl = urls[0].url
        if (settings.inlineImages && IMAGE_RE.test(firstUrl)) {
          messageObj.hasImage = true
          messageObj.imageUrl = firstUrl
        } else if (settings.linkPreviews) {
          const unfurlApi = import.meta.env.VITE_UNFURL_API
          if (unfurlApi) {
            fetch(`${unfurlApi}?url=${encodeURIComponent(firstUrl)}`)
              .then(r => r.ok ? r.json() : null)
              .then(data => {
                if (!data || !data.title) return
                const channelMsgs = messages.messagesByChannel[channel]
                if (!channelMsgs) return
                const stored = channelMsgs.find(m => m.id === messageObj.id)
                if (stored) {
                  stored.linkPreview = {
                    domain: data.site_name || new URL(firstUrl).hostname,
                    title: data.title,
                    description: data.description || '',
                  }
                }
              })
              .catch(() => {})
          }
        }
      }

      // Resolve reply reference
      if (messageObj.replyToId) {
        const channelMsgs = messages.messagesByChannel[channel]
        if (channelMsgs) {
          const parent = channelMsgs.find(m => m.msgid === messageObj.replyToId)
          if (parent) {
            messageObj.replyTo = { nick: parent.nick, text: parent.text.slice(0, 60) }
          }
        }
      }

      messages.addMessage(channel, messageObj)
    }

    // Ensure channel exists for DMs
    if (!target.startsWith('#')) {
      const isNew = !channels.channels.find(c => c.name === channel)
      channels.addChannel(channel, 'Direct message')
      if (isNew) client.chathistory(channel, 100)
    }

    if (channel !== channels.activeChannel && !channels.isMuted(channel)) {
      channels.incrementUnread(channel)
    }
  })

  // --- NOTICE ---
  on('NOTICE', (msg) => {
    const text = msg.params[1] || ''
    const nick = msg.source?.nick || msg.source?.host || 'server'
    const target = msg.params[0]

    // Suppress service notices from being duplicated in channels —
    // ConnectionModal and RegisterNickModal handle them during registration
    if (nick && SERVICE_NICKS.includes(nick.toLowerCase())) return

    // Suppress noisy server connection notices (*** Looking up your hostname, etc.)
    if (text.startsWith('***')) return

    const channel = target.startsWith('#') ? target : (channels.activeChannel || '#general')
    messages.addSystemMessage(channel, `[${nick}] ${text}`, 'info')
  })

  // --- JOIN ---
  on('JOIN', (msg) => {
    const channel = msg.params[0]
    const nick = msg.source?.nick

    if (nick === client.nick) {
      channels.addChannel(channel)
      if (!channels.activeChannel) {
        channels.setActive(channel)
      }
      // Flush deferred messages (e.g. nick collision warnings from before any channel existed)
      if (_deferredMessages.length) {
        for (const { text, subtype } of _deferredMessages) {
          messages.addSystemMessage(channel, text, subtype)
        }
        _deferredMessages.length = 0
      }
      client.who(channel)
      client.mode(channel) // Request channel modes (triggers 324 reply)
      // Load cached messages from IndexedDB first, then fetch CHATHISTORY to merge
      messages.loadFromDB(channel).catch(() => {}).then(() => {
        client.chathistory(channel, 100)
      })
    } else {
      usersStore.addUser(channel, nick)
      if (settings.showJoinPart) {
        messages.addSystemMessage(channel, `${nick} has joined ${channel}`, 'join')
      }
    }
  })

  // --- PART ---
  on('PART', (msg) => {
    const channel = msg.params[0]
    const nick = msg.source?.nick
    const reason = msg.params[1] || ''

    if (nick === client.nick) {
      channels.removeChannel(channel)
      messages.clearChannel(channel)
      usersStore.clearChannel(channel)
    } else {
      usersStore.removeUser(channel, nick)
      if (settings.showJoinPart) {
        messages.addSystemMessage(channel, `${nick} has left ${channel}${reason ? ` (${reason})` : ''}`, 'part')
      }
    }
  })

  // --- KICK ---
  on('KICK', (msg) => {
    const channel = msg.params[0]
    const kicked = msg.params[1]
    const kicker = msg.source?.nick
    const reason = msg.params[2] || ''

    messages.addSystemMessage(channel, `${kicked} was kicked by ${kicker}${reason ? `: ${reason}` : ''}`, 'kick')

    if (kicked === client.nick) {
      channels.removeChannel(channel)
      usersStore.clearChannel(channel)
    } else {
      usersStore.removeUser(channel, kicked)
    }
  })

  // --- QUIT ---
  on('QUIT', (msg) => {
    const nick = msg.source?.nick
    const reason = msg.params[0] || ''
    // Only post quit message to channels where the user was present
    for (const ch of channels.channels) {
      if (usersStore.hasUser(ch.name, nick)) {
        usersStore.removeUser(ch.name, nick)
        if (settings.showJoinPart) {
          messages.addSystemMessage(ch.name, `${nick} has quit${reason ? ` (${reason})` : ''}`, 'quit')
        }
      }
    }
  })

  // --- NICK ---
  on('NICK', (msg) => {
    const oldNick = msg.source?.nick
    const newNick = msg.params[0]
    usersStore.renameUser(oldNick, newNick)
    if (oldNick === client.nick) {
      client.nick = newNick
      connection.setNick(newNick)
    }
    for (const ch of channels.channels) {
      if (usersStore.hasUser(ch.name, newNick)) {
        messages.addSystemMessage(ch.name, `${oldNick} is now known as ${newNick}`, 'nick')
      }
    }
  })

  // --- TOPIC ---
  on('TOPIC', (msg) => {
    const channel = msg.params[0]
    const topic = msg.params[1] || ''
    const nick = msg.source?.nick
    channels.setTopic(channel, topic)
    messages.addSystemMessage(channel, `${nick} changed the topic to: ${topic}`, 'topic')
  })

  on('332', (msg) => {
    channels.setTopic(msg.params[1], msg.params[2] || '')
  })

  // --- NAMES ---
  on('353', (msg) => {
    const channel = msg.params[2]
    const names = (msg.params[3] || '').split(' ').filter(Boolean)
    for (const name of names) {
      let n = name
      let op = false, voiced = false
      if (n.startsWith('@')) { op = true; n = n.slice(1) }
      else if (n.startsWith('+')) { voiced = true; n = n.slice(1) }
      usersStore.addUser(channel, n, { op, voiced })
    }
  })

  // --- WHO reply ---
  on('352', (msg) => {
    const channel = msg.params[1]
    const nick = msg.params[5]
    const flags = msg.params[6] || ''
    usersStore.addUser(channel, nick, {
      status: flags.includes('G') ? 'away' : 'online',
      op: flags.includes('@'),
      voiced: flags.includes('+'),
    })
  })

  // --- AWAY ---
  on('AWAY', (msg) => {
    const nick = msg.source?.nick
    usersStore.updateStatus(nick, msg.params[0] ? 'away' : 'online')
  })

  // --- MODE ---
  // Modes that take a parameter when set (+) and unset (-)
  const PARAM_MODES_ALWAYS = new Set(['o', 'v', 'b', 'e', 'I', 'k'])
  // Modes that take a parameter only when set (+)
  const PARAM_MODES_SET = new Set(['l'])

  on('MODE', (msg) => {
    const target = msg.params[0]
    if (!target.startsWith('#')) return
    const modeStr = msg.params[1] || ''
    const modeArgs = msg.params.slice(2)
    let adding = true, argIdx = 0

    for (const ch of modeStr) {
      if (ch === '+') { adding = true; continue }
      if (ch === '-') { adding = false; continue }

      // User modes
      if (ch === 'o') {
        const nick = modeArgs[argIdx++]
        if (nick) {
          usersStore.setOp(target, nick, adding)
          if (nick === client.nick) connection.setOp(adding)
        }
      } else if (ch === 'v') {
        const nick = modeArgs[argIdx++]
        if (nick) usersStore.setVoiced(target, nick, adding)
      } else if (ch === 'b' || ch === 'e' || ch === 'I') {
        argIdx++ // consume mask param, don't track as channel mode
      } else if (PARAM_MODES_SET.has(ch)) {
        const param = adding ? modeArgs[argIdx++] : undefined
        channels.updateMode(target, ch, adding, param)
      } else if (PARAM_MODES_ALWAYS.has(ch)) {
        const param = modeArgs[argIdx++]
        channels.updateMode(target, ch, adding, param)
      } else {
        // Simple flag modes (i, m, t, n, s, etc.)
        channels.updateMode(target, ch, adding)
      }
    }

    const setter = msg.source?.nick || 'server'
    messages.addSystemMessage(target, `${setter} sets mode ${modeStr} ${modeArgs.join(' ')}`.trim(), 'mode')
  })

  // --- RPL_CHANNELMODEIS (324) ---
  on('324', (msg) => {
    const channel = msg.params[1]
    const modeStr = msg.params[2] || ''
    const modeArgs = msg.params.slice(3)
    let argIdx = 0
    const modes = {}

    for (const ch of modeStr) {
      if (ch === '+') continue
      if (PARAM_MODES_ALWAYS.has(ch) || PARAM_MODES_SET.has(ch)) {
        modes[ch] = modeArgs[argIdx++] || true
      } else {
        modes[ch] = true
      }
    }
    channels.setModes(channel, modes)
  })

  // --- RPL_BANLIST (367) / RPL_ENDOFBANLIST (368) ---
  const _banBuffer = {}
  on('367', (msg) => {
    const channel = msg.params[1]
    const mask = msg.params[2]
    const setter = msg.params[3] || ''
    const time = msg.params[4] || ''
    if (!_banBuffer[channel]) _banBuffer[channel] = []
    _banBuffer[channel].push({ mask, setter, time })
  })
  on('368', (msg) => {
    const channel = msg.params[1]
    channels.setBanList(channel, _banBuffer[channel] || [])
    delete _banBuffer[channel]
  })

  // --- INVITE ---
  on('INVITE', (msg) => {
    const channel = msg.params[1]
    const from = msg.source?.nick
    const ch = channels.activeChannel
    if (ch) messages.addSystemMessage(ch, `${from} has invited you to ${channel}`, 'info')
  })

  // --- TAGMSG (reactions, typing) ---
  on('TAGMSG', (msg) => {
    const react = msg.tags['+draft/react']
    const typing = msg.tags['+typing']

    if (react) {
      const target = msg.params[0]
      const targetMsgId = msg.tags['+draft/reply']
      if (targetMsgId) messages.addReaction(target, targetMsgId, react)
    }

    if (typing) {
      client._emit('typing', {
        nick: msg.source?.nick,
        channel: msg.params[0],
        status: typing,
      })
    }
  })

  // --- CHATHISTORY (batch:end) ---
  on('batch:end', (batch) => {
    if (batch.type !== 'chathistory') return
    const channel = batch.target
    if (!channel) return

    // Check if this is a scrollback (BEFORE) batch:
    // If the channel already has messages and the batch messages are older, prepend
    const existingMsgs = messages.messagesByChannel[channel] || []
    const isPrepend = existingMsgs.length > 0 && batch.messages.length > 0 &&
      batch.messages[0].tags?.['time'] &&
      existingMsgs.some(m => m.msgid) // has existing server messages

    const parsedMsgs = []

    for (const msg of batch.messages) {
      if (msg.command !== 'PRIVMSG') continue

      const target = msg.params[0]
      const rawText = msg.params[1] || ''
      const text = stripFormatting(rawText)
      const nick = msg.source?.nick || '???'
      const time = msg.tags['time']
        ? formatTime(new Date(msg.tags['time']), settings.use24hTime)
        : formatTime(new Date(), settings.use24hTime)
      const _date = msg.tags['time'] ? new Date(msg.tags['time']).toDateString() : undefined

      // Skip service messages in history (hides passwords)
      if (nick === client.nick && SERVICE_NICKS.includes(target.toLowerCase())) continue
      if (SERVICE_NICKS.includes(nick.toLowerCase())) continue

      // Echo-aware DM routing for history
      let ch
      if (target.startsWith('#')) {
        ch = target
      } else if (nick === client.nick) {
        ch = target   // Outgoing DM: route to recipient
      } else {
        ch = nick     // Incoming DM: route to sender
      }

      if (text.startsWith('\x01ACTION ') && text.endsWith('\x01')) {
        const parsed = {
          id: msg.tags['msgid'] || Date.now() + Math.random(),
          nick, time, _date,
          text: text.slice(8, -1),
          isAction: true,
          msgid: msg.tags['msgid'],
          isHistory: true,
        }
        if (isPrepend) parsedMsgs.push(parsed)
        else messages.addMessage(ch, parsed)
      } else {
        const historyMsg = {
          id: msg.tags['msgid'] || Date.now() + Math.random(),
          nick, time, text, _date,
          msgid: msg.tags['msgid'],
          linkPreview: null,
          hasImage: false,
          imageUrl: null,
          isHistory: true,
        }
        // Detect inline images for history (no API unfurl calls)
        const urls = detectUrls(text)
        if (urls.length > 0 && settings.inlineImages && IMAGE_RE.test(urls[0].url)) {
          historyMsg.hasImage = true
          historyMsg.imageUrl = urls[0].url
        }
        if (isPrepend) parsedMsgs.push(historyMsg)
        else messages.addMessage(ch, historyMsg)
      }
    }

    // Prepend older messages for scrollback
    if (isPrepend && parsedMsgs.length) {
      messages.prependMessages(channel, parsedMsgs)
    }
  })

  // --- WHOIS ---
  const _whoisBuffer = {}
  on('whois', (msg) => {
    const nick = msg.params[1]
    if (!_whoisBuffer[nick]) _whoisBuffer[nick] = {}
    const w = _whoisBuffer[nick]

    if (msg.command === '311') {
      w.nick = msg.params[1]
      w.user = msg.params[2]
      w.host = msg.params[3]
      w.realname = msg.params[5]
    }
    if (msg.command === '312') w.server = msg.params[2]
    if (msg.command === '313') w.isOperator = true
    if (msg.command === '319') w.channels = msg.params[2]
    if (msg.command === '317') w.idle = parseInt(msg.params[2])
    if (msg.command === '330') w.account = msg.params[2]
    if (msg.command === '671') w.secure = true

    if (msg.command === '318') {
      const info = _whoisBuffer[nick]
      delete _whoisBuffer[nick]
      if (info && info.nick) {
        ui.openWhoisCard(info)
      }
    }
  })

  // --- Public API ---

  function connect(url, nick, opts = {}) {
    const sasl = connection.useSasl && connection.saslPassword
      ? { username: connection.saslUsername || nick || connection.nick, password: connection.saslPassword }
      : null
    client.connect(
      url || connection.gatewayUrl,
      nick || connection.nick,
      {
        password: opts.password || connection.password || null,
        realname: opts.realname || connection.realname,
        sasl,
      }
    )
  }

  function disconnect(reason) {
    client.disconnect(reason)
  }

  function sendInput(text) {
    if (!text.trim()) return

    const cmd = parseSlashCommand(text)
    if (cmd) {
      handleCommand(cmd)
      return
    }

    const channel = channels.activeChannel
    if (!channel) return

    const replyMsgId = messages.replyTarget?.msgid
    if (replyMsgId) {
      client.privmsgWithTags(channel, text, { '+draft/reply': replyMsgId })
    } else {
      client.privmsg(channel, text)
    }

    // Don't add locally if echo-message is supported (server will echo it back)
    if (!client._capAcked.includes('echo-message')) {
      const time = formatTime(new Date(), settings.use24hTime)
      messages.addMessage(channel, {
        id: Date.now() + Math.random(),
        nick: connection.nick,
        time, text,
        replyTo: messages.replyTarget
          ? { nick: messages.replyTarget.nick, text: messages.replyTarget.text.slice(0, 60) }
          : undefined,
      })
    }
    messages.clearReplyTarget()
  }

  function handleCommand(cmd) {
    const ch = channels.activeChannel

    switch (cmd.type) {
      case 'join':
        client.join(cmd.channel, cmd.key)
        break
      case 'part':
        client.part(cmd.channel || ch, cmd.reason)
        break
      case 'action':
        if (ch) {
          client.action(ch, cmd.text)
          if (!client._capAcked.includes('echo-message')) {
            messages.addMessage(ch, {
              id: Date.now(), nick: connection.nick,
              time: formatTime(new Date(), settings.use24hTime),
              text: cmd.text, isAction: true,
            })
          }
        }
        break
      case 'topic':
        if (ch) client.topic(ch, cmd.text)
        break
      case 'nick':
        if (cmd.nick) client.changeNick(cmd.nick)
        break
      case 'msg':
        if (cmd.target && cmd.text) {
          client.privmsg(cmd.target, cmd.text)
          if (!cmd.target.startsWith('#')) {
            channels.addChannel(cmd.target, 'Direct message')
          }
        }
        break
      case 'notice':
        if (cmd.target && cmd.text) client.notice(cmd.target, cmd.text)
        break
      case 'kick':
        if (ch && cmd.nick) client.kick(ch, cmd.nick, cmd.reason)
        break
      case 'ban':
        if (ch && cmd.mask) client.ban(ch, cmd.mask)
        break
      case 'unban':
        if (ch && cmd.mask) client.unban(ch, cmd.mask)
        break
      case 'mode':
        if (ch && cmd.args) client.mode(ch, cmd.args)
        break
      case 'invite':
        if (cmd.nick) client.invite(cmd.nick, cmd.channel || ch)
        break
      case 'whois':
        if (cmd.nick) client.whois(cmd.nick)
        break
      case 'list':
        client.list(cmd.filter)
        break
      case 'away':
        client.away(cmd.message)
        if (ch) {
          messages.addSystemMessage(ch, cmd.message ? `You are now away: ${cmd.message}` : 'You are no longer away', 'info')
        }
        break
      case 'clear':
        if (ch) messages.clearChannel(ch)
        break
      case 'connect':
        ui.connectionModalOpen = true
        break
      case 'help':
        if (ch) {
          for (const line of COMMAND_HELP) {
            messages.addSystemMessage(ch, line, 'info')
          }
        }
        break
      case 'quit':
        disconnect(cmd.reason)
        break
      case 'raw':
        if (cmd.line) client.sendRaw(cmd.line)
        break
      case 'unknown':
        messages.addSystemMessage(channels.activeChannel || '', `Unknown command: /${cmd.command}. Type /help for available commands.`, 'error')
        break
    }
  }

  onUnmounted(() => {
    for (const [event, handler] of _handlers) {
      client.off(event, handler)
    }
    _handlers.length = 0
  })

  return {
    connect,
    disconnect,
    sendInput,
    client,
  }
}
