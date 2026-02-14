const NICK_COLORS = [
  '#e85d3b', '#f0c040', '#6bcb77', '#4d96ff', '#ff922b',
  '#cc5de8', '#20c997', '#ff6b9d', '#a9e34b', '#748ffc',
]

export function getNickColor(nick) {
  let hash = 0
  for (let i = 0; i < nick.length; i++) {
    hash = nick.charCodeAt(i) + ((hash << 5) - hash)
  }
  return NICK_COLORS[Math.abs(hash) % NICK_COLORS.length]
}
