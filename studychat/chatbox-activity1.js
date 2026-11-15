
/*!
 * chatbox-activity.js
 * Activity tracking for Study Master Chat
 */
(function () {
  'use strict';

  /* ================= SETTINGS ================= */

  var CONFIG = {
    firebaseVersion: '10.12.0',
    users: ['Me', 'Queen'],

    paths: ['chatActivity', 'chatroom/_log'],

    previewChars: 35,

    minGapMs: {
      typing: 45000,
      seen: 30000
    }
  };

  var BASE =
    'https://www.gstatic.com/firebase/' +
    CONFIG.firebaseVersion + '/';

  function noop() {}

  function sleep(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  /* ================= IDENTIFY USER ================= */

  function inferMe() {
    var mine = document.querySelector(
      '.message.me .username'
    );

    if (mine) return mine.textContent.trim();

    var theirs = document.querySelector(
      '.message.other .username'
    );

    if (theirs) {
      var t = theirs.textContent.trim();

      if (t === 'Me') return 'Queen';
      if (t === 'Queen') return 'Me';
    }

    return null;
  }

  async function findMe() {
    var u = new URLSearchParams(
      window.location.search
    ).get('user');

    if (!u && window.__chatUser !== undefined) {
      u = window.__chatUser;
    }

    if (u) {
      return CONFIG.users.indexOf(u) > -1 ? u : null;
    }

    if (window.__chatUser === null) return null;

    for (var i = 0; i < 120; i++) {
      var g = inferMe();

      if (CONFIG.users.indexOf(g) > -1) {
        return g;
      }

      await sleep(250);
    }

    return null;
  }

  /* ================= MESSAGE PREVIEW ================= */

  function preview(text) {
    var s = String(text || '');

    if (/<img\b/i.test(s)) {
      return '📷 Photo';
    }

    s = s
      .replace(
        /^<div class="quoted">[\s\S]*?<\/div>/,
        '↪ '
      )
      .replace(/<[^>]*>/g, '')
      .trim();

    if (s.length > CONFIG.previewChars) {
      s = s.slice(0, CONFIG.previewChars) + '…';
    }

    return s;
  }

  /* ================= MAIN ================= */

  async function start() {

    var me = await findMe();

    if (!me) {
      console.warn(
        '[chatbox-activity] Could not identify user.'
      );
      return;
    }

    /* Firebase modules */

    var appMod = await import(
      BASE + 'firebase-app.js'
    );

    var dbMod = await import(
      BASE + 'firebase-database.js'
    );

    /* Wait for main chat Firebase app */

    for (
      var w = 0;
      w < 100 && !appMod.getApps().length;
      w++
    ) {
      await sleep(150);
    }

    if (!appMod.getApps().length) {
      console.warn(
        '[chatbox-activity] Firebase app not found.'
      );
      return;
    }

    var db = dbMod.getDatabase(
      appMod.getApp()
    );

    var ref = dbMod.ref;
    var push = dbMod.push;
    var set = dbMod.set;
    var onValue = dbMod.onValue;

    var chatRef = ref(db, 'chatroom');

    /* ================= ACTIVITY LOGGER ================= */

    var base = null;

    async function log(action, detail) {

      var entry = {
        who: me,
        a: action,
        ts: dbMod.serverTimestamp()
      };

      if (detail) {
        entry.d = String(detail);
      }

      var order = base
        ? [base]
        : CONFIG.paths;

      for (var i = 0; i < order.length; i++) {

        try {
          await set(
            push(ref(db, order[i])),
            entry
          );

          base = order[i];

          return true;

        } catch (e) {
          console.warn(
            '[chatbox-activity] Log path failed:',
            order[i],
            e
          );
        }
      }

      console.warn(
        '[chatbox-activity] Could not save activity.'
      );

      return false;
    }

    /* ================= THROTTLING ================= */

    var lastAt = {};

    function logThrottled(action) {

      var now = Date.now();

      var gap =
        CONFIG.minGapMs[action] || 0;

      if (
        lastAt[action] &&
        now - lastAt[action] < gap
      ) {
        return;
      }

      lastAt[action] = now;

      log(action);
    }

    /* ================= ONLINE / OFFLINE ================= */

    var offRef = null;

    onValue(
      ref(db, '.info/connected'),

      async function (snap) {

        if (snap.val() !== true) return;

        /* Record online */

        var saved = await log('online');

        if (!saved) return;

        /* Cancel previous disconnect handler */

        try {
          if (offRef) {
            await dbMod.onDisconnect(offRef).cancel();
          }
        } catch (e) {}

        /* Register offline event */

        offRef = push(
          ref(db, base)
        );

        dbMod.onDisconnect(offRef)
          .set({
            who: me,
            a: 'offline',
            ts: dbMod.serverTimestamp()
          })
          .catch(noop);

      },

      noop
    );

    /* ================= MESSAGE TRACKING ================= */

    var texts = {};

    var live = false;

    var clearIntent = 0;
    var clearCount = 0;
    var clearTimer = null;

    function isMsg(m) {
      return (
        m &&
        typeof m === 'object' &&
        CONFIG.users.indexOf(m.user) > -1
      );
    }

    /* New messages */

    dbMod.onChildAdded(
      chatRef,

      function (snap) {

        var m = snap.val();

        if (!isMsg(m)) return;

        texts[snap.key] = m.text || '';

        if (live && m.user === me) {

          var shortPreview = preview(m.text);

          log(
            'sent',
            shortPreview
          );
        }

      },

      noop
    );

    /* Prevent existing messages from being logged as new */

    onValue(
      chatRef,

      function () {
        live = true;
      },

      noop,

      { onlyOnce: true }
    );

    /* Edited messages */

    dbMod.onChildChanged(
      chatRef,

      function (snap) {

        var m = snap.val();

        if (!isMsg(m)) return;
        if (m.user !== me) return;

        var old = texts[snap.key];

        texts[snap.key] = m.text || '';

        if (
          old !== undefined &&
          old !== m.text
        ) {
          log('edited');
        }

      },

      noop
    );

    /* Deleted messages */

    dbMod.onChildRemoved(
      chatRef,

      function (snap) {

        var m = snap.val();

        if (!isMsg(m)) return;

        delete texts[snap.key];

        if (
          Date.now() - clearIntent < 8000
        ) {

          clearCount++;

          clearTimeout(clearTimer);

          clearTimer = setTimeout(
            function () {

              log(
                'cleared',
                clearCount + ' messages'
              );

              clearCount = 0;
              clearIntent = 0;

            },
            700
          );

        } else if (m.user === me) {

          log('deleted');

        }

      },

      noop
    );

    /* Detect Clear Chat button */

    var clearBtn = document.querySelector(
      'button[onclick*="clearAllMessages"]'
    );

    if (clearBtn) {

      clearBtn.addEventListener(
        'click',

        function () {
          clearIntent = Date.now();
        }
      );

    }

    /* ================= TYPING TRACKING ================= */

    onValue(
      ref(db, 'chatroom/_typing_' + me),

      function (snap) {

        var v = snap.val();

        if (
          typeof v === 'number' &&
          v > 0
        ) {
          logThrottled('typing');
        }

      },

      noop
    );

    /* ================= SEEN TRACKING ================= */

    var firstSeen = true;

    onValue(
      ref(db, 'chatroom/_seen_' + me),

      function () {

        if (firstSeen) {
          firstSeen = false;
          return;
        }

        logThrottled('seen');

      },

      noop
    );

    /* ================= PUBLIC STATUS ================= */

    window.ChatActivity = {
      version: 2,
      user: me,

      path: function () {
        return base;
      }
    };

    console.log(
      '[chatbox-activity] Started for:',
      me
    );

  }

  /* ================= INITIALIZE ================= */

  function boot() {

    start().catch(function (err) {

      console.warn(
        '[chatbox-activity]',
        err
      );

    });

  }

  if (
    document.readyState === 'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      boot
    );

  } else {

    boot();

  }

})();
      
