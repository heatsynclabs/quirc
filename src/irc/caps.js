/**
 * IRCv3 CAP negotiation stub
 */
export const DESIRED_CAPS = [
  'message-tags',
  'server-time',
  'batch',
  'echo-message',
  'labeled-response',
  'sasl',
  'chathistory',
  'away-notify',
  'account-notify',
  'draft/reply',
  'draft/react',
  'typing',
]

export function negotiateCaps(client, availableCaps) {
  const requested = DESIRED_CAPS.filter(c => availableCaps.includes(c))
  if (requested.length) {
    client.send(`CAP REQ :${requested.join(' ')}`)
  }
  return requested
}

export function handleCapResponse(msg) {
  // Stub: parse CAP LS, CAP ACK, CAP NAK
  return {
    subcommand: msg.params?.[1] || '',
    caps: (msg.params?.[2] || '').split(' ').filter(Boolean),
  }
}
