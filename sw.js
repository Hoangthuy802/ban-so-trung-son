/* Quét thẻ · Bản số Trung Sơn — bộ nhớ đệm để mở app nhanh và còn mở được giao diện khi mạng yếu.
   Chỉ nhớ trang, thư viện đọc QR. KHÔNG nhớ và không chặn các lời gọi tới máy chủ Google (luôn đi thẳng ra mạng). */
var C = 'quet-the-v1';
var DS = ['quet.html', 'manifest.webmanifest', 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(C).then(function (c) {
    return Promise.all(DS.map(function (u) { return c.add(new Request(u, { mode: /^https:/.test(u) ? 'cors' : 'same-origin' })).catch(function () {}); }));
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (k) { return Promise.all(k.filter(function (x) { return x !== C; }).map(function (x) { return caches.delete(x); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var u = new URL(e.request.url);
  if (u.origin === location.origin) {                 // trang của mình: ưu tiên bản mới trên mạng, mất mạng thì dùng bản nhớ
    e.respondWith(fetch(e.request).then(function (r) { var cp = r.clone(); caches.open(C).then(function (c) { c.put(e.request, cp); }); return r; })
      .catch(function () { return caches.match(e.request).then(function (r) { return r || caches.match('quet.html'); }); }));
  } else if (u.hostname === 'cdn.jsdelivr.net') {      // thư viện đọc QR: nhớ lại, lần sau khỏi tải
    e.respondWith(caches.match(e.request).then(function (r) { return r || fetch(e.request).then(function (x) { var cp = x.clone(); caches.open(C).then(function (c) { c.put(e.request, cp); }); return x; }); }));
  }                                                    // còn lại (máy chủ Google…) không đụng tới
});
