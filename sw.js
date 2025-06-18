// Service Worker للعمل بدون إنترنت
const CACHE_NAME = 'printing-management-v1.0.0';
const urlsToCache = [
    '/',
    '/code.html',
    '/manifest.json',
    '/assets/icon-192x192.png',
    '/assets/icon-512x512.png'
];

// تثبيت Service Worker
self.addEventListener('install', event => {
    console.log('🔧 تثبيت Service Worker...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📦 فتح الكاش');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                console.log('✅ تم تثبيت Service Worker بنجاح');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('❌ خطأ في تثبيت Service Worker:', error);
            })
    );
});

// تفعيل Service Worker
self.addEventListener('activate', event => {
    console.log('🚀 تفعيل Service Worker...');
    
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ حذف كاش قديم:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('✅ تم تفعيل Service Worker بنجاح');
            return self.clients.claim();
        })
    );
});

// اعتراض الطلبات
self.addEventListener('fetch', event => {
    // تجاهل الطلبات غير HTTP/HTTPS
    if (!event.request.url.startsWith('http')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // إرجاع الملف من الكاش إذا وُجد
                if (response) {
                    console.log('📦 تم تحميل من الكاش:', event.request.url);
                    return response;
                }

                // تحميل من الشبكة إذا لم يوجد في الكاش
                console.log('🌐 تحميل من الشبكة:', event.request.url);
                return fetch(event.request)
                    .then(response => {
                        // التحقق من صحة الاستجابة
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // نسخ الاستجابة لحفظها في الكاش
                        const responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch(error => {
                        console.error('❌ خطأ في تحميل الملف:', error);
                        
                        // إرجاع صفحة بديلة للملفات HTML
                        if (event.request.destination === 'document') {
                            return caches.match('/code.html');
                        }
                        
                        throw error;
                    });
            })
    );
});

// التعامل مع الرسائل
self.addEventListener('message', event => {
    console.log('📨 رسالة من التطبيق:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({
            version: CACHE_NAME
        });
    }
});

// إشعار بالتحديثات
self.addEventListener('updatefound', () => {
    console.log('🔄 تم العثور على تحديث جديد');
});

// التعامل مع الأخطاء
self.addEventListener('error', event => {
    console.error('❌ خطأ في Service Worker:', event.error);
});

// التعامل مع الأخطاء غير المعالجة
self.addEventListener('unhandledrejection', event => {
    console.error('❌ خطأ غير معالج في Service Worker:', event.reason);
    event.preventDefault();
});

console.log('🖨️ Service Worker لنظام إدارة الطباعة جاهز');
