/**
 * Slash command parser
 */
export function parseSlashCommand(input) {
  if (!input.startsWith('/')) return null

  const spaceIdx = input.indexOf(' ')
  const cmd = (spaceIdx === -1 ? input.slice(1) : input.slice(1, spaceIdx)).toLowerCase()
  const args = spaceIdx === -1 ? '' : input.slice(spaceIdx + 1)

  switch (cmd) {
    case 'join':
    case 'j':
      return { type: 'join', channel: args.startsWith('#') ? args.split(' ')[0] : `#${args.split(' ')[0]}`, key: args.split(' ')[1] || '' }
    case 'part':
    case 'leave':
      return { type: 'part', channel: args.startsWith('#') ? args : null, reason: args.startsWith('#') ? '' : args }
    case 'me':
      return { type: 'action', text: args }
    case 'topic':
      return { type: 'topic', text: args || undefined }
    case 'nick':
      return { type: 'nick', nick: args.trim() }
    case 'msg':
    case 'query':
    case 'privmsg': {
      const sp = args.indexOf(' ')
      if (sp === -1) return { type: 'msg', target: args, text: '' }
      return { type: 'msg', target: args.slice(0, sp), text: args.slice(sp + 1) }
    }
    case 'notice': {
      const sp = args.indexOf(' ')
      if (sp === -1) return { type: 'notice', target: args, text: '' }
      return { type: 'notice', target: args.slice(0, sp), text: args.slice(sp + 1) }
    }
    case 'quit':
    case 'disconnect':
      return { type: 'quit', reason: args || 'Leaving' }
    case 'kick': {
      const parts = args.split(' ')
      return { type: 'kick', nick: parts[0], reason: parts.slice(1).join(' ') }
    }
    case 'ban':
      return { type: 'ban', mask: args }
    case 'unban':
      return { type: 'unban', mask: args }
    case 'mode':
      return { type: 'mode', args }
    case 'invite': {
      const parts = args.split(' ')
      return { type: 'invite', nick: parts[0], channel: parts[1] || null }
    }
    case 'whois':
    case 'wi':
      return { type: 'whois', nick: args.trim() }
    case 'list':
      return { type: 'list', filter: args }
    case 'away':
      return { type: 'away', message: args }
    case 'back':
      return { type: 'away', message: '' }
    case 'clear':
      return { type: 'clear' }
    case 'connect':
    case 'server':
      return { type: 'connect' }
    case 'help':
      return { type: 'help' }
    case 'raw':
    case 'quote':
      return { type: 'raw', line: args }
    default:
      // Treat unknown /commands as raw IRC
      return { type: 'raw', line: `${cmd.toUpperCase()} ${args}`.trim() }
  }
}

export const COMMAND_HELP = [
  '/join <#channel> [key] - Join a channel',
  '/part [#channel] [reason] - Leave a channel',
  '/me <action> - Send an action',
  '/nick <newnick> - Change your nick',
  '/msg <target> <message> - Send a private message',
  '/notice <target> <message> - Send a notice',
  '/topic [text] - View or set channel topic',
  '/kick <nick> [reason] - Kick a user',
  '/ban <mask> - Ban a user',
  '/unban <mask> - Unban a user',
  '/mode <modes> - Set channel/user modes',
  '/invite <nick> [#channel] - Invite a user',
  '/whois <nick> - Look up a user',
  '/list - List channels on the server',
  '/away [message] - Set away status',
  '/back - Clear away status',
  '/clear - Clear message history',
  '/disconnect [reason] - Disconnect from server',
  '/raw <command> - Send raw IRC command',
]
