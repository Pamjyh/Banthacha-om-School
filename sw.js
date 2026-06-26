// =====================================================================
// Service Worker — โรงเรียนบ้านท่าชะอม
// v1.0 — cache-first static, network-only API
// =====================================================================
const CACHE_NAME = 'banthacha-om-v2';

// ไฟล์ที่ pre-cache ตอน install
const PRE_CACHE = [
  './',
  './assets/school-logo.jpg',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/apple-touch-icon.png',
  './manifest.json',
  // subsystems
  './ระบบบริหารงาน/',
  './ระบบออมทรัพย์/',
  './ระบบค่ารถ/',
  './ระบบลงเวลา/',
  './ระบบสารบัญ/',
];

// domain ที่ไม่ cache (API calls)
const NO_CACHE_HOSTS = [
  'script.google.com',
  'supabase.co',
  'fonts.googleapis.com',  // โหลดสดเสมอ
  'fonts.gstatic.com',
  'cdn.jsdelivr.net',
];

function isApiCall(url) {
  return NO_CACHE_HOSTS.some(h => url.hostname.includes(h));
}

// ─── INSTALL ─────────────────────────────────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // ล้มเหลวแต่ละไฟล์ได้ — ไม่ให้ block install ทั้งหมด
      return Promise.allSettled(PRE_CACHE.map(url => cache.add(url)));
    }).then(() => self.skipWaiting())
  );
});

// ─── ACTIVATE ────────────────────────────────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ─── FETCH ───────────────────────────────────────────────────────────
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // API calls → network only (ห้าม cache ข้อมูลสด)
  if (isApiCall(url)) return;

  // GET only
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      // Stale-while-revalidate: คืน cache ทันที + update ใน background
      const networkFetch = fetch(e.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => null);

      return cached || networkFetch;
    })
  );
});
