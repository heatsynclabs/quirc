/**
 * mIRC color/formatting parser
 * Strips mIRC formatting codes and returns plain text
 */
const MIRC_COLORS = [
  '#fff', '#000', '#00007f', '#009300',
  '#ff0000', '#7f0000', '#9c009c', '#fc7f00',
  '#ffff00', '#00fc00', '#009393', '#00ffff',
  '#0000fc', '#ff00ff', '#7f7f7f', '#d2d2d2',
]

// Control codes
const BOLD = '\x02'
const ITALIC = '\x1D'
const UNDERLINE = '\x1F'
const STRIKETHROUGH = '\x1E'
const COLOR = '\x03'
const RESET = '\x0F'
const REVERSE = '\x16'
const MONOSPACE = '\x11'

export function stripFormatting(text) {
  return text
    .replace(/\x03(\d{1,2}(,\d{1,2})?)?/g, '')
    .replace(/[\x02\x1D\x1F\x1E\x0F\x16\x11]/g, '')
}

export function parseFormatting(text) {
  // For MVP, just strip formatting and return plain text
  return stripFormatting(text)
}

export { MIRC_COLORS }
