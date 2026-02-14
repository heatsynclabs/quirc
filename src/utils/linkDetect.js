const URL_RE = /https?:\/\/[^\s<>"')\]]+/g

export function detectUrls(text) {
  const matches = []
  let m
  while ((m = URL_RE.exec(text)) !== null) {
    matches.push({
      url: m[0],
      start: m.index,
      end: m.index + m[0].length,
    })
  }
  URL_RE.lastIndex = 0
  return matches
}
