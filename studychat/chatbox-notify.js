/*!
 * chatbox-notify.js  —  notification manager for Study Master Chat
 *
 * This page NEVER sends notifications. It only RECEIVES the ones that another page sends.
 *
 * TWO WAYS NOTIFICATIONS REACH IT
 *  A) REAL PUSH (works even when the browser is closed — like a newsletter from a website)
 *     This page saves your device in Firebase; your sender page asks the free Cloudflare Worker
 *     (chatbox-push-worker.js) to push to it. Needs vapidPublicKey below. See chatbox-push-worker.js.
 *  B) While the page is open, it also watches Firebase at  chatroom/_notify  (optional, simple):
 *
 *     import { getDatabase, ref, push } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
 *     push(ref(getDatabase(app), "chatroom/_notify"), {
 *       to:    "Rani",          // "Me", "Rani" or "all"
 *       from:  "Me",            // the sender's name (a person never gets their own notification)
 *       title: "Hello",         // headline
 *       body:  "Message text",  // optional
 *       url:   "",              // optional: page to open when the notification is tapped
 *       ts:    Date.now()
 *     });
 *
 * (It lives inside "chatroom", so your current Firebase rules already allow it.)
 *
 * ADD TO THE CHAT PAGE, before </body>, after your chat script:
 *     <script defer src="chatbox-notify.js"></script>
 * and put chatbox-sw.js in the same folder (it lets phones show notifications and open the page on tap).
 *
 * Handy in the browser console:  ChatNotify.test()  ·  ChatNotify.status()  ·  ChatNotify.mute(true)  ·  ChatNotify.subscribe()
 */
(function () {
  'use strict';

  var CONFIG = {
    firebaseVersion: '10.12.0',          // keep the same version your chat script uses
    users: ['Me', 'Rani'],
    path: 'chatroom/_notify',            // where the sender page writes
    serviceWorker: 'chatbox-sw.js',      // '' = don't use a service worker
    askOnFirstTap: true,                 // ask for notification permission on the first tap/click
    showMissed: 3,                       // on opening the page, show up to this many missed notifications
    toastMs: 5000,                       // how long the in-page pop-up stays
    icon: '',                            // optional icon url for system notifications

    // ----- real push (browser closed) -----
    vapidPublicKey: 'BB0WNMJ8-ft2A9eV9l4df77SExxkJEnA9qt7oy36AAifsjROMwpgn7loMs1GrxKZ0MNQrE-el3DeIHzuN0TVdNY',                  // PUBLIC key from chatbox-vapid-keys.html  ('' = push off)
    pushPaths: ['chatPush', 'chatroom/_push']   // where this device is saved (first one Firebase allows is used)
  };

  var BASE = 'https://www.gstatic.com/firebasejs/' + CONFIG.firebaseVersion + '/';
  function noop() {}
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function keyBytes(b64) {
    var pad = '='.repeat((4 - (b64.length % 4)) % 4);
    var raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
    var out = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
  }
  async function sha256Hex(text) {
    var d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.prototype.map.call(new Uint8Array(d), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
  }

  /* ---------- who am I? (same logic as the other scripts) ---------- */
  function inferMe() {
    var mine = document.querySelector('.message.me .username');
    if (mine) return mine.textContent.trim();
    var theirs = document.querySelector('.message.other .username');
    if (theirs) {
      var t = theirs.textContent.trim();
      return t === 'Me' ? 'Rani' : t === 'Rani' ? 'Me' : null;
    }
    return null;
  }
  async function findMe() {
    var u = new URLSearchParams(window.location.search).get('user');
    if (!u && window.__chatUser !== undefined) u = window.__chatUser;
    if (u) return CONFIG.users.indexOf(u) > -1 ? u : null;
    if (window.__chatUser === null) return null;
    for (var i = 0; i < 120; i++) {
      var g = inferMe();
      if (CONFIG.users.indexOf(g) > -1) return g;
      await sleep(250);
    }
    return null;
  }

  /* ---------- in-page pop-up ---------- */
  function injectCss() {
    if (document.getElementById('cbnStyle')) return;
    var s = document.createElement('style');
    s.id = 'cbnStyle';
    s.textContent =
      '#cbnToasts{position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:3500;display:flex;flex-direction:column;gap:8px;width:min(360px,92vw);pointer-events:none}' +
      '.cbn-toast{pointer-events:auto;cursor:pointer;padding:10px 14px;border-radius:14px;font-size:14px;line-height:1.45;' +
        'color:var(--text,#eee);background:var(--panel,#1e1e2a);border:1px solid var(--line,rgba(255,255,255,.14));' +
        'box-shadow:0 10px 30px rgba(0,0,0,.4);opacity:0;transform:translateY(-8px);transition:opacity .25s ease,transform .25s ease}' +
      '.cbn-toast.in{opacity:1;transform:none}' +
      '.cbn-toast b{display:block;font-weight:600}' +
      '.cbn-toast span{display:block;color:var(--muted,#9aa1bd);font-size:13px}';
    document.head.appendChild(s);
  }
  function toast(n) {
    injectCss();
    var box = document.getElementById('cbnToasts');
    if (!box) { box = document.createElement('div'); box.id = 'cbnToasts'; document.body.appendChild(box); }
    var t = document.createElement('div');
    t.className = 'cbn-toast';
    var h = document.createElement('b');
    h.textContent = n.title || 'Notification';
    t.appendChild(h);
    if (n.body) { var p = document.createElement('span'); p.textContent = n.body; t.appendChild(p); }
    function close() { t.classList.remove('in'); setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 300); }
    t.addEventListener('click', function () { close(); if (n.url) window.location.href = n.url; });
    box.appendChild(t);
    setTimeout(function () { t.classList.add('in'); }, 20);
    setTimeout(close, CONFIG.toastMs);
  }

  async function start() {
    var me = await findMe();
    if (!me) return;

    var appMod = await import(BASE + 'firebase-app.js');
    var dbMod = await import(BASE + 'firebase-database.js');
    for (var w = 0; w < 100 && !appMod.getApps().length; w++) await sleep(150);
    if (!appMod.getApps().length) { console.warn('[chatbox-notify] Firebase app not found'); return; }
    var db = dbMod.getDatabase(appMod.getApp());
    var feed = dbMod.ref(db, CONFIG.path);

    var swReg = null;
    var KEY_LAST = 'cbn_last_' + me, KEY_MUTE = 'cbn_mute_' + me;
    function isMuted() { return lsGet(KEY_MUTE) === '1'; }

    /* ---------- permission ---------- */
    function permission() { return ('Notification' in window) ? Notification.permission : 'unsupported'; }
    function requestPermission() {
      if (!('Notification' in window)) return Promise.resolve('unsupported');
      if (Notification.permission !== 'default') return Promise.resolve(Notification.permission);
      try {
        return Promise.resolve(Notification.requestPermission()).then(function () {
          if (Notification.permission === 'granted') subscribePush();
          return Notification.permission;
        });
      } catch (e) { return Promise.resolve(Notification.permission); }
    }
    if (CONFIG.askOnFirstTap && permission() === 'default') {
      var evs = ['click', 'keydown', 'touchend'];
      var once = function () { evs.forEach(function (ev) { document.removeEventListener(ev, once, true); }); requestPermission(); };
      evs.forEach(function (ev) { document.addEventListener(ev, once, true); });
    }

    /* ---------- service worker (phones + tap-to-open) ---------- */
    var secure = window.location.protocol === 'https:' || /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);
    var swReady = Promise.resolve(null);
    if (CONFIG.serviceWorker && 'serviceWorker' in navigator && secure) {
      swReady = navigator.serviceWorker.register(CONFIG.serviceWorker)
        .then(function () { return navigator.serviceWorker.ready; })
        .then(function (reg) { swReg = reg; return reg; })
        .catch(function (err) { console.info('[chatbox-notify] service worker not used:', err && err.message); return null; });
      // a push that arrives while you are looking at the page is shown as an in-page pop-up
      navigator.serviceWorker.addEventListener('message', function (ev) {
        var m = ev.data;
        if (m && m.type === 'cbn-push' && !isMuted()) toast(m.data || {});
      });
    }

    /* ---------- real push: save this device so the Worker can reach it ---------- */
    var pushState = CONFIG.vapidPublicKey ? 'waiting' : 'off (no vapidPublicKey)';
    var watching = false;
    async function saveDevice(json) {
      var id = (await sha256Hex(json.endpoint)).slice(0, 24);
      var lastErr = null;
      for (var i = 0; i < CONFIG.pushPaths.length; i++) {
        var p = CONFIG.pushPaths[i] + '/' + me + '/' + id;
        try {
          await dbMod.set(dbMod.ref(db, p), json);
          if (!watching) {            // if "Clear Chat" wipes the saved device, save it again
            watching = true;
            dbMod.onValue(dbMod.ref(db, p), function (snap) {
              if (snap.val() === null && permission() === 'granted') dbMod.set(dbMod.ref(db, p), json).catch(noop);
            }, noop);
          }
          return p;
        } catch (e) { lastErr = e; }
      }
      throw lastErr || new Error('could not save device');
    }
    async function subscribePush() {
      if (!CONFIG.vapidPublicKey) return pushState;
      try {
        var reg = swReg || await swReady;
        if (!reg || !reg.pushManager) { pushState = 'not supported here'; return pushState; }
        if (permission() !== 'granted') { pushState = 'waiting for permission'; return pushState; }
        var key = keyBytes(CONFIG.vapidPublicKey);
        var sub = await reg.pushManager.getSubscription();
        if (sub) {                    // subscribed with a different key before? start again
          var cur = sub.options && sub.options.applicationServerKey ? new Uint8Array(sub.options.applicationServerKey) : null;
          var same = !cur || (cur.length === key.length && cur.every(function (v, i) { return v === key[i]; }));
          if (!same) { await sub.unsubscribe(); sub = null; }
        }
        if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
        var path = await saveDevice(sub.toJSON());
        pushState = 'on (saved at ' + path + ')';
      } catch (err) {
        pushState = 'error: ' + (err && err.message);
        console.warn('[chatbox-notify] push:', err);
      }
      return pushState;
    }
    swReady.then(function () { if (permission() === 'granted') subscribePush(); });

    /* ---------- show a notification ---------- */
    var baseTitle = null;
    function flashTitle(text) {
      if (baseTitle === null) baseTitle = document.title;
      document.title = '🔔 ' + text;
      var back = function () {
        if (document.visibilityState === 'visible') { document.title = baseTitle; document.removeEventListener('visibilitychange', back); }
      };
      document.addEventListener('visibilitychange', back);
    }
    function viaPage(title, opts, n) {
      try {
        var x = new Notification(title, opts);
        x.onclick = function () { window.focus(); if (n.url) window.location.href = n.url; x.close(); };
      } catch (e) { toast(n); }
    }
    function system(n, key) {
      if (permission() !== 'granted') { toast(n); return; }
      var title = n.title || 'Study Master Chat';
      var opts = { body: n.body || '', tag: n.tag || ('cbn-' + key), data: { url: n.url || '' } };
      if (CONFIG.icon) opts.icon = CONFIG.icon;
      flashTitle(title);
      if (swReg && swReg.showNotification) {
        swReg.showNotification(title, opts).catch(function () { viaPage(title, opts, n); });
      } else {
        viaPage(title, opts, n);
      }
    }
    function present(n, key) {
      if (isMuted()) return;
      if (document.visibilityState === 'visible' && document.hasFocus()) toast(n);
      else system(n, key);
    }

    /* ---------- receive ---------- */
    function mine(n) {
      return !!n && typeof n === 'object' &&
        (n.to === me || n.to === 'all' || n.to === '*') && n.from !== me;
    }
    var live = false, initial = [];
    function setLast(k) { lsSet(KEY_LAST, k); }

    dbMod.onChildAdded(feed, function (snap) {
      var n = snap.val();
      if (!live) { initial.push({ key: snap.key, n: n }); return; }
      if (mine(n)) present(n, snap.key);
      setLast(snap.key);
    }, noop);

    // fires once the old entries have all been read
    dbMod.onValue(feed, function () {
      live = true;
      var last = lsGet(KEY_LAST);
      var newest = initial.length ? initial[initial.length - 1].key : null;
      if (last) {
        initial.filter(function (x) { return x.key > last && mine(x.n); })
          .slice(-CONFIG.showMissed)
          .forEach(function (x) { present(x.n, x.key); });
      }
      if (newest && (!last || newest > last)) setLast(newest);   // first run: don't replay old history
      initial = [];
    }, { onlyOnce: true });

    /* ---------- small API for you ---------- */
    window.ChatNotify = {
      version: 2,
      user: me,
      requestPermission: requestPermission,
      mute: function (on) { lsSet(KEY_MUTE, on ? '1' : '0'); },
      isMuted: isMuted,
      status: function () {
        return { user: me, permission: permission(), serviceWorker: !!swReg, push: pushState, muted: isMuted(), listening: CONFIG.path };
      },
      subscribe: subscribePush,
      test: function () {
        present({ title: 'Test notification', body: 'chatbox-notify.js is working ✓', from: 'test', to: me }, 'test-' + Date.now());
      }
    };
  }

  function boot() { start().catch(function (err) { console.warn('[chatbox-notify]', err); }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
