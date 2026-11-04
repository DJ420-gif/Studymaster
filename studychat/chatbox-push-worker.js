/*!
 * chatbox-push-worker.js — sends REAL push notifications (they arrive even when the browser is closed)
 *
 * Runs for free on Cloudflare Workers. Your sender page calls this Worker; the Worker looks up the
 * saved devices of the person in Firebase and pushes the notification to each of them.
 *
 * SET-UP (once, ~5 minutes)
 *  1. Open  chatbox-vapid-keys.html  in your browser → press "Generate" → keep the two keys.
 *  2. https://dash.cloudflare.com → Workers & Pages → Create → "Hello World" → Deploy → Edit code
 *     → delete everything → paste THIS file → fill the CONFIG below → Deploy.
 *  3. Copy the Worker address (https://something.workers.dev) — your sender page will call it.
 *  4. Put the PUBLIC key in chatbox-notify.js (vapidPublicKey).
 *
 * HOW THE SENDER PAGE SENDS ONE
 *     fetch("https://YOUR-WORKER.workers.dev", {
 *       method: "POST",
 *       headers: { "Content-Type": "application/json" },
 *       body: JSON.stringify({
 *         secret: "the sendSecret you chose below",
 *         to: "Rani",              // "Me", "Rani" or "all"
 *         from: "Me",              // optional: this person is skipped when to is "all"
 *         title: "Hello",
 *         body: "Message text",
 *         url: "",                 // optional: page to open when tapped
 *         tag: ""                  // optional: a new notification with the same tag replaces the old one
 *       })
 *     }).then(r => r.json()).then(console.log);   // -> { sent: 1, failed: 0, removed: 0 }
 */

const CONFIG = {
  // Your Firebase Realtime Database address (no slash at the end)
  dbUrl: 'https://dj420-ced11-default-rtdb.firebaseio.com',

  // Where the devices are saved — keep the same as pushPaths in chatbox-notify.js
  paths: ['chatPush', 'chatroom/_push'],

  // From chatbox-vapid-keys.html
  vapidPublicKey: '',      // the PUBLIC key (starts with B…)
  vapidPrivateJwk: '',     // the PRIVATE key line:  {"kty":"EC","crv":"P-256","x":"…","y":"…","d":"…"}
  vapidSubject: 'mailto:you@example.com',   // any email of yours

  // Choose any password. The sender page must send the same one.
  sendSecret: '',

  // Only allow this website to call the Worker ('*' = any website; the secret still protects it)
  allowOrigin: '*',

  users: ['Me', 'Rani'],
  ttlSeconds: 86400        // how long the phone/computer may wait to deliver (1 day)
};

/* ───────────────────────── helpers ───────────────────────── */
const enc = (s) => new TextEncoder().encode(s);
function concat(...arrs) {
  const out = new Uint8Array(arrs.reduce((n, a) => n + a.length, 0));
  let o = 0;
  for (const a of arrs) { out.set(a, o); o += a.length; }
  return out;
}
function b64u(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64uToBytes(str) {
  const pad = '='.repeat((4 - (str.length % 4)) % 4);
  const raw = atob((str + pad).replace(/-/g, '+').replace(/_/g, '/'));
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}
async function hkdf(salt, ikm, info, length) {
  const key = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, key, length * 8));
}

/* ─────────── Web Push encryption (RFC 8291, aes128gcm) ─────────── */
async function encryptPayload(plain, subKeys, test) {
  const uaPublic = b64uToBytes(subKeys.p256dh);
  const auth = b64uToBytes(subKeys.auth);

  let asKeys;
  if (test && test.asPrivateJwk) {            // only used to check the code against the RFC example
    const j = test.asPrivateJwk;
    asKeys = {
      privateKey: await crypto.subtle.importKey('jwk', j, { name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']),
      publicKey: await crypto.subtle.importKey('jwk', { kty: 'EC', crv: 'P-256', x: j.x, y: j.y }, { name: 'ECDH', namedCurve: 'P-256' }, true, [])
    };
  } else {
    asKeys = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  }
  const asPublic = new Uint8Array(await crypto.subtle.exportKey('raw', asKeys.publicKey));
  const uaKey = await crypto.subtle.importKey('raw', uaPublic, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: uaKey }, asKeys.privateKey, 256));

  const salt = test && test.salt ? test.salt : crypto.getRandomValues(new Uint8Array(16));
  const ikm = await hkdf(auth, shared, concat(enc('WebPush: info\0'), uaPublic, asPublic), 32);
  const cek = await hkdf(salt, ikm, enc('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, ikm, enc('Content-Encoding: nonce\0'), 12);

  const aes = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, aes, concat(plain, new Uint8Array([2]))));

  const header = concat(salt, new Uint8Array([0, 0, 16, 0]), new Uint8Array([asPublic.length]), asPublic);   // record size 4096
  return concat(header, cipher);
}

/* ─────────── VAPID (RFC 8292): proves the push comes from you ─────────── */
async function vapidHeader(endpoint, cfg) {
  const head = b64u(enc(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const claims = b64u(enc(JSON.stringify({
    aud: new URL(endpoint).origin,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600,
    sub: cfg.vapidSubject
  })));
  const j = JSON.parse(cfg.vapidPrivateJwk);
  const key = await crypto.subtle.importKey('jwk', { kty: 'EC', crv: 'P-256', x: j.x, y: j.y, d: j.d },
    { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, enc(head + '.' + claims)));
  return 'vapid t=' + head + '.' + claims + '.' + b64u(sig) + ', k=' + cfg.vapidPublicKey;
}

/* ───────────────────────── the Worker ───────────────────────── */
function pickConfig(env) {
  const c = Object.assign({}, CONFIG);
  if (env) {
    if (env.DB_URL) c.dbUrl = env.DB_URL;
    if (env.VAPID_PUBLIC_KEY) c.vapidPublicKey = env.VAPID_PUBLIC_KEY;
    if (env.VAPID_PRIVATE_JWK) c.vapidPrivateJwk = env.VAPID_PRIVATE_JWK;
    if (env.VAPID_SUBJECT) c.vapidSubject = env.VAPID_SUBJECT;
    if (env.SEND_SECRET) c.sendSecret = env.SEND_SECRET;
  }
  return c;
}

async function loadDevices(cfg, user) {
  const found = [];
  const seen = new Set();
  for (const path of cfg.paths) {
    try {
      const r = await fetch(cfg.dbUrl + '/' + path + '/' + user + '.json');
      if (!r.ok) continue;
      const data = await r.json();
      if (!data || typeof data !== 'object') continue;
      for (const id of Object.keys(data)) {
        const s = data[id];
        if (s && s.endpoint && s.keys && s.keys.p256dh && s.keys.auth && !seen.has(s.endpoint)) {
          seen.add(s.endpoint);
          found.push({ path, user, id, sub: s });
        }
      }
    } catch (e) { /* try the next path */ }
  }
  return found;
}

async function pushOne(cfg, device, payloadBytes) {
  const body = await encryptPayload(payloadBytes, device.sub.keys);
  const res = await fetch(device.sub.endpoint, {
    method: 'POST',
    headers: {
      'Authorization': await vapidHeader(device.sub.endpoint, cfg),
      'Content-Encoding': 'aes128gcm',
      'Content-Type': 'application/octet-stream',
      'TTL': String(cfg.ttlSeconds),
      'Urgency': 'high'
    },
    body
  });
  if (res.status === 404 || res.status === 410) {          // device unsubscribed → forget it
    try { await fetch(cfg.dbUrl + '/' + device.path + '/' + device.user + '/' + device.id + '.json', { method: 'DELETE' }); } catch (e) {}
    return 'removed';
  }
  return res.ok ? 'sent' : 'failed:' + res.status;
}

export default {
  async fetch(request, env) {
    const cfg = pickConfig(env);
    const cors = {
      'Access-Control-Allow-Origin': cfg.allowOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };
    const reply = (obj, status) => new Response(JSON.stringify(obj), {
      status: status || 200, headers: Object.assign({ 'Content-Type': 'application/json' }, cors)
    });

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return reply({ ok: true, service: 'chatbox-push', ready: !!(cfg.vapidPrivateJwk && cfg.sendSecret) });

    let msg;
    try { msg = await request.json(); } catch (e) { return reply({ error: 'Send JSON.' }, 400); }
    if (!cfg.sendSecret || msg.secret !== cfg.sendSecret) return reply({ error: 'Wrong secret.' }, 401);
    if (!cfg.vapidPrivateJwk || !cfg.vapidPublicKey) return reply({ error: 'Add the VAPID keys in the Worker CONFIG.' }, 500);

    const to = String(msg.to || '');
    const targets = to === 'all' ? cfg.users.filter((u) => u !== msg.from) : cfg.users.indexOf(to) > -1 ? [to] : [];
    if (!targets.length) return reply({ error: 'to must be "Me", "Rani" or "all".' }, 400);

    const payload = enc(JSON.stringify({
      title: String(msg.title || 'Study Master Chat').slice(0, 120),
      body: String(msg.body || '').slice(0, 800),
      url: String(msg.url || '').slice(0, 500),
      tag: String(msg.tag || '').slice(0, 60)
    }));

    let devices = [];
    for (const u of targets) devices = devices.concat(await loadDevices(cfg, u));
    if (!devices.length) return reply({ sent: 0, failed: 0, removed: 0, note: 'No saved devices yet — open the chat page once and allow notifications.' });

    const results = await Promise.all(devices.map((d) => pushOne(cfg, d, payload).catch((e) => 'failed:' + (e && e.message))));
    return reply({
      sent: results.filter((r) => r === 'sent').length,
      removed: results.filter((r) => r === 'removed').length,
      failed: results.filter((r) => r.indexOf('failed') === 0).length,
      details: results.filter((r) => r !== 'sent')
    });
  }
};
