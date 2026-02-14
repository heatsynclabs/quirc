/**
 * IRCv3 message parser
 * Parses raw IRC messages into structured objects
 */
export function parseMessage(raw) {
  let idx = 0
  const msg = {
    tags: {},
    source: null,
    command: '',
    params: [],
  }

  // Tags
  if (raw[idx] === '@') {
    const end = raw.indexOf(' ', idx)
    const tagStr = raw.slice(idx + 1, end)
    for (const tag of tagStr.split(';')) {
      const eqIdx = tag.indexOf('=')
      if (eqIdx === -1) {
        msg.tags[tag] = true
      } else {
        msg.tags[tag.slice(0, eqIdx)] = unescapeTagValue(tag.slice(eqIdx + 1))
      }
    }
    idx = end + 1
  }

  // Skip leading spaces
  while (raw[idx] === ' ') idx++

  // Source (prefix)
  if (raw[idx] === ':') {
    const end = raw.indexOf(' ', idx)
    msg.source = parseSource(raw.slice(idx + 1, end))
    idx = end + 1
  }

  // Skip leading spaces
  while (raw[idx] === ' ') idx++

  // Command
  const cmdEnd = raw.indexOf(' ', idx)
  if (cmdEnd === -1) {
    msg.command = raw.slice(idx).toUpperCase()
    return msg
  }
  msg.command = raw.slice(idx, cmdEnd).toUpperCase()
  idx = cmdEnd + 1

  // Params
  while (idx < raw.length) {
    while (raw[idx] === ' ') idx++
    if (idx >= raw.length) break

    if (raw[idx] === ':') {
      msg.params.push(raw.slice(idx + 1))
      break
    }

    const end = raw.indexOf(' ', idx)
    if (end === -1) {
      msg.params.push(raw.slice(idx))
      break
    }
    msg.params.push(raw.slice(idx, end))
    idx = end + 1
  }

  return msg
}

function parseSource(src) {
  const bangIdx = src.indexOf('!')
  const atIdx = src.indexOf('@')
  if (bangIdx === -1) return { nick: src, user: null, host: null }
  return {
    nick: src.slice(0, bangIdx),
    user: src.slice(bangIdx + 1, atIdx === -1 ? undefined : atIdx),
    host: atIdx === -1 ? null : src.slice(atIdx + 1),
  }
}

function unescapeTagValue(val) {
  return val
    .replace(/\\:/g, ';')
    .replace(/\\s/g, ' ')
    .replace(/\\\\/g, '\\')
    .replace(/\\r/g, '\r')
    .replace(/\\n/g, '\n')
}

export function formatMessage(command, params = []) {
  if (params.length === 0) return command
  const last = params[params.length - 1]
  const rest = params.slice(0, -1)
  const needsColon = last.includes(' ') || last.startsWith(':')
  return [...rest, needsColon ? `:${last}` : last].join(' ').replace(/^/, `${command} `)
}
