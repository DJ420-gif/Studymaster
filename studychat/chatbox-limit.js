/*!
 * chatbox-limit.js  —  keep the chat light: only the newest 50 messages stay on screen
 *
 * Older bubbles are removed from the page as new ones arrive (and right after the chat loads),
 * so scrolling, typing and animations stay smooth even when the chat has thousands of messages.
 * Nothing is deleted from Firebase — the messages are still saved (and chatbox-backup.js keeps a copy).
 *
 * It does not change your chat script. Add before </body>, after your chat script:
 *     <script defer src="chatbox-limit.js"></script>
 *
 * Change the number below if you want more or fewer. Console:  ChatLimit.max  ·  ChatLimit.trim()
 */
(function () {
  'use strict';

  var MAX_MESSAGES = 50;

  function start() {
    var box = document.getElementById('chatBox');
    if (!box) return;

    function trim() {
      var list = box.querySelectorAll('.message');          // oldest first
      var extra = list.length - MAX_MESSAGES;
      if (extra <= 0) return 0;
      var nearBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 120;
      for (var i = 0; i < extra; i++) {
        if (list[i].parentNode) list[i].parentNode.removeChild(list[i]);
      }
      if (nearBottom) box.scrollTop = box.scrollHeight;     // keep the newest message in view
      return extra;
    }

    new MutationObserver(function (records) {
      for (var i = 0; i < records.length; i++) {
        var added = records[i].addedNodes;
        for (var j = 0; j < added.length; j++) {
          if (added[j].nodeType === 1 && added[j].classList.contains('message')) { trim(); return; }
        }
      }
    }).observe(box, { childList: true });

    trim();                                                  // the chat may already be loaded
    window.ChatLimit = { version: 1, max: MAX_MESSAGES, trim: trim };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
