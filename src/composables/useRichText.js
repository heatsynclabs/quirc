/**
 * Rich text parsing composable
 * Parses markdown-ish formatting in IRC messages
 */
export function useRichText() {
  function parseCodeBlocks(text) {
    const parts = []
    const re = /```([\s\S]*?)```/g
    let last = 0
    let m

    while ((m = re.exec(text)) !== null) {
      if (m.index > last) {
        parts.push({ type: 'text', value: text.slice(last, m.index) })
      }
      parts.push({ type: 'code', value: m[1].trim() })
      last = m.index + m[0].length
    }

    if (last < text.length) {
      parts.push({ type: 'text', value: text.slice(last) })
    }

    return parts
  }

  function parseInlineCode(text) {
    return text.split(/(`[^`]+`)/g).map(s => {
      if (s.startsWith('`') && s.endsWith('`')) {
        return { type: 'inline', value: s.slice(1, -1) }
      }
      return { type: 'plain', value: s }
    }).filter(s => s.value)
  }

  return {
    parseCodeBlocks,
    parseInlineCode,
  }
}
