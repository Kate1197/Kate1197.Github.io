/* 艾米日签 PWA Service Worker
   策略：
   - 数据文件 / data/*.json：网络优先（保证后台更新后立刻拿到新内容），失败回落缓存
   - 页面导航：网络优先，失败回落缓存（离线可用）
   - 静态资源（图片/图标等）：stale-while-revalidate
   - /admin 后台：完全不拦截
*/
const VERSION = 'ami-2026-11-14-4';
const STATIC_CACHE = 'ami-static-' + VERSION;
const DATA_CACHE = 'ami-data-' + VERSION;

const SHELL = [
  './',
  './index.html',
  './riqian.html',
  './xingcheng.html',
  './chanchu.html',
  './interview.html',
  './brands.html',
  './blog.html',
  './aixin.html',
  './manifest.json',
  './favicon.png',
  './favicon.ico',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => Promise.allSettled(SHELL.map((url) => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  const keep = [STATIC_CACHE, DATA_CACHE];
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => keep.indexOf(k) === -1).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.indexOf('/admin') === 0) return;

  // 后台数据：网络优先
  if (url.pathname.indexOf('/data/') !== -1) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(DATA_CACHE).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // 页面导航：网络优先，离线回落缓存页面
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(STATIC_CACHE).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() =>
          caches.match(req).then((hit) => hit || caches.match('./index.html'))
        )
    );
    return;
  }

  // 静态资源：先给缓存，同时后台更新
  event.respondWith(
    caches.match(req).then((hit) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(STATIC_CACHE).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => hit);
      return hit || network;
    })
  );
});
