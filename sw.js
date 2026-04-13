// Questo script permette l'installazione su Android
self.addEventListener('fetch', function(event) {
    event.respondWith(fetch(event.request));
});

