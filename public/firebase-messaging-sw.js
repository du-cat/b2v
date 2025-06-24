// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here. Other Firebase libraries
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
firebase.initializeApp({
  apiKey: "AIzaSyDF1ICOF7H_oKLCfhkwNYdfdemY-UEdu6I",
  authDomain: "retail-8a7e5.firebaseapp.com",
  projectId: "retail-8a7e5",
  storageBucket: "retail-8a7e5.firebasestorage.app",
  messagingSenderId: "786252300078",
  appId: "1:786252300078:web:4440fc78094aa7b57044bf",
  measurementId: "G-9SN1BP2YET"
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Background message received:', payload);

  // Customize notification here
  const notificationTitle = payload.notification.title || 'SentinelPOS Guardian';
  const notificationOptions = {
    body: payload.notification.body || 'New security alert',
    icon: '/vite.svg',
    badge: '/vite.svg',
    tag: payload.data?.notification_id || 'default',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  // Close the notification
  event.notification.close();

  // This looks to see if the current is already open and
  // focuses if it is
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    })
    .then((clientList) => {
      // If a window is already open, focus it
      for (const client of clientList) {
        if (client.url.includes('/dashboard') && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow('/dashboard');
      }
    })
  );
});