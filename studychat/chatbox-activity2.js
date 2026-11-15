/*!
 * chatbox-activity.js (v2)  —  action log for Study Master Chat
 *
 * Runs on the CHAT page and records what happens, so the separate page chatbox-activity.html
 * can show a timeline even when it was closed at the time.
 *
 *   • things YOUR page can see about BOTH of you (so it works even if the other person's page
 *     has not been updated):   sent a message · edited a message · deleted a message
 *   • things only the person's OWN page knows:   came online · went offline · started typing ·
 *     saw the new messages · saved settings · cleared the chat
 *
 * Messages are never copied except a short preview of a sent one; the text of an edited or deleted
 * message is never stored. Each event has a fixed key, so if both of your pages record the same event
 * it is stored only once.
 *
 * Add before </body>, after your chat script:
 *     <script defer src="chatbox-activity.js?v=2"></script>
 *
 * Where it is saved:  chatActivity   (add it to your Firebase rules so "Clear Chat" never erases it)
 *                     otherwise automatically  chatroom/_log   (Clear Chat erases that one)
 *
 * Browser console:   ChatActivity.status()   ·   ChatActivity.test()
 */
(function () {
  'use strict';

  var CONFIG = {
    firebaseVersion: '10.12.0',              // keep the same version your chat script uses
    users: ['Me', 'Queen'],
    paths: ['chatActivity', 'chatroom/_log'],
    previewChars: 60,
    minGapMs: { typing: 45000, seen: 30000, settings: 60000 },
    burstMs: 800,                            // removals closer together than this are treated as one batch
    burstMin: 3,                             // this many removals in one batch = the chat was cleared
    clearWindowMs: 6000                      // "Clear Chat" button press → removals within this time
  };

  var BASE = 'https://www.gstatic.com/firebasejs/' + CONFIG.firebaseVersion + '/';
  var PUSH_CHARS = '-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz';
  function noop() {}
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /* the first 8 characters of a Firebase push key hold the time the message was created */
  function pushTime(key) {
    var t = 0;
    for (var i = 0; i < 8; i++) {
      var n = PUSH_CHARS.indexOf(String(key).charAt(i));
      if (n < 0) return Date.now();
      t = t * 64 + n;
    }
    return t;
  }
  function hash(s) {
    var h = 5381;
    for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36);
  }
  function preview(text) {
    var s = String(text || '');
    if (/<img\b/i.test(s)) return '📷 photo';
    s = s.replace(/^<div class="quoted">[\s\S]*?<\/div>/, '↪ ').replace(/<[^>]*>/g, '').trim();
    return s.length > CONFIG.previewChars ? s.slice(0, CONFIG.previewChars) + '…' : s;
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
    if (u) return CONFIG.users.indexOf(u) > -1 ? u : null;
    if (window.__chatUser === null) return null;
    for (var i = 0; i < 120; i++) {
      var g = inferMe();
      if (CONFIG.users.indexOf(g) > -1) return g;
      await sleep(250);
    }
    return null;
  }

  async function start() {
    var me = await findMe();
    if (!me) return;

    var appMod = await import(BASE + 'firebase-app.js');
    var dbMod = await import(BASE + 'firebase-database.js');
    for (var w = 0; w < 100 && !appMod.getApps().length; w++) await sleep(150);
    if (!appMod.getApps().length) { console.warn('[chatbox-activity] Firebase app not found'); return; }

    var db = dbMod.getDatabase(appMod.getApp());
    var ref = dbMod.ref, push = dbMod.push, set = dbMod.set, onValue = dbMod.onValue;
    var chatRef = ref(db, 'chatroom');

    /* ---------- write one log line ---------- */
    var base = null, written = 0, lastError = null;
    function pathOrder() { return base ? [base].concat(CONFIG.paths.filter(function (p) { return p !== base; })) : CONFIG.paths.slice(); }
    async function put(entry, key) {
      var order = pathOrder();
      for (var i = 0; i < order.length; i++) {
        try {
          await set(key ? ref(db, order[i] + '/' + key) : push(ref(db, order[i])), entry);
          base = order[i]; written++; lastError = null;
          return true;
        } catch (e) { lastError = (e && (e.code || e.message)) || String(e); }
      }
      console.warn('[chatbox-activity] could not write the log (' + lastError + '). Check your Firebase rules.');
      return false;
    }
    function line(who, a, d, ts) {
      var e = { who: who, a: a, ts: ts || dbMod.serverTimestamp() };
      if (d) e.d = String(d);
      return e;
    }
    var lastAt = {};
    function throttled(a) {
      var now = Date.now(), gap = CONFIG.minGapMs[a] || 0;
      if (lastAt[a] && now - lastAt[a] < gap) return;
      lastAt[a] = now;
      put(line(me, a));
    }

    /* ---------- MY online / offline (offline is written by Firebase itself when the connection drops) ---------- */
    var offRef = null;
    onValue(ref(db, '.info/connected'), async function (snap) {
      if (snap.val() !== true) return;
      await put(line(me, 'online'));
      try { if (offRef) await dbMod.onDisconnect(offRef).cancel(); } catch (e) {}
      offRef = push(ref(db, pathOrder()[0]));
      dbMod.onDisconnect(offRef).set(line(me, 'offline')).catch(noop);
    }, noop);

    /* ---------- MY typing / seen / settings ---------- */
    onValue(ref(db, 'chatroom/_typing_' + me), function (snap) {
      var v = snap.val();
      if (typeof v === 'number' && v > 0) throttled('typing');
    }, noop);
    var firstSeen = true;
    onValue(ref(db, 'chatroom/_seen_' + me), function () {
      if (firstSeen) { firstSeen = false; return; }
      throttled('seen');
    }, noop);
    var firstSettings = true;
    onValue(ref(db, 'chatSettings/' + me), function () {
      if (firstSettings) { firstSettings = false; return; }
      throttled('settings');
    }, noop);

    /* ---------- BOTH: sent / edited / deleted (fixed keys → no duplicates) ---------- */
    var msgs = {}, live = false;
    var removed = [], removeTimer = null, clearIntent = 0;
    function isMsg(m) { return m && typeof m === 'object' && CONFIG.users.indexOf(m.user) > -1; }

    dbMod.onChildAdded(chatRef, function (snap) {
      var m = snap.val();
      if (!isMsg(m)) return;
      msgs[snap.key] = { user: m.user, text: m.text || '' };
      if (live) put(line(m.user, 'sent', preview(m.text), pushTime(snap.key)), 's_' + snap.key);
    }, noop);
    onValue(chatRef, function () { live = true; }, noop, { onlyOnce: true });

    dbMod.onChildChanged(chatRef, function (snap) {
      var m = snap.val();
      if (!isMsg(m)) return;
      var old = msgs[snap.key];
      msgs[snap.key] = { user: m.user, text: m.text || '' };
      if (old && old.text !== (m.text || '')) put(line(m.user, 'edited'), 'e_' + snap.key + '_' + hash(m.text || ''));
    }, noop);

    function flushRemoved() {
      var list = removed;
      removed = []; removeTimer = null;
      if (!list.length) return;
      var pressed = Date.now() - clearIntent < CONFIG.clearWindowMs;
      if (list.length >= CONFIG.burstMin || pressed) {                  // the whole chat was cleared
        if (pressed) { put(line(me, 'cleared', list.length + ' messages')); clearIntent = 0; }
        return;
      }
      list.forEach(function (it) { put(line(it.who, 'deleted'), 'd_' + it.key); });
    }
    dbMod.onChildRemoved(chatRef, function (snap) {
      var m = snap.val();
      if (!isMsg(m)) return;
      delete msgs[snap.key];
      removed.push({ key: snap.key, who: m.user });
      clearTimeout(removeTimer);
      removeTimer = setTimeout(flushRemoved, CONFIG.burstMs);
    }, noop);

    var clearBtn = document.querySelector('button[onclick*="clearAllMessages"]');
    if (clearBtn) clearBtn.addEventListener('click', function () { clearIntent = Date.now(); });

    /* ---------- handy checks from the browser console ---------- */
    window.ChatActivity = {
      version: 2,
      user: me,
      status: function () { return { user: me, savingTo: base, linesWritten: written, lastError: lastError }; },
      test: function () { return put(line(me, 'test')); }
    };
  }

  function boot() { start().catch(function (err) { console.warn('[chatbox-activity]', err); }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
