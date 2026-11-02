/*!
 * chatbox-status.js  —  add-on for Study Master Chat
 *
 *   ✓   single tick  : your message is stored in Firebase
 *   ✓✓  double tick  : the other person has seen it
 *   ●   green dot + "Queen is typing…" / "Queen · online" under the page title
 *       (nothing is shown when the other person is offline)
 *
 * It does NOT change your chat script or your Firebase setup. It only listens to the
 * same "chatroom" and stores a few tiny helper nodes in it (their names start with "_"),
 * so no new Firebase rules are needed.
 */
(function () {
  'use strict';

  var FIREBASE_VERSION = '10.12.0';      // keep the same version your chat script uses
  var ALLOWED = ['Me', 'Queen'];
  var TYPING_STOP_MS = 2500;             // "typing…" stops this long after the last key
  var TYPING_REFRESH_MS = 3000;          // how often a "still typing" ping is sent
  var TYPING_EXPIRE_MS = 7000;           // the other side hides "typing…" if pings stop

  var BASE = 'https://www.gstatic.com/firebasejs/' + FIREBASE_VERSION + '/';
  var SVG_OPEN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">';
  var TICK_SENT = SVG_OPEN + '<path d="M5.5 12.8l4.6 4.6L19.5 8"/></svg>';
  var TICK_SEEN = SVG_OPEN + '<path d="M1.5 12.8l4.6 4.6L15 8.5"/><path d="M9.4 16.7l.7.7L22 5.5"/></svg>';

  function noop() {}
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function injectCss() {
    if (document.getElementById('cbsStyle')) return;
    var s = document.createElement('style');
    s.id = 'cbsStyle';
    s.textContent =
      '.cbs-tick{display:none;position:absolute;right:9px;bottom:9px;width:17px;height:17px;color:var(--tick,#7dd3fc);pointer-events:none}' +
      '.cbs-tick svg{display:block;width:100%;height:100%}' +
      '.cbs-tick[data-s=sent]{display:block;opacity:.7}' +
      '.cbs-tick[data-s=seen]{display:block}' +
      '.message.cbs-has .time{padding-right:20px}' +
      'html[data-times=off] .message.cbs-has{padding-right:34px}' +
      'html[data-ticks=off] .cbs-tick{display:none!important}' +

      '#cbsStatus{min-height:26px;margin:-4px 0 6px;display:flex;justify-content:center;align-items:center}' +
      '#cbsStatus .cbs-pill{display:inline-flex;align-items:center;gap:7px;padding:3px 13px;border-radius:14px;font-size:13px;' +
        'color:var(--text,#eee);background:var(--panel,#1e1e2a);border:1px solid var(--line,rgba(255,255,255,.12));' +
        'opacity:0;transform:translateY(-3px);transition:opacity .25s ease,transform .25s ease}' +
      '#cbsStatus.on .cbs-pill{opacity:1;transform:none}' +
      '.cbs-dot{width:9px;height:9px;border-radius:50%;background:#22c55e;animation:cbsPulse 1.8s infinite}' +
      '.cbs-name{font-weight:600}' +
      '.cbs-txt{color:var(--muted,#9aa1bd)}' +
      '.cbs-dots i{display:inline-block;width:4px;height:4px;margin-left:3px;border-radius:50%;background:currentColor;animation:cbsBounce 1.2s infinite}' +
      '.cbs-dots i:nth-child(2){animation-delay:.15s}.cbs-dots i:nth-child(3){animation-delay:.3s}' +
      '@keyframes cbsPulse{0%{box-shadow:0 0 0 0 rgba(34,197,94,.55)}70%{box-shadow:0 0 0 7px rgba(34,197,94,0)}100%{box-shadow:0 0 0 0 rgba(34,197,94,0)}}' +
      '@keyframes cbsBounce{0%,60%,100%{transform:translateY(0);opacity:.5}30%{transform:translateY(-4px);opacity:1}}';
    document.head.appendChild(s);
  }

  /* ---------- who am I? ---------- */
  function inferMe() {
    var mine = document.querySelector('.message.me .username');
    if (mine) return mine.textContent.trim();
    var theirs = document.querySelector('.message.other .username');
    if (theirs) {
      var t = theirs.textContent.trim();
      return t === 'Me' ? 'Queen' : t === 'Queen' ? 'Me' : null;
    }
    return null;
  }
  async function findMe() {
    var u = new URLSearchParams(window.location.search).get('user');
    if (!u && window.__chatUser !== undefined) u = window.__chatUser;
    if (u) return ALLOWED.indexOf(u) > -1 ? u : null;
    if (window.__chatUser === null) return null;               // prompt was cancelled
    for (var i = 0; i < 120; i++) {                             // fall back to reading the page
      var g = inferMe();
      if (ALLOWED.indexOf(g) > -1) return g;
      await sleep(250);
    }
    return null;
  }

  async function start() {
    var me = await findMe();
    if (!me) return;
    var other = me === 'Me' ? 'Queen' : 'Me';

    var appMod = await import(BASE + 'firebase-app.js');
    var dbMod = await import(BASE + 'firebase-database.js');
    for (var i = 0; i < 100 && !appMod.getApps().length; i++) await sleep(150);
    if (!appMod.getApps().length) { console.warn('[chatbox-status] Firebase app not found'); return; }

    var db = dbMod.getDatabase(appMod.getApp());
    var ref = dbMod.ref, set = dbMod.set, onValue = dbMod.onValue,
        onChildAdded = dbMod.onChildAdded, onDisconnect = dbMod.onDisconnect;
    function node(name) { return ref(db, 'chatroom/' + name); }

    var chatBox = document.getElementById('chatBox');
    var input = document.getElementById('messageInput');
    if (!chatBox) return;

    injectCss();

    /* ---------- status line under the title ---------- */
    var status = document.createElement('div');
    status.id = 'cbsStatus';
    status.setAttribute('aria-live', 'polite');
    status.innerHTML = '<span class="cbs-pill"><i class="cbs-dot"></i><b class="cbs-name"></b><span class="cbs-txt"></span></span>';
    var h2 = document.querySelector('h2');
    if (h2 && h2.parentNode) h2.parentNode.insertBefore(status, h2.nextSibling);
    else document.body.insertBefore(status, document.body.firstChild);
    var nameEl = status.querySelector('.cbs-name');
    var txtEl = status.querySelector('.cbs-txt');
    nameEl.textContent = other;

    var otherOnline = false, otherTyping = false, typeTimer = null;
    function paint() {
      var show = otherOnline || otherTyping;
      status.classList.toggle('on', show);
      if (otherTyping) txtEl.innerHTML = ' is typing<span class="cbs-dots"><i></i><i></i><i></i></span>';
      else txtEl.textContent = otherOnline ? ' · online' : '';
    }

    /* ---------- connection, presence (online) ---------- */
    var connected = false;
    var onlineRef = node('_online_' + me);
    var typingRef = node('_typing_' + me);
    function visible() { return document.visibilityState === 'visible'; }

    onValue(ref(db, '.info/connected'), function (snap) {
      connected = snap.val() === true;
      if (!connected) return;
      onDisconnect(onlineRef).set(false).catch(noop);   // closing the tab / losing network -> offline
      onDisconnect(typingRef).set(0).catch(noop);
      if (visible()) set(onlineRef, true).catch(noop);
    });
    // if "Clear Chat" wipes the chatroom, announce myself again
    onValue(onlineRef, function (snap) {
      if (snap.val() === null && connected && visible()) set(onlineRef, true).catch(noop);
    });
    onValue(node('_online_' + other), function (snap) { otherOnline = snap.val() === true; paint(); });

    /* ---------- typing ---------- */
    var lastPing = 0, stopTimer = null;
    function stopTyping() {
      clearTimeout(stopTimer);
      if (lastPing) { lastPing = 0; set(typingRef, 0).catch(noop); }
    }
    function typingPing() {
      var now = Date.now();
      if (now - lastPing > TYPING_REFRESH_MS) { lastPing = now; set(typingRef, now).catch(noop); }
      clearTimeout(stopTimer);
      stopTimer = setTimeout(stopTyping, TYPING_STOP_MS);
    }
    if (input) {
      input.addEventListener('input', function () { if (input.value.trim()) typingPing(); else stopTyping(); });
      input.addEventListener('blur', stopTyping);
    }
    onValue(node('_typing_' + other), function (snap) {
      var v = snap.val();
      clearTimeout(typeTimer);
      otherTyping = typeof v === 'number' && v > 0;
      if (otherTyping) typeTimer = setTimeout(function () { otherTyping = false; paint(); }, TYPING_EXPIRE_MS);
      paint();
    });

    document.addEventListener('visibilitychange', function () {
      if (visible()) { if (connected) set(onlineRef, true).catch(noop); scheduleSeen(); }
      else { stopTyping(); if (connected) set(onlineRef, false).catch(noop); }
    });
    window.addEventListener('pagehide', function () { set(onlineRef, false).catch(noop); });

    /* ---------- ticks: sent (✓) and seen (✓✓) ---------- */
    var live = false;                 // true once the old history has finished loading
    var sentKeys = {};                // my message keys that are stored in Firebase
    var seenKey = null;               // newest key of mine that the other person has seen
    var lastOtherKey = null, written = null, seenTimer = null;
    var keyQueue = [], elQueue = [];  // pair Firebase keys with the elements your chat script creates

    function refreshTicks() {
      var list = chatBox.querySelectorAll('.message.me');
      for (var i = 0; i < list.length; i++) {
        var el = list[i], k = el.dataset.key;
        var state = (k && seenKey && k <= seenKey) ? 'seen' : (k && sentKeys[k]) ? 'sent' : 'none';
        var tick = el.querySelector('.cbs-tick');
        if (!tick) { tick = document.createElement('span'); tick.className = 'cbs-tick'; el.appendChild(tick); }
        if (tick.getAttribute('data-s') !== state) {
          tick.setAttribute('data-s', state);
          tick.innerHTML = state === 'seen' ? TICK_SEEN : state === 'sent' ? TICK_SENT : '';
          tick.title = state === 'seen' ? 'Seen' : state === 'sent' ? 'Sent' : '';
        }
        el.classList.toggle('cbs-has', state !== 'none');
      }
    }
    function pair() {
      while (keyQueue.length && elQueue.length) elQueue.shift().dataset.key = keyQueue.shift();
      refreshTicks();
    }

    var existing = chatBox.querySelectorAll('.message');
    for (var e = 0; e < existing.length; e++) elQueue.push(existing[e]);
    new MutationObserver(function (list) {
      list.forEach(function (m) {
        m.addedNodes.forEach(function (n) {
          if (n.nodeType !== 1 || !n.classList.contains('message')) return;
          elQueue.push(n);
          if (live && n.classList.contains('me')) {
            stopTyping();
            if (window.ChatUI && window.ChatUI.burst) window.ChatUI.burst(n);   // heart burst (if enabled in Settings)
          }
        });
      });
      pair();
    }).observe(chatBox, { childList: true });

    // single tick: a write queued right after my message is only confirmed once the server
    // has stored everything before it, so its confirmation also proves my message is saved
    function confirmSent(key) {
      set(node('_sent_' + me), key).then(function () { sentKeys[key] = true; refreshTicks(); })
        .catch(function () { if (connected) { sentKeys[key] = true; refreshTicks(); } });
    }

    function markSeen() {
      if (window.ChatUI && window.ChatUI.state && window.ChatUI.state.receipts === 'off') return;  // read receipts off in Settings
      if (!visible() || !lastOtherKey || lastOtherKey === written) return;
      written = lastOtherKey;
      set(node('_seen_' + me), lastOtherKey).catch(function () { written = null; });
    }
    function scheduleSeen() { clearTimeout(seenTimer); seenTimer = setTimeout(markSeen, 200); }

    var chatRef = ref(db, 'chatroom');
    onChildAdded(chatRef, function (snap) {
      var msg = snap.val();
      if (!msg || typeof msg !== 'object' || ALLOWED.indexOf(msg.user) === -1) return;   // skips the "_" helper nodes
      keyQueue.push(snap.key);
      if (msg.user === me) {
        if (live) confirmSent(snap.key); else sentKeys[snap.key] = true;       // history is already stored
      } else {
        lastOtherKey = snap.key;
        scheduleSeen();
        if (live && window.ChatUI && window.ChatUI.incoming) window.ChatUI.incoming(msg);  // sound / vibrate / notification
      }
      pair();
    }, noop);
    onValue(chatRef, function () { live = true; }, { onlyOnce: true });

    onValue(node('_seen_' + other), function (snap) { seenKey = snap.val(); refreshTicks(); }, noop);

    document.addEventListener('chatui:change', scheduleSeen);
    window.addEventListener('focus', scheduleSeen);
  }

  function boot() { start().catch(function (err) { console.warn('[chatbox-status]', err); }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
