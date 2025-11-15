// CSS imports
import '../styles/styles.css';

import App from './pages/app';
import { togglePushSubscription, isPushSubscribed, subscribeToPush, unsubscribeFromPush } from './utils/notification';
import { showNotification } from './utils/notification';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  const app = new App({
    content: document.querySelector('#main-content'),
    drawerButton: document.querySelector('#drawer-button'),
    navigationDrawer: document.querySelector('#navigation-drawer'),
  });
  await app.renderPage();

  window.addEventListener('hashchange', async () => {
    await app.renderPage();
  });

  // Expose push functions for UI binding
  window.pushNotification = {
    toggle: togglePushSubscription,
    isSubscribed: isPushSubscribed,
    subscribe: subscribeToPush,
    unsubscribe: unsubscribeFromPush,
  };

  // Optional UI binding if #push-toggle exists
  const btn = document.getElementById('push-toggle');
  if (btn) {
    const refreshLabel = async () => {
      const subscribed = await isPushSubscribed();
      btn.setAttribute('aria-pressed', String(subscribed));
      const label = subscribed ? 'Disable Push Notifications' : 'Enable Push Notifications';
      btn.setAttribute('aria-label', label);
      btn.setAttribute('title', label);
    };

    await refreshLabel();

    btn.addEventListener('click', async () => {
      btn.disabled = true;
      const subscribed = await isPushSubscribed();
      try {
        if (subscribed) {
          await togglePushSubscription(false);
          showNotification('Push notification dinonaktifkan', 'success');
        } else {
          await togglePushSubscription(true);
          showNotification('Push notification diaktifkan', 'success');
        }
      } catch (err) {
        showNotification(err?.message || 'Gagal mengubah status push', 'error');
      } finally {
        await refreshLabel();
        btn.disabled = false;
      }
    });
  }
});
