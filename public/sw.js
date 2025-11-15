/* Service Worker for Push Notifications */

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (e) {
    payload = { title: 'Notifikasi', body: event.data ? event.data.text() : '' };
  }

  const title = payload.title || 'Notifikasi Baru';
  const body = payload.body || payload.message || 'Anda memiliki notifikasi baru';
  const icon = payload.icon || '/icons/icon-192x192.png';
  const badge = payload.badge || '/icons/icon-72x72.png';
  const url = payload.url || payload.link || '/';
  const tag = payload.tag || 'general';
  const actions = payload.actions || [
    { action: 'open', title: 'Lihat Detail' },
  ];

  const options = {
    body,
    icon,
    badge,
    tag,
    data: { url },
    actions,
    requireInteraction: !!payload.requireInteraction,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const action = event.action;
  const url = (event.notification && event.notification.data && event.notification.data.url) || '/';

  const open = async () => {
    const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of allClients) {
      if ('focus' in client && client.url && client.url.includes(new URL(url, self.location.origin).pathname)) {
        return client.focus();
      }
    }
    return clients.openWindow(url);
  };

  // If there are multiple actions, you can branch here by `action`
  event.waitUntil(open());
});
