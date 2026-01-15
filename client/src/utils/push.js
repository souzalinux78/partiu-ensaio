import api from './api';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function ensurePushSubscription() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { ok: false, reason: 'unsupported' };
  }

  if (Notification.permission !== 'granted') {
    return { ok: false, reason: 'permission' };
  }

  const reg = await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  if (existing) {
    await api.post('/push/subscribe', { subscription: existing.toJSON() });
    return { ok: true, subscribed: true };
  }

  const vapidPublicKey =
    process.env.REACT_APP_VAPID_PUBLIC_KEY ||
    window.__VAPID_PUBLIC_KEY__; // fallback opcional

  if (!vapidPublicKey) {
    return { ok: false, reason: 'missing_vapid_public_key' };
  }

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
  });

  await api.post('/push/subscribe', { subscription: sub.toJSON() });
  return { ok: true, subscribed: true };
}

