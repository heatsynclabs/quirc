export function formatTime(date, use24h = true) {
  if (typeof date === 'string') return date
  const d = date instanceof Date ? date : new Date(date)
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: !use24h,
  })
}
