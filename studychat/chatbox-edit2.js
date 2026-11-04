/*!
 * chatbox-edit.js (swipe version)  —  add-on for Study Master Chat
 *
 * SWIPE one of YOUR messages (drag it left, right, or any other direction) and it turns into
 * a small editor. Press ✓ (or Enter) and the message simply becomes the new message — on both
 * screens, with nothing extra added. ✕ (or Esc) cancels.
 *
 * It does not change your chat script or Firebase setup. It only listens to the same
 * "chatroom" and updates the "text" of your own message.
 *
 * Add before </body>, after your chat script (replace the old chatbox-edit.js line):
 *     <script defer src="chatbox-edit.js?v=3"></script>
 */
(function () {
  'use strict';

  var FIREBASE_VERSION = '10.12.0';      // keep the same version your chat script uses
  var ALLOWED = ['Me', 'Queen'];
  var SWIPE_PX = 50;                     // drag this far to open the editor
  var ACTIVE_PX = 8;                     // below this it is just a tap
  var FOLLOW_MAX = 70;                   // how far the bubble follows your finger
  // On a phone, swiping UP/DOWN on a message normally scrolls the chat. Set this to true if you want
  // up/down swipes on your own messages to edit as well (then start scrolling from empty space or
  // from the other person's messages).
  var VERTICAL_SWIPE_ON_TOUCH = false;

  var BASE = 'https://www.gstatic.com/firebasejs/' + FIREBASE_VERSION + '/';
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function injectCss() {
    if (document.getElementById('cbeStyle')) return;
    var s = document.createElement('style');
    s.id = 'cbeStyle';
    s.textContent =
      '.message.me{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;touch-action:' + (VERTICAL_SWIPE_ON_TOUCH ? 'none' : 'pan-y') + '}' +
      '.message.me .cbe-edit{display:flex;align-items:center;gap:6px;margin:4px 0 2px;-webkit-user-select:text;user-select:text;touch-action:auto}' +
      '.cbe-input{flex:1;min-width:140px;width:100%;border:0;outline:0;border-radius:8px;padding:6px 9px;font:inherit;color:inherit;background:rgba(255,255,255,.22)}' +
      '.cbe-btn{flex:none;width:26px;height:26px;padding:0;border:0;border-radius:50%;cursor:pointer;font-size:13px;line-height:1;color:inherit;background:rgba(255,255,255,.3)}' +
      '.cbe-btn:hover{background:rgba(255,255,255,.5)}';
    document.head.appendChild(s);
  }

  /* a reply is stored as  <div class="quoted">…</div>  followed by the real text */
  function splitText(text) {
    var m = /^(<div class="quoted">[\s\S]*?<\/div>)([\s\S]*)$/.exec(text || '');
    return m ? { prefix: m[1], body: m[2] } : { prefix: '', body: text || '' };
  }

  /* the "body" of a bubble = everything between the name label and the time label */
  function clearBody(el) {
    var time = el.querySelector('.time');
    if (!time) return null;
    var user = el.querySelector('.username');
    var n = user ? user.nextSibling : el.firstChild;
    while (n && n !== time) { var next = n.nextSibling; el.removeChild(n); n = next; }
    return time;
  }
  function setBody(el, html) {
    var time = clearBody(el);
    if (!time) return;
    var tpl = document.createElement('template');
    tpl.innerHTML = html;
    el.insertBefore(tpl.content, time);
  }

  function closestMe(node) {
    while (node && node.nodeType === 1) {
      if (node.classList && node.classList.contains('message')) return node.classList.contains('me') ? node : null;
      node = node.parentNode;
    }
    return null;
  }

  async function start() {
    var chatBox = document.getElementById('chatBox');
    if (!chatBox) return;

    var appMod = await import(BASE + 'firebase-app.js');
    var dbMod = await import(BASE + 'firebase-database.js');
    for (var w = 0; w < 100 && !appMod.getApps().length; w++) await sleep(150);
    if (!appMod.getApps().length) { console.warn('[chatbox-edit] Firebase app not found'); return; }

    var db = dbMod.getDatabase(appMod.getApp());
    var ref = dbMod.ref, update = dbMod.update;
    var chatRef = ref(db, 'chatroom');

    injectCss();

    /* ---------- know which Firebase key belongs to which bubble ---------- */
    var store = {};                    // key -> message data
    var elByKey = {};                  // key -> bubble element
    var keyQueue = [], elQueue = [];

    function isMsg(m) { return m && typeof m === 'object' && ALLOWED.indexOf(m.user) > -1; }
    function pair() {
      while (keyQueue.length && elQueue.length) {
        var el = elQueue.shift(), k = keyQueue.shift();
        el.setAttribute('data-ekey', k);
        elByKey[k] = el;
      }
    }
    var existing = chatBox.querySelectorAll('.message');
    for (var i = 0; i < existing.length; i++) elQueue.push(existing[i]);
    new MutationObserver(function (list) {
      list.forEach(function (m) {
        m.addedNodes.forEach(function (n) {
          if (n.nodeType === 1 && n.classList.contains('message')) elQueue.push(n);
        });
      });
      pair();
    }).observe(chatBox, { childList: true });

    // replying (double-click) should quote the NEW text of an edited message
    function rebindReply(el, m) {
      el.ondblclick = function () {
        var box = document.getElementById('replyBox');
        if (!box) return;
        box.style.display = 'block';
        document.getElementById('replyUser').textContent = m.user;
        document.getElementById('replyText').textContent = m.text;
      };
    }

    dbMod.onChildAdded(chatRef, function (snap) {
      var m = snap.val();
      if (!isMsg(m)) return;
      store[snap.key] = m;
      keyQueue.push(snap.key);
      pair();
    }, function () {});

    // an edit (by you or by the other person) arrives here and the bubble becomes the new message
    dbMod.onChildChanged(chatRef, function (snap) {
      var m = snap.val();
      if (!isMsg(m)) return;
      store[snap.key] = m;
      var el = elByKey[snap.key];
      if (el && el.parentNode) { setBody(el, m.text); rebindReply(el, m); }
    }, function () {});

    /* ---------- the bubble turns into an editor ---------- */
    function startEdit(el) {
      var key = el.getAttribute('data-ekey'), m = key && store[key];
      if (!m || el.querySelector('.cbe-edit')) return;
      var parts = splitText(m.text);
      var time = clearBody(el);
      if (!time) return;

      if (parts.prefix) {
        var tpl = document.createElement('template');
        tpl.innerHTML = parts.prefix;
        el.insertBefore(tpl.content, time);
      }
      var row = document.createElement('span');
      row.className = 'cbe-edit';
      var input = document.createElement('input');
      input.type = 'text';
      input.className = 'cbe-input';
      input.value = parts.body;
      var ok = document.createElement('button');
      ok.type = 'button'; ok.className = 'cbe-btn'; ok.textContent = '✓'; ok.title = 'Save';
      var no = document.createElement('button');
      no.type = 'button'; no.className = 'cbe-btn'; no.textContent = '✕'; no.title = 'Cancel';
      row.appendChild(input); row.appendChild(ok); row.appendChild(no);
      el.insertBefore(row, time);

      // taps inside the editor must not trigger "delete message" / "reply"
      ['click', 'dblclick'].forEach(function (ev) { row.addEventListener(ev, function (e) { e.stopPropagation(); }); });

      function cancel() { setBody(el, (store[key] && store[key].text) || m.text); }
      function save() {
        var v = input.value.trim();
        if (!v || v === parts.body) { cancel(); return; }
        var full = parts.prefix + v;
        ok.disabled = true;
        update(ref(db, 'chatroom/' + key), { text: full }).then(function () {
          if (el.querySelector('.cbe-edit')) setBody(el, full);      // safety: normally already updated
        }).catch(function (err) {
          console.warn('[chatbox-edit] could not save', err);
          cancel();
        });
      }
      ok.addEventListener('click', save);
      no.addEventListener('click', cancel);
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); save(); }
        else if (e.key === 'Escape') { e.preventDefault(); cancel(); }
      });
      input.focus();
      try { input.setSelectionRange(input.value.length, input.value.length); } catch (e) {}
    }

    /* ---------- swipe ---------- */
    var drag = null;
    var swallow = false, swallowTimer = null;
    // after a swipe your chat script would see the release as a normal click and ask
    // "Delete this message?" — that one click is swallowed
    function armSwallow() { swallow = true; clearTimeout(swallowTimer); swallowTimer = setTimeout(function () { swallow = false; }, 20000); }
    function releaseSwallow() { if (!swallow) return; clearTimeout(swallowTimer); swallowTimer = setTimeout(function () { swallow = false; }, 400); }

    chatBox.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      var el = closestMe(e.target);
      if (!el || el.querySelector('.cbe-edit')) return;
      var key = el.getAttribute('data-ekey'), m = key && store[key];
      if (!m || /<img\b/i.test(m.text || '')) return;                   // photos cannot be edited
      drag = { el: el, id: e.pointerId, x: e.clientX, y: e.clientY, dx: 0, dy: 0, active: false };
    });

    document.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      drag.dx = e.clientX - drag.x;
      drag.dy = e.clientY - drag.y;
      var dist = Math.sqrt(drag.dx * drag.dx + drag.dy * drag.dy);
      if (!drag.active && dist > ACTIVE_PX) drag.active = true;
      if (drag.active) {                                                 // the bubble follows your finger a little
        var k = dist > FOLLOW_MAX ? FOLLOW_MAX / dist : 1;
        drag.el.style.transform = 'translate(' + (drag.dx * k) + 'px,' + (drag.dy * k) + 'px)';
      }
    });

    function endDrag(commit) {
      if (!drag) return;
      var d = drag;
      drag = null;
      d.el.style.transition = 'transform .18s ease';
      d.el.style.transform = '';
      setTimeout(function () { d.el.style.transition = ''; }, 220);
      if (d.active) armSwallow();
      if (commit && Math.sqrt(d.dx * d.dx + d.dy * d.dy) >= SWIPE_PX) startEdit(d.el);
    }
    document.addEventListener('pointerup', function (e) {
      if (drag && e.pointerId === drag.id) endDrag(true);
      releaseSwallow();
    }, true);
    document.addEventListener('pointercancel', function (e) {          // e.g. the phone started scrolling instead
      if (drag && e.pointerId === drag.id) endDrag(false);
      releaseSwallow();
    }, true);

    chatBox.addEventListener('click', function (e) {
      if (swallow) { e.stopPropagation(); e.preventDefault(); }
    }, true);
    chatBox.addEventListener('contextmenu', function (e) { if (closestMe(e.target)) e.preventDefault(); });

    // handy check from the browser console:  ChatEdit.linked()  -> how many bubbles are connected
    window.ChatEdit = {
      version: 3,
      linked: function () { return chatBox.querySelectorAll('[data-ekey]').length; }
    };
  }

  function boot() { start().catch(function (err) { console.warn('[chatbox-edit]', err); }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
