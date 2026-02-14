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
      messages.addSystemMessage(channel, `Reconnecting in ${delay / 1000}s (attempt ${attempt})...`)
    }
  })

  // --- Registered (001) ---
  on('registered', (msg) => {
    _nickAttempt = 0
    connection.setNick(client.nick)
    for (const ch of connection.autoJoinChannels) {
      client.join(ch)
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
  on('nick:error', ({ code, nick, message }) => {
    if (code === '433' && client.status !== 'connected') {
      _nickAttempt++
      const altNick = `${connection.nick}_${_nickAttempt}`
      client.changeNick(altNick)
      const ch = channels.activeChannel
      if (ch) messages.addSystemMessage(ch, `Nick "${nick}" is already in use, trying "${altNick}"...`)
    } else {
      const ch = channels.activeChannel
      if (ch) messages.addSystemMessage(ch, `Nick error: ${message}`)
    }
  })

  // --- Channel errors ---
  on('channel:error', ({ channel, message }) => {
    const ch = channels.activeChannel || channel
    if (ch) messages.addSystemMessage(ch, `Channel error for ${channel}: ${message}`)
  })

  // --- General/permission errors ---
  on('error', ({ target, message }) => {
    const ch = channels.activeChannel
    if (ch) messages.addSystemMessage(ch, `Error: ${message}${target ? ` (${target})` : ''}`)
  })

  // --- SASL ---
  on('sasl:success', () => {
    const ch = channels.activeChannel
    if (ch) messages.addSystemMessage(ch, 'SASL authentication successful')
  })
  on('sasl:fail', (reason) => {
    const ch = channels.activeChannel
    if (ch) messages.addSystemMessage(ch, `SASL authentication failed: ${reason}`)
  })

  // --- PRIVMSG ---
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

    // Determine target channel (DMs come with our nick as target)
    const channel = target.startsWith('#') ? target : nick

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
      channels.addChannel(nick, 'Direct message')
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
    const channel = target.startsWith('#') ? target : (channels.activeChannel || '#general')

    messages.addSystemMessage(channel, `[${nick}] ${text}`)
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
      client.who(channel)
      client.chathistory(channel, 100)
    } else {
      usersStore.addUser(channel, nick)
      if (settings.showJoinPart) {
        messages.addSystemMessage(channel, `${nick} has joined ${channel}`)
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
        messages.addSystemMessage(channel, `${nick} has left ${channel}${reason ? ` (${reason})` : ''}`)
      }
    }
  })

  // --- KICK ---
  on('KICK', (msg) => {
    const channel = msg.params[0]
    const kicked = msg.params[1]
    const kicker = msg.source?.nick
    const reason = msg.params[2] || ''

    messages.addSystemMessage(channel, `${kicked} was kicked by ${kicker}${reason ? `: ${reason}` : ''}`)

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
          messages.addSystemMessage(ch.name, `${nick} has quit${reason ? ` (${reason})` : ''}`)
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
        messages.addSystemMessage(ch.name, `${oldNick} is now known as ${newNick}`)
      }
    }
  })

  // --- TOPIC ---
  on('TOPIC', (msg) => {
    const channel = msg.params[0]
    const topic = msg.params[1] || ''
    const nick = msg.source?.nick
    channels.setTopic(channel, topic)
    messages.addSystemMessage(channel, `${nick} changed the topic to: ${topic}`)
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
  on('MODE', (msg) => {
    const target = msg.params[0]
    if (!target.startsWith('#')) return
    const modeStr = msg.params[1] || ''
    const modeArgs = msg.params.slice(2)
    let adding = true, argIdx = 0

    for (const ch of modeStr) {
      if (ch === '+') { adding = true; continue }
      if (ch === '-') { adding = false; continue }
      if (ch === 'o') {
        const nick = modeArgs[argIdx++]
        if (nick) {
          usersStore.setOp(target, nick, adding)
          if (nick === client.nick) connection.setOp(adding)
        }
      }
      if (ch === 'v') {
        const nick = modeArgs[argIdx++]
        if (nick) usersStore.setVoiced(target, nick, adding)
      }
    }

    const setter = msg.source?.nick || 'server'
    messages.addSystemMessage(target, `${setter} sets mode ${modeStr} ${modeArgs.join(' ')}`.trim())
  })

  // --- INVITE ---
  on('INVITE', (msg) => {
    const channel = msg.params[1]
    const from = msg.source?.nick
    const ch = channels.activeChannel
    if (ch) messages.addSystemMessage(ch, `${from} has invited you to ${channel}`)
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

    for (const msg of batch.messages) {
      if (msg.command !== 'PRIVMSG') continue

      const target = msg.params[0]
      const rawText = msg.params[1] || ''
      const text = stripFormatting(rawText)
      const nick = msg.source?.nick || '???'
      const time = msg.tags['time']
        ? formatTime(new Date(msg.tags['time']), settings.use24hTime)
        : formatTime(new Date(), settings.use24hTime)

      const ch = target.startsWith('#') ? target : nick

      if (text.startsWith('\x01ACTION ') && text.endsWith('\x01')) {
        messages.addMessage(ch, {
          id: msg.tags['msgid'] || Date.now() + Math.random(),
          nick, time,
          text: text.slice(8, -1),
          isAction: true,
          msgid: msg.tags['msgid'],
          isHistory: true,
        })
      } else {
        messages.addMessage(ch, {
          id: msg.tags['msgid'] || Date.now() + Math.random(),
          nick, time, text,
          msgid: msg.tags['msgid'],
          linkPreview: null,
          hasImage: false,
          imageUrl: null,
          isHistory: true,
        })
      }
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
      const ch = channels.activeChannel
      if (ch && info.nick) {
        const parts = [`WHOIS ${info.nick} (${info.user}@${info.host})`]
        if (info.realname) parts.push(`Real name: ${info.realname}`)
        if (info.server) parts.push(`Server: ${info.server}`)
        if (info.channels) parts.push(`Channels: ${info.channels}`)
        if (info.account) parts.push(`Account: ${info.account}`)
        if (info.secure) parts.push('Using a secure connection')
        if (info.isOperator) parts.push('Is an IRC operator')
        if (info.idle) parts.push(`Idle: ${Math.floor(info.idle / 60)}m`)
        for (const line of parts) {
          messages.addSystemMessage(ch, line)
        }
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
          messages.addSystemMessage(ch, cmd.message ? `You are now away: ${cmd.message}` : 'You are no longer away')
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
            messages.addSystemMessage(ch, line)
          }
        }
        break
      case 'quit':
        disconnect(cmd.reason)
        break
      case 'raw':
        if (cmd.line) client.sendRaw(cmd.line)
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
