import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com',
  new CacheFirst({
    cacheName: 'google-fonts-stylesheets',
    plugins: [
      new ExpirationPlugin({ maxEntries: 5, maxAgeSeconds: 365 * 24 * 60 * 60 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

registerRoute(
  ({ url }) => url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts-webfonts',
    plugins: [
      new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// ── Timer alarm ───────────────────────────────────────────────────────────────
// Layer 1: TimestampTrigger — schedules a notification at an absolute timestamp
//   directly inside the browser/OS; fires even when the SW is suspended (Chrome
//   for Android, requires "periodic-background-sync" or "notifications" permission).
// Layer 2: setTimeout fallback — fires while the SW is alive (works on desktop and
//   Android when the screen isn't locked for too long).
// The main thread keeps a sessionStorage entry as Layer 3 (visibility-change check).

const TAG = 'spielraum-alarm';

let alarmTimer = null;

self.addEventListener('message', async event => {
  const { type, delay, fireAt, title, body } = event.data || {};

  if (type === 'SCHEDULE_ALARM') {
    // Cancel existing
    if (alarmTimer) { clearTimeout(alarmTimer); alarmTimer = null; }
    // Close any pending triggered notification we registered before
    try {
      const pending = await self.registration.getNotifications({ tag: TAG, includeTriggered: true });
      pending.forEach(n => n.close());
    } catch {}

    const opts = {
      body:             body  || 'Dein Timer ist abgelaufen.',
      icon:             '/Spielraum/icon.svg',
      badge:            '/Spielraum/icon.svg',
      tag:              TAG,
      requireInteraction: true,
      silent:           false,
      data:             { fireAt },
    };

    // Layer 1: TimestampTrigger (Chrome for Android ≥86)
    if (typeof TimestampTrigger !== 'undefined' && fireAt) {
      try {
        await self.registration.showNotification(title || '⏰ Zeit abgelaufen!', {
          ...opts,
          showTrigger: new TimestampTrigger(fireAt),
        });
        return; // registered in OS scheduler — no setTimeout needed
      } catch {
        // unsupported or permission missing, fall through
      }
    }

    // Layer 2: setTimeout (works when SW stays alive)
    const remaining = fireAt ? Math.max(0, fireAt - Date.now()) : (delay ?? 0);
    alarmTimer = setTimeout(() => {
      alarmTimer = null;
      self.registration.showNotification(title || '⏰ Zeit abgelaufen!', opts);
    }, remaining);
  }

  if (type === 'CANCEL_ALARM') {
    if (alarmTimer) { clearTimeout(alarmTimer); alarmTimer = null; }
    try {
      const pending = await self.registration.getNotifications({ tag: TAG, includeTriggered: true });
      pending.forEach(n => n.close());
    } catch {}
  }
});

// Dismiss notification on tap
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const match = list.find(c => c.url.includes('/Spielraum') && 'focus' in c);
      return match ? match.focus() : clients.openWindow('/Spielraum/');
    })
  );
});
