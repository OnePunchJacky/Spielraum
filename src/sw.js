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

// ── Timer alarm ──────────────────────────────────────────────────────────────
// The main thread posts SCHEDULE_ALARM with a delay (ms) when the timer starts.
// We use setTimeout here in the SW so the alarm fires even when iOS has frozen
// the main JS thread (screen locked). On alarm fire we show a persistent
// notification via the SW's own registration — no active page needed.

let alarmTimer = null;

self.addEventListener('message', event => {
  const { type, delay, title, body } = event.data || {};

  if (type === 'SCHEDULE_ALARM') {
    if (alarmTimer) clearTimeout(alarmTimer);
    alarmTimer = setTimeout(() => {
      alarmTimer = null;
      self.registration.showNotification(title || '⏰ Zeit abgelaufen!', {
        body: body || 'Dein Timer ist abgelaufen.',
        icon: '/Spielraum/icon.svg',
        badge: '/Spielraum/icon.svg',
        tag: 'spielraum-alarm',
        requireInteraction: true,
        silent: false,
      });
    }, delay);
  }

  if (type === 'CANCEL_ALARM') {
    if (alarmTimer) {
      clearTimeout(alarmTimer);
      alarmTimer = null;
    }
  }
});
