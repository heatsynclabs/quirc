/**
 * Structured command definitions for the slash command palette
 */
export const COMMANDS = [
  { name: 'join', aliases: ['j'], args: '<#channel> [key]', desc: 'Join a channel', category: 'channel', example: '/join #general' },
  { name: 'part', aliases: ['leave'], args: '[#channel] [reason]', desc: 'Leave a channel', category: 'channel', example: '/part #random' },
  { name: 'me', aliases: [], args: '<action>', desc: 'Send an action', category: 'chat', example: '/me waves hello' },
  { name: 'topic', aliases: [], args: '[text]', desc: 'View or set channel topic', category: 'channel', example: '/topic Welcome to #general!' },
  { name: 'nick', aliases: [], args: '<newnick>', desc: 'Change your nick', category: 'utility', example: '/nick coolname' },
  { name: 'msg', aliases: ['query', 'privmsg'], args: '<target> <message>', desc: 'Send a private message', category: 'chat', example: '/msg alice Hey!' },
  { name: 'notice', aliases: [], args: '<target> <message>', desc: 'Send a notice', category: 'chat', example: '/notice #general Hello all' },
  { name: 'kick', aliases: [], args: '<nick> [reason]', desc: 'Kick a user (requires op)', category: 'admin', example: '/kick troll Spamming' },
  { name: 'ban', aliases: [], args: '<mask>', desc: 'Ban a user (requires op)', category: 'admin', example: '/ban troll!*@*' },
  { name: 'unban', aliases: [], args: '<mask>', desc: 'Unban a user (requires op)', category: 'admin', example: '/unban troll!*@*' },
  { name: 'mode', aliases: [], args: '<modes>', desc: 'Set channel/user modes', category: 'admin', example: '/mode +i' },
  { name: 'invite', aliases: [], args: '<nick> [#channel]', desc: 'Invite a user', category: 'channel', example: '/invite alice' },
  { name: 'whois', aliases: ['wi'], args: '<nick>', desc: 'Look up a user', category: 'utility', example: '/whois alice' },
  { name: 'list', aliases: [], args: '[filter]', desc: 'List channels on the server', category: 'channel', example: '/list' },
  { name: 'away', aliases: [], args: '[message]', desc: 'Set away status', category: 'utility', example: '/away On lunch' },
  { name: 'back', aliases: [], args: '', desc: 'Clear away status', category: 'utility', example: '/back' },
  { name: 'clear', aliases: [], args: '', desc: 'Clear message history', category: 'utility', example: '/clear' },
  { name: 'connect', aliases: ['server'], args: '', desc: 'Open connection dialog', category: 'utility', example: '/connect' },
  { name: 'disconnect', aliases: ['quit'], args: '[reason]', desc: 'Disconnect from server', category: 'utility', example: '/disconnect' },
  { name: 'raw', aliases: ['quote'], args: '<command>', desc: 'Send raw IRC command', category: 'utility', example: '/raw PRIVMSG #test :hello' },
  { name: 'help', aliases: [], args: '', desc: 'Show command help', category: 'utility', example: '/help' },
]

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
      return { type: 'unknown', command: cmd }
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
