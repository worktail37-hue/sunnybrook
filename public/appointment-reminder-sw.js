/**
 * Sunnybrook Family & Kids Dental — Service Worker for Appointment Reminders
 * Helps reduce no-show rates by delivering timely browser notifications for
 * upcoming family and child dental check-ups.
 */

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || typeof data !== 'object') return;

  if (data.type === 'SHOW_APPOINTMENT_REMINDER') {
    const title = data.title || 'Upcoming dental visit reminder';
    const options = {
      body:
        data.body ||
        'Friendly reminder of your upcoming dental visit at Sunnybrook Family & Kids Dental.',
      tag: data.tag || 'sunnybrook-appointment-reminder',
      renotify: true,
      requireInteraction: false,
      data: {
        url: data.url || '/#patient-portal',
        appointmentId: data.appointmentId || '',
      },
    };

    event.waitUntil(self.registration.showNotification(title, options));
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl =
    (event.notification.data && event.notification.data.url) || '/#patient-portal';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            client.focus();
            client.postMessage({
              type: 'NOTIFICATION_CLICKED',
              url: targetUrl,
            });
            return;
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});
