import { parseMessage } from './parser'

const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000, 30000]

export class IRCClient {
  constructor() {
    this.ws = null
    this.status = 'disconnected'
    this.handlers = new Map()
    this.nick = null
    this.server = null
    this.password = null
    this.realname = 'QUIRC User'
    this.sasl = null // { username, password } or null
    this._reconnectAttempt = 0
    this._reconnectTimer = null
    this._shouldReconnect = false
    this._saslInProgress = false
    this._capAcked = []
    this._motdBuffer = []
    this._batches = {} // id -> { type, target, messages[] }
  }

  connect(url, nick, { password = null, realname = 'QUIRC User', sasl = null } = {}) {
    this._shouldReconnect = true
    this._reconnectAttempt = 0
    this.nick = nick
    this.password = password
    this.realname = realname
    this.sasl = sasl
    this._doConnect(url)
  }

  _doConnect(url) {
    if (this.ws) {
      this.ws.onclose = null
      this.ws.close()
    }

    this.server = url
    this._setStatus('connecting')
    this._saslInProgress = false
    this._capAcked = []
    this._motdBuffer = []
    this._batches = {}

    try {
      this.ws = new WebSocket(url)
    } catch (e) {
      this._setStatus('error', `Failed to connect: ${e.message}`)
      this._scheduleReconnect()
      return
    }

    this.ws.onopen = () => {
      this._reconnectAttempt = 0
      this.sendRaw('CAP LS 302')
      if (this.password) {
        this.sendRaw(`PASS ${this.password}`)
      }
      this.sendRaw(`NICK ${this.nick}`)
      this.sendRaw(`USER ${this.nick} 0 * :${this.realname}`)
    }

    this.ws.onmessage = (event) => {
      const lines = event.data.split('\r\n').filter(Boolean)
      for (const line of lines) {
        this._emit('raw:line', line)
        const msg = parseMessage(line)
        this._handleMessage(msg, line)
      }
    }

    this.ws.onerror = () => {}

    this.ws.onclose = (event) => {
      if (this.status !== 'disconnected' && this.status !== 'error') {
        this._setStatus('disconnected')
      }
      this._emit('closed', event.code, event.reason)
      this._scheduleReconnect()
    }
  }

  disconnect(reason = 'Leaving') {
    this._shouldReconnect = false
    clearTimeout(this._reconnectTimer)
    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.sendRaw(`QUIT :${reason}`)
      }
      this.ws.onclose = null
      this.ws.close()
      this.ws = null
    }
    this._setStatus('disconnected')
  }

  _scheduleReconnect() {
    if (!this._shouldReconnect) return
    const delay = RECONNECT_DELAYS[Math.min(this._reconnectAttempt, RECONNECT_DELAYS.length - 1)]
    this._reconnectAttempt++
    this._emit('reconnecting', delay, this._reconnectAttempt)
    this._reconnectTimer = setTimeout(() => {
      if (this._shouldReconnect) {
        this._doConnect(this.server)
      }
    }, delay)
  }

  _handleMessage(msg, raw) {
    if (msg.command === 'PING') {
      this.sendRaw(`PONG :${msg.params[0] || ''}`)
      return
    }

    if (msg.command === 'CAP') {
      this._handleCap(msg)
      return
    }

    if (msg.command === 'AUTHENTICATE') {
      this._handleAuthenticate(msg)
      return
    }

    // SASL success
    if (msg.command === '903') {
      this._saslInProgress = false
      this._emit('sasl:success')
      this.sendRaw('CAP END')
      return
    }

    // SASL failure
    if (msg.command === '904' || msg.command === '905') {
      this._saslInProgress = false
      this._emit('sasl:fail', msg.params.slice(1).join(' '))
      this.sendRaw('CAP END')
      return
    }

    // RPL_WELCOME (001)
    if (msg.command === '001') {
      this._setStatus('connected')
      this._emit('registered', msg)
      return
    }

    // RPL_MYINFO (004) - server info
    if (msg.command === '004') {
      this._emit('serverinfo', {
        serverName: msg.params[1],
        version: msg.params[2],
      })
      return
    }

    // RPL_ISUPPORT (005)
    if (msg.command === '005') {
      this._emit('isupport', msg.params.slice(1, -1))
      return
    }

    // MOTD
    if (msg.command === '375') { // RPL_MOTDSTART
      this._motdBuffer = []
      return
    }
    if (msg.command === '372') { // RPL_MOTD
      this._motdBuffer.push(msg.params[1] || '')
      return
    }
    if (msg.command === '376' || msg.command === '422') { // RPL_ENDOFMOTD / ERR_NOMOTD
      this._emit('motd', this._motdBuffer)
      this._motdBuffer = []
      return
    }

    // Nick errors
    if (msg.command === '431' || msg.command === '432' || msg.command === '433' || msg.command === '436') {
      this._emit('nick:error', {
        code: msg.command,
        nick: msg.params[1],
        message: msg.params[msg.params.length - 1],
      })
      return
    }

    // Channel errors
    if (msg.command === '403' || msg.command === '405' || msg.command === '471' ||
        msg.command === '473' || msg.command === '474' || msg.command === '475') {
      this._emit('channel:error', {
        code: msg.command,
        channel: msg.params[1],
        message: msg.params[msg.params.length - 1],
      })
      return
    }

    // General errors (401-406 range)
    if (msg.command === '401' || msg.command === '402' || msg.command === '404' || msg.command === '406') {
      this._emit('error', {
        code: msg.command,
        target: msg.params[1],
        message: msg.params[msg.params.length - 1],
      })
      return
    }

    // Permission errors
    if (msg.command === '481' || msg.command === '482') {
      this._emit('error', {
        code: msg.command,
        target: msg.params[1],
        message: msg.params[msg.params.length - 1],
      })
      return
    }

    // WHOIS responses
    if (['311', '312', '313', '317', '318', '319', '330', '338', '671'].includes(msg.command)) {
      this._emit('whois:' + msg.command, msg)
      this._emit('whois', msg)
      return
    }

    // LIST responses
    if (msg.command === '322') { // RPL_LIST
      this._emit('list:entry', {
        channel: msg.params[1],
        users: parseInt(msg.params[2]) || 0,
        topic: msg.params[3] || '',
      })
      return
    }
    if (msg.command === '323') { // RPL_LISTEND
      this._emit('list:end')
      return
    }

    // BATCH start/end
    if (msg.command === 'BATCH') {
      const ref = msg.params[0]
      if (ref.startsWith('+')) {
        const id = ref.slice(1)
        this._batches[id] = {
          type: msg.params[1] || '',
          target: msg.params[2] || '',
          messages: [],
        }
      } else if (ref.startsWith('-')) {
        const id = ref.slice(1)
        const batch = this._batches[id]
        if (batch) {
          delete this._batches[id]
          this._emit('batch:end', batch)
        }
      }
      return
    }

    // If message belongs to a batch, collect it
    if (msg.tags.batch && this._batches[msg.tags.batch]) {
      this._batches[msg.tags.batch].messages.push(msg)
      return
    }

    // Emit for everything else
    this._emit('raw', msg, raw)
    this._emit(msg.command, msg)
  }

  _handleCap(msg) {
    const sub = msg.params[1]

    if (sub === 'LS') {
      const capsStr = msg.params[msg.params.length - 1] || ''
      const available = capsStr.split(' ').filter(Boolean)
      const want = [
        'message-tags', 'server-time', 'batch', 'echo-message',
        'labeled-response', 'sasl', 'chathistory', 'away-notify',
        'account-notify', 'draft/reply', 'draft/react', 'typing',
      ]
      const request = want.filter(c => available.includes(c))
      if (request.length) {
        this.sendRaw(`CAP REQ :${request.join(' ')}`)
      } else {
        this.sendRaw('CAP END')
      }
      this._emit('cap:ls', available)
    }

    if (sub === 'ACK') {
      const acked = (msg.params[msg.params.length - 1] || '').split(' ').filter(Boolean)
      this._capAcked.push(...acked)
      this._emit('cap:ack', acked)

      // If SASL was acked and we have credentials, start SASL
      if (acked.includes('sasl') && this.sasl) {
        this._saslInProgress = true
        this.sendRaw('AUTHENTICATE PLAIN')
      } else {
        this.sendRaw('CAP END')
      }
    }

    if (sub === 'NAK') {
      this._emit('cap:nak', (msg.params[msg.params.length - 1] || '').split(' '))
      this.sendRaw('CAP END')
    }
  }

  _handleAuthenticate(msg) {
    if (msg.params[0] === '+') {
      // Server is ready for SASL PLAIN credentials
      const user = this.sasl?.username || this.nick
      const pass = this.sasl?.password || ''
      const payload = btoa(`${user}\0${user}\0${pass}`)
      this.sendRaw(`AUTHENTICATE ${payload}`)
    }
  }

  sendRaw(line) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(line + '\r\n')
    }
  }

  join(channel, key = '') {
    this.sendRaw(`JOIN ${channel}${key ? ` ${key}` : ''}`)
  }

  part(channel, reason = '') {
    this.sendRaw(`PART ${channel}${reason ? ` :${reason}` : ''}`)
  }

  privmsg(target, text) {
    this.sendRaw(`PRIVMSG ${target} :${text}`)
  }

  notice(target, text) {
    this.sendRaw(`NOTICE ${target} :${text}`)
  }

  tagmsg(target, tags) {
    if (!this._capAcked.includes('message-tags')) return
    const tagStr = Object.entries(tags)
      .map(([k, v]) => (v === true ? k : `${k}=${v}`))
      .join(';')
    this.sendRaw(`@${tagStr} TAGMSG ${target}`)
  }

  privmsgWithTags(target, text, tags) {
    const tagStr = Object.entries(tags)
      .map(([k, v]) => (v === true ? k : `${k}=${v}`))
      .join(';')
    this.sendRaw(`@${tagStr} PRIVMSG ${target} :${text}`)
  }

  action(target, text) {
    this.sendRaw(`PRIVMSG ${target} :\x01ACTION ${text}\x01`)
  }

  topic(channel, text) {
    if (text !== undefined) {
      this.sendRaw(`TOPIC ${channel} :${text}`)
    } else {
      this.sendRaw(`TOPIC ${channel}`)
    }
  }

  changeNick(nick) {
    this.nick = nick
    this.sendRaw(`NICK ${nick}`)
  }

  who(channel) {
    this.sendRaw(`WHO ${channel}`)
  }

  whois(nick) {
    this.sendRaw(`WHOIS ${nick}`)
  }

  kick(channel, nick, reason = '') {
    this.sendRaw(`KICK ${channel} ${nick}${reason ? ` :${reason}` : ''}`)
  }

  ban(channel, mask) {
    this.sendRaw(`MODE ${channel} +b ${mask}`)
  }

  unban(channel, mask) {
    this.sendRaw(`MODE ${channel} -b ${mask}`)
  }

  mode(target, modes = '') {
    this.sendRaw(`MODE ${target}${modes ? ` ${modes}` : ''}`)
  }

  invite(nick, channel) {
    this.sendRaw(`INVITE ${nick} ${channel}`)
  }

  list(filter = '') {
    this.sendRaw(`LIST${filter ? ` ${filter}` : ''}`)
  }

  away(message = '') {
    this.sendRaw(`AWAY${message ? ` :${message}` : ''}`)
  }

  chathistory(target, limit = 100) {
    if (!this._capAcked.includes('chathistory')) return
    this.sendRaw(`CHATHISTORY LATEST ${target} * ${limit}`)
  }

  chathistoryBefore(target, msgid, limit = 100) {
    if (!this._capAcked.includes('chathistory')) return false
    this.sendRaw(`CHATHISTORY BEFORE ${target} msgid=${msgid} ${limit}`)
    return true
  }

  on(event, handler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, [])
    }
    this.handlers.get(event).push(handler)
  }

  off(event, handler) {
    const handlers = this.handlers.get(event)
    if (handlers) {
      const idx = handlers.indexOf(handler)
      if (idx !== -1) handlers.splice(idx, 1)
    }
  }

  _emit(event, ...args) {
    const handlers = this.handlers.get(event) || []
    for (const h of handlers) {
      try { h(...args) } catch (e) { console.error(`[IRC handler error: ${event}]`, e) }
    }
  }

  _setStatus(s, error = '') {
    this.status = s
    this._emit('status', s, error)
  }
}

let _instance = null

export function getClient() {
  if (!_instance) _instance = new IRCClient()
  return _instance
}
