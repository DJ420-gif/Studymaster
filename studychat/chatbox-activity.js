/*!
 * chatbox-activity.js  —  action log for Study Master Chat
 *
 * Each person's chat page records that person's OWN actions in the chat, so the separate page
 * chatbox-activity.html can show a clear timeline for both of you:
 *
 *      came online · went offline · sent a message · edited a message · deleted a message
 *      saw the new messages · started typing · cleared the chat
 *
 * It records only what happens inside this chat. It never stores the text of an edited or
 * deleted message. Both of you can open the activity page, so it is a shared timeline.
 *
 * Add before </body>, after your chat script:
 *     <script defer src="chatbox-activity.js"></script>
 *
 * Where it is saved: chatActivity (add this to your Firebase rules so "Clear Chat" does not erase it),
 * otherwise automatically chatroom/_log.
 */
(function () {
  'use strict';

  var CONFIG = {
    firebaseVersion: '10.12.0',            // keep the same version your chat script uses
    users: ['Me', 'Rani'],
    paths: ['chatActivity', 'chatroom/_log'],
    previewChars: 60,                      // how much of a sent message is shown in the log
    minGapMs: { typing: 45000, seen: 30000 }   // don't log these more often than this
  };

  var BASE = 'https://www.gstatic.com/firebasejs/' + CONFIG.firebaseVersion + '/';
  function noop() {}
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /* ---------- who am I? ---------- */
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

  /* a message as a short readable preview */
  function preview(text) {
    var s = String(text || '');
    if (/<img\b/i.test(s)) return '📷 photo';
    s = s.replace(/^<div class="quoted">[\s\S]*?<\/div>/, '↪ ').replace(/<[^>]*>/g, '').trim();
    return s.length > CONFIG.previewChars ? s.slice(0, CONFIG.previewChars) + '…' : s;
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

    /* ---------- write one log line (first allowed path wins) ---------- */
    var base = null;
    async function log(action, detail) {
      var entry = { who: me, a: action, ts: dbMod.serverTimestamp() };
      if (detail) entry.d = String(detail);
      var order = base ? [base] : CONFIG.paths;
      for (var i = 0; i < order.length; i++) {
        try { await set(push(ref(db, order[i])), entry); base = order[i]; return true; }
        catch (e) { /* try the next path */ }
      }
      return false;
    }
    var lastAt = {};
    function logThrottled(action) {
      var now = Date.now(), gap = CONFIG.minGapMs[action] || 0;
      if (lastAt[action] && now - lastAt[action] < gap) return;
      lastAt[action] = now;
      log(action);
    }

    /* ---------- online / offline (offline is written by Firebase itself when the connection drops) ---------- */
    var offRef = null;
    onValue(ref(db, '.info/connected'), async function (snap) {
      if (snap.val() !== true) return;
      await log('online');
      try { if (offRef) await dbMod.onDisconnect(offRef).cancel(); } catch (e) {}
      offRef = push(ref(db, base || CONFIG.paths[0]));
      dbMod.onDisconnect(offRef).set({ who: me, a: 'offline', ts: dbMod.serverTimestamp() }).catch(noop);
    }, noop);

    /* ---------- messages: sent / edited / deleted / cleared ---------- */
    var texts = {}, live = false;
    var clearIntent = 0, clearCount = 0, clearTimer = null;
    function isMsg(m) { return m && typeof m === 'object' && CONFIG.users.indexOf(m.user) > -1; }

    dbMod.onChildAdded(chatRef, function (snap) {
      var m = snap.val();
      if (!isMsg(m)) return;
      texts[snap.key] = m.text || '';
      if (live && m.user === me) log('sent', preview(m.text));
    }, noop);
    onValue(chatRef, function () { live = true; }, noop, { onlyOnce: true });

    dbMod.onChildChanged(chatRef, function (snap) {
      var m = snap.val();
      if (!isMsg(m) || m.user !== me) return;
      var old = texts[snap.key];
      texts[snap.key] = m.text || '';
      if (old !== undefined && old !== m.text) log('edited');        // the text itself is never stored
    }, noop);

    dbMod.onChildRemoved(chatRef, function (snap) {
      var m = snap.val();
      if (!isMsg(m)) return;
      delete texts[snap.key];
      if (Date.now() - clearIntent < 8000) {                         // I pressed "Clear Chat" a moment ago
        clearCount++;
        clearTimeout(clearTimer);
        clearTimer = setTimeout(function () { log('cleared', clearCount + ' messages'); clearCount = 0; clearIntent = 0; }, 700);
      } else if (m.user === me) {
        log('deleted');
      }
    }, noop);

    var clearBtn = document.querySelector('button[onclick*="clearAllMessages"]');
    if (clearBtn) clearBtn.addEventListener('click', function () { clearIntent = Date.now(); });

    /* ---------- typing / seen (taken from the other helper scripts' own markers) ---------- */
    onValue(ref(db, 'chatroom/_typing_' + me), function (snap) {
      var v = snap.val();
      if (typeof v === 'number' && v > 0) logThrottled('typing');
    }, noop);
    var firstSeen = true;
    onValue(ref(db, 'chatroom/_seen_' + me), function () {
      if (firstSeen) { firstSeen = false; return; }
      logThrottled('seen');
    }, noop);

    window.ChatActivity = { version: 1, user: me, path: function () { return base; } };
  }

  function boot() { start().catch(function (err) { console.warn('[chatbox-activity]', err); }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
