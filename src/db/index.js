import Dexie from 'dexie'

const db = new Dexie('quirc')

db.version(2).stores({
  messages: '++id, channel, nick, time, [channel+time], msgid',
  channels: '&name, lastRead',
  settings: '&key',
  unfurlCache: '&url, fetchedAt',
})

export default db
