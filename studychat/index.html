<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Study Master Chat</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <!-- Bootstrap 4 CSS -->
  <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
  <style>
    body {
      font-family: 'Inter', sans-serif;
      background-color: #121212;
      color: #eee;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
      transition: all 0.3s ease;
    }
    h2 { font-weight: 600; font-size: 24px; margin-bottom: 10px; }
    .chatBox {
      width: 100%;
      max-width: 500px;
      height: 60vh;
      background: #1e1e2a;
      border-radius: 15px;
      padding: 10px 15px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
      margin-bottom: 15px;
    }
    .message {
      display: inline-block;
      position: relative;
      padding: 10px 14px;
      max-width: 75%;
      word-wrap: break-word;
      border-radius: 18px;
      font-size: 14px;
      line-height: 1.5;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }
    .me { background: #4f46e5; color: white; align-self: flex-end; margin-left: auto; border-bottom-right-radius: 4px; }
    .other { background: #333; color: white; align-self: flex-start; margin-right: auto; border-bottom-left-radius: 4px; }
    .username { font-size: 12px; opacity: 0.7; margin-bottom: 2px; display: block; }
    .time { font-size: 11px; opacity: 0.6; margin-top: 6px; text-align: right; }
    #replyBox {
      max-width: 500px;
      width: 100%;
      margin-bottom: 8px;
      background: #2c2c2c;
      border-left: 4px solid #22c55e;
      padding: 8px 12px;
      font-size: 13px;
      border-radius: 8px;
      position: relative;
      color: #a5f3fc;
      font-style: italic;
      box-shadow: 0 0 6px rgba(0,0,0,0.4);
    }
    .quoted {
      background: rgba(255, 255, 255, 0.1);
      padding: 6px 10px;
      border-left: 4px solid #22c55e;
      margin-bottom: 6px;
      border-radius: 6px;
      font-size: 13px;
      font-style: italic;
      color: #d1fae5;
      white-space: pre-line;
    }
    .chatImage {
      max-width: 250px;
      max-height: 250px;
      border-radius: 10px;
      display: block;
      margin-top: 5px;
      cursor: pointer;
      transition: transform 0.2s;
    }
    .chatImage:hover { transform: scale(1.05); }
    .light { background-color: #f7f7f7; color: #111; }
    .light .chatBox { background: #fff; }
    .light .me { background-color: #4f46e5; color: white; }
    .light .other { background-color: #ddd; color: #000; }
    #topLinkButton {
      position: absolute;
      top: 20px;
      right: 20px;
      background-color: #ef4444;
      color: white;
      padding: 8px 14px;
      border-radius: 8px;
      text-decoration: none;
      font-size: 13px;
      font-weight: 500;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      transition: background 0.3s, transform 0.2s;
    }
    #topLinkButton:hover { background-color: #dc2626; transform: scale(1.05); }
  </style>
</head>
<body>
  <h2>📩 Study Master Chat</h2>
  <a id="topLinkButton" href="https://www.selfstudys.com/mcq/jee/physics/online-test/29-motion-in-a-plane" target="_blank">🔗 Open Link</a>
  
  <!-- Clear Chat -->
  <button onclick="clearAllMessages()" class="btn btn-danger btn-sm" style="position:absolute; top:60px; right:20px;">🧹 Clear Chat</button>
  
  <div id="chatBox" class="chatBox"></div>
  
  <!-- Reply Box -->
  <div id="replyBox" style="display:none;">
    <small><b id="replyUser"></b>: <span id="replyText"></span></small>
    <button onclick="cancelReply()" class="btn btn-sm btn-outline-light" style="float:right;font-size:12px;">❌</button>
  </div>

  <!-- Input Area -->
  <div class="input-group mb-3" style="max-width:500px;">
    <input type="text" id="messageInput" class="form-control" placeholder="Message..." />
    <div class="input-group-append">
      <button class="btn btn-primary" onclick="sendMessage()">➤</button>
      <button class="btn btn-secondary" onclick="document.getElementById('imageUpload').click()">🖼️</button>
    </div>
  </div>
  
  <!-- Hidden Image Upload -->
  <input type="file" id="imageUpload" accept="image/*" style="display:none;" onchange="sendImage(this)" />

  <div id="darkModeToggle" onclick="toggleTheme()" class="btn btn-sm btn-outline-light">🌗 Theme</div>

  <!-- Firebase + JS -->
  <script type="module">
    import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
    import { getDatabase, ref, push, onChildAdded, remove } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
    import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";

    const firebaseConfig = {
      apiKey: "AIzaSyDdtOwgFhAfS5E-aw00dp7h-C7552GsRG8",
      authDomain: "demochat-e3af0.firebaseapp.com",
      databaseURL: "https://demochat-e3af0-default-rtdb.firebaseio.com",
      projectId: "demochat-e3af0",
      storageBucket: "demochat-e3af0.firebasestorage.app",
      messagingSenderId: "17814560981",
      appId: "1:17814560981:web:627faf365da20d9707425c",
      measurementId: "G-EJ4EMNSJZ2"
    };

    const app = initializeApp(firebaseConfig);
    const analytics = getAnalytics(app);
    const db = getDatabase(app);
    const chatRef = ref(db, "chatroom");

    const allowedUsers = ["djkumar", "My life"];
    const params = new URLSearchParams(window.location.search);
    let username = params.get("user") || prompt("Enter your username:");

    if (!allowedUsers.includes(username)) {
      alert("❌ Access Denied. Only authorized users can access this chat.");
      document.body.innerHTML = "<h2 style='text-align:center;color:red;'>❌ Access Denied</h2>";
      throw new Error("Unauthorized user");
    }

    onChildAdded(chatRef, (data) => {
      const msg = data.val();
      const key = data.key;
      if (allowedUsers.includes(msg.user)) {
        const msgElem = document.createElement("div");
        msgElem.className = "message " + (msg.user === username ? "me" : "other");
        msgElem.innerHTML = `<span class="username">${msg.user}</span>${msg.text}<div class="time">${msg.time || ''}</div>`;
        msgElem.ondblclick = () => {
          document.getElementById("replyBox").style.display = "block";
          document.getElementById("replyUser").textContent = msg.user;
          document.getElementById("replyText").textContent = msg.text.replace(/<[^>]+>/g, '');
        };
        if (msg.user === username) {
          msgElem.style.cursor = "pointer";
          msgElem.title = "Click to delete";
          msgElem.onclick = () => {
            if (confirm("🗑️ Delete this message?")) {
              remove(ref(db, "chatroom/" + key)).then(() => msgElem.remove());
            }
          };
        }
        document.getElementById("chatBox").appendChild(msgElem);
        document.getElementById("chatBox").scrollTop = document.getElementById("chatBox").scrollHeight;
      }
    });

    window.sendMessage = function () {
      const input = document.getElementById("messageInput");
      const text = input.value.trim();
      if (!text) return;
      const replyTo = document.getElementById("replyText").textContent;
      const replyUser = document.getElementById("replyUser").textContent;
      const isReplying = document.getElementById("replyBox").style.display === "block";
      let fullMessage = text;
      if (isReplying) fullMessage = `<div class="quoted">↪️ ${replyUser}: ${replyTo}</div>${text}`;
      push(chatRef, { user: username, text: fullMessage, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
      input.value = "";
      cancelReply();
    };

    window.sendImage = function (input) {
      const file = input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function (e) {
        push(chatRef, {
          user: username,
          text: `<img src="${e.target.result}" class="chatImage" />`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        input.value = ""; // Reset to avoid duplicate sends
      };
      reader.readAsDataURL(file);
    };

    window.cancelReply = function () {
      document.getElementById("replyBox").style.display = "none";
      document.getElementById("replyUser").textContent = "";
      document.getElementById("replyText").textContent = "";
    };

    window.clearAllMessages = function () {
      if (confirm("⚠️ Delete all chat messages?")) {
        remove(chatRef).then(() => alert("✅ All messages deleted!"));
      }
    };

    function toggleTheme() { document.body.classList.toggle("light"); }
  </script>
</body>
</html>
