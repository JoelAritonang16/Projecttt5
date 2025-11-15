import CONFIG from '../config';

export function showNotification(message, type = 'info') {
  // Remove existing notification
  const existing = document.querySelector('.notification');
  if (existing) {
    existing.remove();
  }

  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.setAttribute('role', 'alert');
  notification.setAttribute('aria-live', 'polite');
  notification.textContent = message;

  document.body.appendChild(notification);

  // Trigger animation
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);

  // Remove after 3 seconds
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function getRegistration() {
  if (!('serviceWorker' in navigator)) return null;
  const reg = await navigator.serviceWorker.getRegistration();
  return reg || null;
}

export async function isPushSubscribed() {
  const reg = await getRegistration();
  if (!reg || !('pushManager' in reg)) return false;
  const sub = await reg.pushManager.getSubscription();
  return !!sub;
}

export async function subscribeToPush() {
  if (!('Notification' in window)) throw new Error('Notification API tidak didukung');
  if (!('serviceWorker' in navigator)) throw new Error('Service Worker tidak didukung');
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Izin notifikasi ditolak');
  const reg = await getRegistration();
  if (!reg) throw new Error('Service Worker belum terdaftar');
  const existing = await reg.pushManager.getSubscription();
  if (existing) return existing;
  const appServerKey = CONFIG.VAPID_PUBLIC_KEY ? urlBase64ToUint8Array(CONFIG.VAPID_PUBLIC_KEY) : undefined;
  const subscription = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: appServerKey });
  try {
    if (CONFIG.PUSH_SUBSCRIBE_URL) {
      await fetch(CONFIG.PUSH_SUBSCRIBE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
      });
    }
  } catch (_) {}
  return subscription;
}

export async function unsubscribeFromPush() {
  const reg = await getRegistration();
  if (!reg) return false;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return true;
  try {
    if (CONFIG.PUSH_UNSUBSCRIBE_URL) {
      await fetch(CONFIG.PUSH_UNSUBSCRIBE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      });
    }
  } catch (_) {}
  const ok = await sub.unsubscribe();
  return ok;
}

export async function togglePushSubscription(enable) {
  if (enable) {
    await subscribeToPush();
    return true;
  }
  await unsubscribeFromPush();
  return false;
}

