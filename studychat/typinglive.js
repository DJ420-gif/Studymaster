
/*!
 * chatbox-live.js
 * LIVE TYPING PREVIEW — ME ONLY
 *
 * Me can see Rani's live typing.
 * Rani cannot see anyone's live typing.
 */

(function () {
  'use strict';

  var CONFIG = {
    firebaseVersion: '10.12.0',
    users: ['Me', 'Queen'],
    shareMyTyping: false,
    throttleMs: 120,
    maxChars: 500,
    expireMs: 15000
  };

  var BASE = 'https://www.gstatic.com/firebasejs/' +
    CONFIG.firebaseVersion + '/';

  function noop() {}

  function sleep(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  function lsGet(k) {
    try {
      return localStorage.getItem(k);
    } catch (e) {
      return null;
    }
  }

  /* ---------- Identify user ---------- */

  function inferMe() {
    var mine = document.querySelector('.message.me .username');

    if (mine) return mine.textContent.trim();

    var theirs = document.querySelector('.message.other .username');

    if (theirs) {
      var t = theirs.textContent.trim();

      return t === 'Me' ? 'Queen' :
             t === 'Queen' ? 'Me' : null;
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

      if (CONFIG.users.indexOf(g) > -1) return g;

      await sleep(250);
    }

    return null;
  }

  /* ---------- CSS ---------- */

  function injectCss() {
    if (document.getElementById('cblStyle')) return;

    var s = document.createElement('style');
    s.id = 'cblStyle';

    s.textContent =
      '.cbl-ghost{' +
        'align-self:flex-start;' +
        'max-width:75%;' +
        'margin-right:auto;' +
        'padding:10px 14px;' +
        'border-radius:var(--br,18px);' +
        'border-bottom-left-radius:4px;' +
        'font-size:var(--fs,14px);' +
        'line-height:1.5;' +
        'color:var(--text,#eee);' +
        'background:var(--other,#333);' +
        'opacity:.75;' +
        'border:1px dashed var(--line,rgba(255,255,255,.3));' +
        'word-wrap:break-word;' +
        'white-space:pre-wrap;' +
        'animation:cblIn .2s ease' +
      '}' +

      '.cbl-name{' +
        'display:block;' +
        'font-size:12px;' +
        'opacity:.7;' +
        'margin-bottom:2px' +
      '}' +

      '.cbl-caret{' +
        'display:inline-block;' +
        'width:2px;' +
        'height:1em;' +
        'margin-left:2px;' +
        'vertical-align:-2px;' +
        'background:currentColor;' +
        'animation:cblBlink 1s steps(1) infinite' +
      '}' +

      '.cbl-live{' +
        'display:block;' +
        'margin-top:4px;' +
        'font-size:10px;' +
        'letter-spacing:.08em;' +
        'text-transform:uppercase;' +
        'opacity:.6' +
      '}' +

      '@keyframes cblBlink{' +
        '50%{opacity:0}' +
      '}' +

      '@keyframes cblIn{' +
        'from{opacity:0;transform:translateY(6px)}' +
        'to{opacity:.75;transform:none}' +
      '}';

    document.head.appendChild(s);
  }

  /* ---------- Main ---------- */

  async function start() {
    var me = await findMe();

    if (!me) return;

    var other = me === 'Me' ? 'Queen' : 'Me';

    var chatBox = document.getElementById('chatBox');
    var input = document.getElementById('messageInput');

    if (!chatBox || !input) return;

    var appMod = await import(BASE + 'firebase-app.js');
    var dbMod = await import(BASE + 'firebase-database.js');

    for (var w = 0; w < 100 && !appMod.getApps().length; w++) {
      await sleep(150);
    }

    if (!appMod.getApps().length) {
      console.warn('[chatbox-live] Firebase app not found');
      return;
    }

    var db = dbMod.getDatabase(appMod.getApp());

    var ref = dbMod.ref;
    var set = dbMod.set;
    var remove = dbMod.remove;
    var onValue = dbMod.onValue;

    injectCss();

    /* =========================================
       MY DRAFT
       Only Me can publish typing.
    ========================================= */

    var draftRef = ref(db, 'chatroom/_draft_' + me);

    var sharing = me === 'Me' && CONFIG.shareMyTyping;

    var lastSent = '';
    var timer = null;

    function wanted() {
      var t = String(input.value || '').slice(
        0,
        CONFIG.maxChars
      );

      return sharing && t.trim() ? t : '';
    }

    function flush() {
      clearTimeout(timer);
      timer = null;

      var t = wanted();

      if (t === lastSent) return;

      lastSent = t;

      (t ? set(draftRef, t) : remove(draftRef))
        .catch(noop);
    }

    function check() {
      if (wanted() === lastSent) return;

      if (!timer) {
        timer = setTimeout(flush, CONFIG.throttleMs);
      }
    }

    input.addEventListener('input', check);
    input.addEventListener('keyup', check);
    input.addEventListener('change', check);

    setInterval(check, 250);

    dbMod.onValue(
      ref(db, '.info/connected'),
      function (snap) {
        if (snap.val() === true) {
          dbMod.onDisconnect(draftRef)
            .remove()
            .catch(noop);
        }
      },
      noop
    );

    /* =========================================
       RECEIVER
       ONLY Me can see Rani's typing.
    ========================================= */

    if (me !== 'Me') {
      window.ChatLive = {
        version: 2,
        share: function () {},
        isSharing: function () {
          return false;
        }
      };

      return;
    }

    /* =========================================
       RANI'S DRAFT → FADED BUBBLE
    ========================================= */

    var ghost = document.createElement('div');
    ghost.className = 'cbl-ghost';

    var nameEl = document.createElement('span');
    nameEl.className = 'cbl-name';
    nameEl.textContent = other;

    var textEl = document.createElement('span');
    textEl.className = 'cbl-text';

    var caret = document.createElement('i');
    caret.className = 'cbl-caret';

    var liveEl = document.createElement('span');
    liveEl.className = 'cbl-live';
    liveEl.textContent = '● typing live';

    ghost.appendChild(nameEl);
    ghost.appendChild(textEl);
    ghost.appendChild(caret);
    ghost.appendChild(liveEl);

    var otherDraft = '';
    var suppress = null;
    var expireTimer = null;

    function hide() {
      if (ghost.parentNode) {
        ghost.parentNode.removeChild(ghost);
      }
    }

    function show(text) {
      var near =
        chatBox.scrollHeight -
        chatBox.scrollTop -
        chatBox.clientHeight < 90;

      textEl.textContent = text;

      if (
        ghost.parentNode !== chatBox ||
        chatBox.lastChild !== ghost
      ) {
        chatBox.appendChild(ghost);
      }

      if (near) {
        chatBox.scrollTop = chatBox.scrollHeight;
      }
    }

    function paint() {
      clearTimeout(expireTimer);

      if (!otherDraft.trim() || otherDraft === suppress) {
        hide();
        return;
      }

      show(otherDraft);

      expireTimer = setTimeout(
        hide,
        CONFIG.expireMs
      );
    }

    onValue(
      ref(db, 'chatroom/_draft_Queen'),
      function (snap) {
        var v = snap.val();

        otherDraft = typeof v === 'string' ? v : '';

        if (
          suppress !== null &&
          otherDraft !== suppress
        ) {
          suppress = null;
        }

        paint();
      },
      noop
    );

    /* =========================================
       MESSAGE ARRIVAL DETECTION
    ========================================= */

    new MutationObserver(function (list) {
      list.forEach(function (m) {
        m.addedNodes.forEach(function (n) {
          if (
            n === ghost ||
            n.nodeType !== 1 ||
            !n.classList.contains('message')
          ) {
            return;
          }

          if (n.classList.contains('me')) {
            flush();
          } else {
            suppress = otherDraft;
            hide();
          }
        });
      });

      if (
        ghost.parentNode === chatBox &&
        chatBox.lastChild !== ghost
      ) {
        chatBox.appendChild(ghost);
      }
    }).observe(chatBox, {
      childList: true
    });

    /* ---------- Public controls ---------- */

    window.ChatLive = {
      version: 2,

      share: function () {
        sharing = false;
        flush();
      },

      isSharing: function () {
        return false;
      }
    };
  }

  function boot() {
    start().catch(function (err) {
      console.warn('[chatbox-live]', err);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
    
