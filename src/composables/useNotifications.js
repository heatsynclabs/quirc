export function useNotifications() {
  function requestPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }

  function notify(title, body) {
    if (!('Notification' in window)) return
    if (Notification.permission !== 'granted') return
    if (document.visibilityState !== 'hidden') return

    new Notification(title, { body, icon: '/favicon.svg' })
  }

  return {
    requestPermission,
    notify,
  }
}
