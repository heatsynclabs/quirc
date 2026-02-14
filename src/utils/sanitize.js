const MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

export function sanitizeHtml(str) {
  return str.replace(/[&<>"']/g, ch => MAP[ch])
}
