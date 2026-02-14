/**
 * IRCv3 CAP helpers
 * The desired caps list is defined in client.js _handleCap().
 */

export function negotiateCaps(client, availableCaps) {
  // Delegation: client.js handles CAP LS/REQ internally
  return availableCaps
}

export function handleCapResponse(msg) {
  return {
    subcommand: msg.params?.[1] || '',
    caps: (msg.params?.[2] || '').split(' ').filter(Boolean),
  }
}
