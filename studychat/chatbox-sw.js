/*!
 * chatbox-sw.js — service worker used by chatbox-notify.js
 * Keep it in the SAME folder as your chat page. It:
 *   1. receives REAL push notifications (even when the browser is closed) and shows them,
 *   2. shows a pop-up inside the page instead, if you are looking at the page right now,
 *   3. opens / focuses the chat page when a notification is tapped.
 */
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (event) { event.waitUntil(self.clients.claim()); });

self.addEventListener('push', function (event) {
  var d = {};
  try { d = event.data ? event.data.json() : {}; }
  catch (e) { d = { body: event.data ? event.data.text() : '' }; }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
      var looking = list.filter(function (c) { return c.visibilityState === 'visible' && c.focused; });
      if (looking.length) {                       // page is open and in front → in-page pop-up, no system notification
        looking.forEach(function (c) { c.postMessage({ type: 'cbn-push', data: d }); });
        return;
      }
      return self.registration.showNotification(d.title || 'Study Master Chat', {
        body: d.body || '',
        tag: d.tag || undefined,
        data: { url: d.url || '' }
      });
    })
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var data = event.notification.data || {};
  var target = data.url || self.registration.scope;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
      for (var i = 0; i < list.length; i++) {
        var c = list[i];
        if ('focus' in c) {
          if (data.url && 'navigate' in c) { try { c.navigate(target); } catch (e) {} }
          return c.focus();
        }
      }
      return self.clients.openWindow(target);
    })
  );
});
