export const PALETTE = {
  pink: '#FF2E63',
  teal: '#08D9D6',
  acid: '#EAFF00',
}

export const BITMAPS = {
  Q: [
    'XXXXXXXX', 'XXXXXXXX', 'XX....XX', 'XX....XX',
    'XX..XXXX', 'XX...XXX', 'XXXXXXXX', '.XXXXXXX',
    '....XXXX', '.....XXX',
  ],
  U: [
    'XX....XX', 'XX....XX', 'XX....XX', 'XX....XX',
    'XX....XX', 'XX....XX', 'XXXXXXXX', 'XXXXXXXX',
  ],
  I: [
    'XXXXXX', 'XXXXXX', '..XX..', '..XX..',
    '..XX..', '..XX..', 'XXXXXX', 'XXXXXX',
  ],
  R: [
    'XXXXXX..', 'XXXXXXX.', 'XX...XXX', 'XX..XXX.',
    'XXXXXX..', 'XX.XX...', 'XX..XX..', 'XX...XX.',
  ],
  C: [
    '.XXXXXXX', 'XXXXXXXX', 'XXX.....', 'XX......',
    'XX......', 'XXX.....', 'XXXXXXXX', '.XXXXXXX',
  ],
}

function extractPixels(bitmap, ox, oy, cell) {
  const pixels = []
  bitmap.forEach((row, y) => {
    ;[...row].forEach((ch, x) => {
      if (ch === 'X') pixels.push({ x: ox + x * cell, y: oy + y * cell })
    })
  })
  return pixels
}

export function buildLogoPixels(px, gap) {
  const cell = px + gap
  const spc = cell

  const quPixels = []
  const ircPixels = []

  // QU row
  quPixels.push(...extractPixels(BITMAPS.Q, 0, 0, cell))
  const qW = BITMAPS.Q[0].length * cell
  quPixels.push(...extractPixels(BITMAPS.U, qW + spc, 0, cell))

  // IRC row
  const row2Y = BITMAPS.Q.length * cell + spc
  let cx = 0
  for (const letter of ['I', 'R', 'C']) {
    ircPixels.push(...extractPixels(BITMAPS[letter], cx, row2Y, cell))
    cx += BITMAPS[letter][0].length * cell + spc
  }

  const ircEndX = cx - spc
  const uW = BITMAPS.U[0].length * cell
  const row1W = qW + spc + uW
  const iconW = Math.max(row1W, ircEndX)
  const ircH = BITMAPS.I.length * cell
  const iconH = row2Y + ircH

  // cursor block
  const cursorGap = cell * 0.5
  const cursorX = ircEndX + cursorGap
  const cursorW = px * 2.5
  const cursorH = ircH

  return { quPixels, ircPixels, cursorX, cursorY: row2Y, cursorW, cursorH, iconW, iconH, px }
}
