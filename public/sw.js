self.addEventListener('push', function(event) {
  try {
    const data = event.data ? event.data.json() : { title: 'Notification', message: '' };
    const title = data.title || 'Notification';
    const options = {
      body: data.message || '',
      data: { url: data.url || '/' },
      tag: data.tag || undefined,
      renotify: false
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch (e) {
    console.error('Error handling push event', e);
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const url = event.notification.data && event.notification.data.url ? event.notification.data.url : '/';
  event.waitUntil(clients.matchAll({ type: 'window' }).then(windowClients => {
    for (let i = 0; i < windowClients.length; i++) {
      const client = windowClients[i];
      if (client.url === url && 'focus' in client) return client.focus();
    }
    if (clients.openWindow) return clients.openWindow(url);
  }));
});
