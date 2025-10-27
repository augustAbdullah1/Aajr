const CACHE_NAME = 'ajjar-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;600;700;800;900&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// تثبيت Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('تم فتح الكاش');
        return cache.addAll(urlsToCache);
      })
  );
});

// تفعيل Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('حذف الكاش القديم:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// اعتراض الطلبات
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // إرجاع الكاش إذا كان موجوداً
        if (response) {
          return response;
        }

        // محاولة جلب من الشبكة
        return fetch(event.request)
          .then(response => {
            // التحقق من أن الاستجابة صالحة
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // نسخ الاستجابة
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // إرجاع صفحة خطأ مخصصة
            if (event.request.destination === 'document') {
              return caches.match('/offline.html');
            }
          });
      })
  );
});

// معالجة الإشعارات
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'تذكير بالذكر',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'فتح التطبيق',
        icon: '/icons/icon-72x72.png'
      },
      {
        action: 'close',
        title: 'إغلاق',
        icon: '/icons/icon-72x72.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('آجر - تذكير', options)
  );
});

// معالجة النقر على الإشعارات
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// معالجة الإشعارات المغلقة
self.addEventListener('notificationclose', event => {
  console.log('تم إغلاق الإشعار:', event.notification.tag);
});

// معالجة رسائل الخلفية
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// تحديث التطبيق
self.addEventListener('appinstalled', event => {
  console.log('تم تثبيت التطبيق بنجاح');
});

// معالجة الأخطاء
self.addEventListener('error', event => {
  console.error('خطأ في Service Worker:', event.error);
});

// معالجة الرفض
self.addEventListener('unhandledrejection', event => {
  console.error('وعد مرفوض في Service Worker:', event.reason);
});