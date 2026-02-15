import db from './index.js'

/**
 * Save messages to IndexedDB. Skips duplicates by msgid.
 */
export async function saveMessages(channel, messages) {
  if (!messages.length) return
  const toSave = messages
    .filter(m => m.msgid) // only persist server-identified messages
    .map(m => ({
      channel,
      nick: m.nick,
      time: m.time,
      text: m.text,
      msgid: m.msgid,
      isAction: m.isAction || false,
      hasImage: m.hasImage || false,
      imageUrl: m.imageUrl || null,
      replyToId: m.replyToId || null,
      _date: m._date || null,
    }))
  if (!toSave.length) return

  // Check which msgids already exist to avoid duplicates
  const msgids = toSave.map(m => m.msgid)
  const existing = await db.messages.where('msgid').anyOf(msgids).toArray()
  const existingIds = new Set(existing.map(m => m.msgid))
  const newMsgs = toSave.filter(m => !existingIds.has(m.msgid))
  if (newMsgs.length) {
    await db.messages.bulkAdd(newMsgs).catch(() => {})
  }
}

/**
 * Load recent messages from IndexedDB for a channel.
 */
export async function loadMessages(channel, limit = 200) {
  // Get the most recent messages by reverse primary key order, then reverse back to chronological
  const rows = await db.messages
    .where('channel')
    .equals(channel)
    .reverse()
    .limit(limit)
    .toArray()
  rows.reverse()

  return rows.map(row => ({
    id: row.msgid || row.id,
    nick: row.nick,
    time: row.time,
    text: row.text,
    msgid: row.msgid,
    isAction: row.isAction || false,
    hasImage: row.hasImage || false,
    imageUrl: row.imageUrl || null,
    replyToId: row.replyToId || null,
    _date: row._date || null,
    isHistory: true,
    linkPreview: null,
  }))
}

/**
 * Get the oldest message's msgid for a channel (for CHATHISTORY BEFORE pagination).
 */
export async function getOldestMessageId(channel) {
  const row = await db.messages
    .where('channel')
    .equals(channel)
    .first()
  return row?.msgid || null
}

/**
 * Clear all messages for a channel.
 */
export async function clearChannel(channel) {
  await db.messages.where('channel').equals(channel).delete()
}
